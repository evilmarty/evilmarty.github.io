---
date: '2026-06-09T08:29:09+10:00'
title: 'Scratching an Itch With Duex'
tags:
- golang
- cli
- utility
---

[Duex](https://github.com/evilmarty/duex) was created out of pure necessity. All I wanted was a simple way to figure out what was using my storage space. Good ol `du` can do the job but using it was cumbersome, mainly because the starting point would always be either the root or home folder. The number of files would be enormous and the output would be overwhelming. I just wanted to know what was taking up space in a specific folder. I wanted to be able to quickly navigate to a folder and run a command that would show me the top 10 largest files and folders. This is what lead me to create [Duex](https://github.com/evilmarty/duex), a disk usage explorer that provides a simple interface to quickly find out what is taking up space in a folder.

![Duex demo](demo.gif)

An example was when my computer was running low on storage space and instead of addressing the problem, I took the opportunity to create a tool I only needed in times such as these. I freed up a bit of space then got to work on [Duex](https://github.com/evilmarty/duex). I knew what I wanted, basically `du` with the interactivity of [fzf](https://github.com/junegunn/fzf). This could have been a simply script, and you could argue that it should have been, but I wanted to create a more robust tool that could be used in a variety of ways. I wanted to be able to use it in a pipeline, for example, to find the largest files in a folder and then delete them. I also wanted to be able to use it in a more interactive way, where I could navigate through the folders and see the sizes of the files and folders as I go.

![Using Duex](using-duex.mov)

It did not take long to get a simple version of [Duex](https://github.com/evilmarty/duex) up and running. With that I was able to find the culprit consuming my storage space and delete it. A few more iterations later and I had a tool that I was happy with. It is not perfect, there are some edge cases that it does not handle well, but it gets the job done. It is a tool that I wont use on a regular basis but it is handy to have available when I do need it. It scratches an itch that I had and it has become a useful tool in my arsenal. If you find yourself in a similar situation where you need a simple tool to solve a specific problem, I encourage you to create it. You never know how useful it might become.
