---
layout: post
title: Hacking the Momentum Niro Wi-Fi Garage Door Controller
tags: [ momentum, homeassistant, garage, camera, hacking ]
---

```
Update: Momentum released updated their firmware on June 25 2020 which removes access that was exposed in this article.
```

Momentum's [Niro Wi-Fi Garage Door Controller](https://momentumcam.com/products/garage-door-controller) is a web camera and garage controller in-one. Despite having a decent app to control the device my intention was to integrate it with [Home Assistant](https://home-assistant.io). Unfortunately there is no public API or integrations available at the time so I ended up hacking the device in order to do so.

![Garage camera and controls in Home Assistant](/assets/images/home-assistant-overview-garage-camera.png)

**A word of caution.** The methods used here are not nefarious but does expose sensitive information such as password and network information which might be captured unintentially in logs or elsewhere. Please be mindful and aware so not to cause intended exposure.

# Getting started

First steps are to setup the device via the mobile app. I won't go into detail because those instructions are included with the device and from the manufacturer's website.

Once the device is working on your network and garage controls functioning it's time to dissect the communication between the app and the device.

![Momentum app running](/assets/images/momentum-app.png)

*[MITM]: Man In The Middle
Now we need a way to sniff the app's network communicate. I'm using Android, which might be easier than on iOS? I installed [HttpCanary](https://play.google.com/store/apps/details?id=com.guoshi.httpcanary.premium&hl=en_US) but you can probably use any MITM proxy. I opted for this app as it doesn't require *root* device access plus includes a custom version of Parallel Space as a work around for adding root certificates.

Depending on your choice of MITM proxies, there may be a lot of noise from apps and services running on the device. A neat feature of HTTP Canary is app targetting. If your tool supports some kind of filtering I recommend you use it.

# Analysis

With our app and sniffer ready to roll lets fire them up and see what's we can find. Once I activated capture in HTTP Canary it's time to open the Momentum App and watch the capture logs come in.

![HTTP Canary capture of Momentum App](/assets/images/http-canary-capture-momentum-app.jpg)

There's quite a lot of requests being made from the app, mostly analytical. Inspecting the traffic the requests that stand out are to `https://api.pepperos.io`. This seems to be the main backend that populates the app's interface. Upon inspecting the response for `https://api.pepperos.io/account/devices` we hit paydirt.

![HTTP Canary capture for https://api.pepperos.io/account/devices](/assets/images/http-canary-capture-account-devices.jpg)

*[RTSP]: Real Time Streaming Protocol
The response payload includes information about the device, its network, preview thumbnail, and an RTSP video URL with credentials! I tested the URL by opening it in [VLC](http://www.videolan.org/).

![Video stream in VLC](/assets/images/vlc-garage-camera.png)

The next piece was to figure out to control the garage door. It took me a while to figure out how to get the app to communicate with the device, and probably the trickiest. After numerous attempts I managed to capture a TCP request to the device on port `9030`. To check if this was the magic command I sent the same payload using `netcat`:

```shell
$ echo '{"req": "toggle garage door state", "number": 1}' | netcat x.x.x.x 9030
{"res":"toggle garage door state","success":"true","number":1}
```

It worked! The "number" is always `1` unless you have more than one garage door connected to the device, which should be `2` etc.

Unfortunately I lost the captured log and have since been unable to re-capture it. I do believe the app checks the network and if is the same as the device occasionally communicates with it directly. Other times it will send an encrypted payload to a remote server. The app does numerous checks with remote servers so intercepting all requests were difficult.

# Configuration

I have what I wanted so the next step is to add them to Home Assistant. The first step is getting the camera configured. This is simple by using the [FFMPEG Camera integration](https://www.home-assistant.io/integrations/camera.ffmpeg/) like so:

```yaml
camera:
  - platform: ffmpeg
    name: garage
    input: "-rtsp_transport tcp -i rtsp://appagent:streaming@x.x.x.x:554/h264/ch1/main/av_stream"
```

I thought the switch would be more difficult but Home Assistant has us covered with its [Telnet integration](https://www.home-assistant.io/integrations/telnet/). It's simply text to a port after all. The only caveat is that the command is a toggle, not an absolute. There's no way to know what state the mechanism is in. The configuration ends up looking like:

```yaml
switch:
  - platform: telnet
    switches:
      garage_door:
        name: Garage Door
        resource: x.x.x.x
        port: 9030
        command_on: '{"req": "toggle garage door state", "number": 1}'
        command_off: '{"req": "toggle garage door state", "number": 1}'
```

What this means is that triggering the switch will toggle it no matter what state Home Assistant thinks it is. This is a suitable compromise as I can see the state from the video stream.

# Final thoughts

The device appears to be running a system called Pepper OS. Research into this has yielded little results. From what I have managed to inspect and gather is it utilised [libnice](https://libnice.freedesktop.org/), probably for two-way communication. Port 9030 is open and provides some level of interactivity with the device but the app rarely utilises it. Perhaps it's used in legacy versions of the application whilst newer versions use a more secure/cryptic mechanism. This does lead me to believe that some of the feautures (at least) are operated by different systems, and not inline with the base OS's best practise.

There's many more features, such as two-way audio and disabling the camera, which could be implemented. I have no desire to do so at this time. What I would like to do is disable the device from phoning home. There are two options, the easiest is to block DNS whilst the other is to try compromise the device somehow to gain control. The latter might be too difficult but curiousity might tempt me to open the device up in hopes there's physical avenues for access.
