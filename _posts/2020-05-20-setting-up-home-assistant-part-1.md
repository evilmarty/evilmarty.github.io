---
layout: post
title: Setting up Home Assistant/Hassio (Part 1)
tags: [ homeassistant, centos, poweredge ]
---

My multi-part guide on setting up [Home Assistant](https://home-assistant.io) on a Dell
PowerEdge R420 running CentOS 7.

# Prologue

At the end of last year my workplace was moving offices and as such was culling
unnecessary items before the move. One of the things they were disposing were
2015 Dell PowerEdge R610 and R40 servers. I snatched them up in an instant.

After I got these heavy beasts home the next question was what to do with them?
The hard drives were removed so the first point of call was to get replacements.
I decided to get a cheap 1Tb hard drive for the R610 (which supports 2.5" bays)
but some bad search results from the computer part supplier website made me
order a 3.5" drive instead. This was fortunate as the R420 is smaller and
lighter than the R610. I also transferred the memory from the R610 into the
R420, which happen to be of the same type, for a total of 24Gb!

I began getting the R420 up and running by installing Ubuntu 18.04, my default
Linux OS, but ran into issues getting the network interface working. Dell's
website says that Ubuntu 10.04 is officially supported on the R610 but nothing
about R420. So I switched to running CentOS 7, which is supported.

Shortly after getting the R420 up and running my Home Assistant instance, running
on a Raspberry Pi 3, became corrupted. I managed to salvage the config files but
the OS was unrecoverable. I took this as an opportunity to move Home Assistant
onto the R420.

Initially I wanted to run Kubernetes on the R420 but that seemed
too difficult given it's meant to run in a cluster. I switched to using Docker
Swarm and in the beginning things were starting out well but I was soon becoming
annoyed at the leg work required to get every application setup and running. It
was at this point that I noticed that Home Assistant (previously Hassio) can be
installed ad-hoc. This was one of the reasons I had Home Assistant running on
the Raspberry Pi, was for it's super simple container management and update
mechanism. It was decided, this was the direction I am going to take.

# Preparation

Before you begin I strongly recommend you setup LVM. I initially did not nor
realised CentOS installed and setup LVM to allocate 95% of my storage to `/home`
and everything else to `/`. It wasn't long until issues appeared and I had to
resize and remap partitions.

My filesystem setup looks something like:

```
Filesystem                 Size  Used Avail Use% Mounted on
devtmpfs                    12G     0   12G   0% /dev
tmpfs                       12G     0   12G   0% /dev/shm
tmpfs                       12G  250M   12G   3% /run
tmpfs                       12G     0   12G   0% /sys/fs/cgroup
/dev/mapper/centos-root     50G  2.3G   48G   5% /
/dev/sda2                 1014M  290M  725M  29% /boot
/dev/sda1                  200M   12M  189M   6% /boot/efi
/dev/mapper/centos-home     10G   33M   10G   1% /home
/dev/mapper/centos-docker  100G  4.7G   96G   5% /var/lib/docker
/dev/mapper/centos-hassio  500G   25G  476G   5% /usr/share/hassio
```

You should definitely partition `/var/lib/docker`, but I also recommend you
partition `/usr/share/hassio` (or wherever you install Home Assistant). This is
because some addons can use a lot of space, like mine did.

If you plan to simply extend the default volume `centos` then you can do:

```shell
# Create the logical volumes. You can change "100G" to any other value. I
# recommend no less than 50G.
$ sudo lvcreate --name docker -l 100G centos
$ sudo lvcreate --name hassio -l 100G centos

# Format the newly created volumes
$ sudo mkfs.xfs /dev/centos/docker
$ sudo mkfs.xfs /dev/centos/hassio

# Create the folders which we'll use as the mount points in the next step
$ sudo mkdir -p /var/lib/docker /usr/share/hassio
```

The next step is to update `/etc/fstab` by adding the following lines:

```
/dev/mapper/centos-docker /var/lib/docker       xfs     defaults        0 0
/dev/mapper/centos-hassio /usr/share/hassio     xfs     defaults        0 0
```

The final step is just to mount the new volumes:

```shell
$ sudo mount /var/lib/docker
$ sudo mount /usr/share/hassio
```

Now you're thinking with logical volumes!

# Installation

To install Home Assistant (formally known as Hassio) we're going to perform a
"supervised" installation on CentOS 7. I won't go into detail on how to install
and configure the OS but will assume you have a working setup ready. I followed
the [official
instruction](https://github.com/home-assistant/supervised-installer) (which have
now become unsupported).

To kick things off we need to install Docker. Following the [official Docker
installation guide](https://docs.docker.com/engine/install/centos/) run the
following commands:

```shell
$ sudo yum install -y yum-utils
$ sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
$ sudo yum install docker-ce docker-ce-cli containerd.io
```

Next we install the remaining dependencies except for `apparmor-utils` as CentOS
7 doesn't support AppArmor and instead uses SELinux. 

```shell
$ sudo yum install -y jq curl avahi-daemon dbus
```

`network-manager` is
already installed on CentOS which says us the hassle of configuring that as our
network manager.

We are now ready to install Hassio:

```shell
$ curl -sL https://raw.githubusercontent.com/home-assistant/supervised-installer/master/installer.sh | sudo bash -s -- -m qemux86-64
```

If things succeed then you should have a running instance located at
`/usr/share/hassio`. You should be able to verify by checking Docker processes.

```shell
$ sudo docker ps
CONTAINER ID        IMAGE                                            COMMAND                  CREATED             STATUS              PORTS                                                                                                                                                                                                                                            NAMES
eb88143aa7c5        homeassistant/amd64-hassio-audio:14              "/init"                  5 hours ago         Up 5 hours                                                                                                                                                                                                                                                           hassio_audio
323f3b2a0c99        homeassistant/amd64-hassio-dns:9                 "/init coredns -conf…"   5 hours ago         Up 5 hours                                                                                                                                                                                                                                                           hassio_dns
61ca18fe23d3        homeassistant/amd64-hassio-multicast:2           "/init"                  5 hours ago         Up 5 hours                                                                                                                                                                                                                                                           hassio_multicast
9cc6347226f6        homeassistant/amd64-hassio-cli:25                "/init /bin/bash -c …"   5 hours ago         Up 5 hours                                                                                                                                                                                                                                                           hassio_cli
cc8cff4de4f9        homeassistant/qemux86-64-homeassistant:0.109.6   "/init"                  8 days ago          Up 3 hours                                                                                                                                                                                                                                                           homeassistant
6a5bf40f38cc        homeassistant/amd64-hassio-supervisor            "/init"                  11 days ago         Up 5 hours                                                                                                                                                                                                                                                           hassio_supervisor
```

# Configuration

After getting Home Assistant up and running the next step was to configure it
again. I figured I'd start from scratch rather than importing my previous
installation. First things first is to install some addons! That is the whole
point of endeavour after all.

The first addon to install is the File Editor. Whilst I actually installed it
via the web UI, this is the command to run if you wish to install via the
terminal.

```shell
ha addons install core_configurator
```

The next thing to install, that I highly recommend, is MariaDB so Home Assistant
can store all state history. If you're like me and have many devices you most
likely will have a lot of history and performing lookup en masse can be quite
slow using the default SQLite database.

```shell
ha addons install core_mariadb
```

Then add the following to your `configuration.yaml`:

```yaml
recorder:
  db_url: mysql://homeassistant:homeassistant@core-mariadb/homeassistant?charset=utf8
```

The MariaDB addon defaults the credentials to `homeassistant`, so if you change
them you'll need to change them here too. Every addon has a unique ID which is
also used internally for DNS. `core-mariadb` is the DNS name for the MariaDB
addon container.

Non-core addons will be prefixed with a unique hash related to the origin repo
name instead of `core`. For more information on addon networking please read the
[developer addon
guide](https://developers.home-assistant.io/docs/add-ons/communication#network).

# Up next

This wraps up Part 1. In the next installment I'll go into detail on adding
custom addons and addon repos and other customisations.
