---
layout: post
title: datemate rewritten
tags:
- datemate
- app
- javascript
- css
date: 2022-06-20 20:01 +1000
---
While in between jobs I decided to set myself some small goals to remain
productive but also be able to deliver them. Usually when I begin a personal
project I don't even think how long it might take me to complete. This has lead
me to take on very large projects with little to no chance of being in a usable
state yet alone done. This time I took a different approach to only tackle
small projects. This lead to actually accomplishing a complete rewrite of
[datemate](https://marty.zalega.me/datemate) and
[ilc](https://github.com/evilmarty/ilc), which I'll talk about another time.

For those that don't know what [datemate](https://marty.zalega.me/datemate) is,
it's a handy web app that helps you figure out dates without having to think
long or use calendars etc. If you ever find yourself asking "what is the date
7 weeks from now" or "what day of the week was April 2nd?" etc then you might
find it helpful.

![](/assets/videos/datemate-desktop-example.m4v)

I rewrote datemate using [Solid JS](https://solidjs.com),
[Typescript](https://typescriptlang.org), and [Tailwind
CSS](http://tailwindcss.com). The result was an [82% reduction in
code](https://github.com/evilmarty/datemate/commit/914428069f24548beca9b13aae1765998cf7f117)
and approx 72% reduction in bundle size. This is not a heavy app to begin with
but I do like to keep things to a minimal as much as possible. That is a
minimum of code, a minimum set of dependencies, etc. I can't claim that the
benefits were entirely from a different implemention, much of the logic in the
application did change too as well as not all of the functionality was carried
across. Some of the functionality I did not believe was useful so they were
left behind. If I find it useful again then I can re-add it.

Part of the reason for the rewrite was simply to gain practise to Solid JS and
Typescript. Both are new technologies for me, the latter being exposed at my
previous job and wanted to dabble with it. Solid JS was interesting as a
kind of re-imaginated [React JS](https://reactjs.org) but highly efficient and
focus on the web. It did take a few attempts at building datemate to understand
how Solid JS worked and be comfortable with it. Coming from React, it certainly
is different despite looking very similar. I found the implicit dependency
tracking impressive and something I did not have to think much about. There is
more to learn, perhaps in my next project.
