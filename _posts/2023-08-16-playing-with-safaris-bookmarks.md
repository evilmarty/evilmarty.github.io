---
layout: post
title: Playing with Safari's bookmarks
tags:
- safari
- python
- elixir
date: 2023-08-16 11:31 +1000
---
My journey playing with Safari's bookmarks began unexpectedly trying to find an easy way to access Elixir module documentation. I keep a lot of docs stored locally and Elixir's `mix` tool makes it easy to download and access. The problem is that I don't want to always have to type a command in the terminal to launch it and navigating folders in the Finder feels cumbersome. I use bookmarks extensively and would like to simply have a folder of docs accessible in the browser. And so the adventure begins.

The first step is to sift through all the docs to figure out how best to collate them into a list of titles and URLs. This was easy to do by just running a simple command:

```shell
for file in $(find -s ~/.hex/docs -name "index.html" -depth 4); do
  # depth is used to ensure we're retreiving the module's main index.html
  title=$(xq -q title "$file")  # xq is to XML what jq is to JSON
  path=$(realpath "$file")  # get the absolute path
done
```

The easy part was done. Now the tricky part was to figure out how to inject this into folder in Safari's bookmarks. Whilst I could of looked into AppleScript, I am not a fan of the language and wanted to leave it as a last resort. Fortunately it didn't take long to discover that Safari stores all bookmarks in a single file `~/Library/Safari/Bookmarks.plist`. Perfect! This is almost done and dusted... I cannot seem to access it via the terminal.

```
Operation not permitted (os error 1)
```

This was not the first time I came across this issue but it had been a while. A quick look in my System Settings > Privary & Security > Full Disk Access and I find my terminal does not have this enabled. A toggle later and Safari's gooey innards are mine to play with.

![Ensure terminal has Full Disk Access]({{ "/assets/images/terminal-full-disk-access.png" | resize: "500x500>" | relative_url }})

The time came to peak into bookmarks are structured by Safari. I used `plutils`, which is provided by Xcode's command-line tools, to look and got something fairly straightforward. My next thought was to try get the data into `jq`, which makes easy work of modifying JSON. For some reason `plutil` does not like outputting the file into JSON but has no complaints about XML. At this point I went down the rabbit hole of thinking that there was more to the file format and structure than I thought. Along story short, this did not steer me in a sensible direction.

My next plan of attack was to look at other tools or libraries. In my search I noticed that Python includes [PLIST module](https://docs.python.org/3/library/plistlib.html) in its standard library. I've been writing a lot of Python at my work so it's not something I'm unfamiliar with but the fact it's in the standard library was a big selling point. I was convinced, I would write a CLI to manipulate Safari's bookmarks and use it in the script I started writing. I first needed to validate this idea with a prototype.

It did not take too long to get a Python script that injected an entry into `Bookmarks.plist`. [plistlib](https://docs.python.org/3/library/plistlib.html) simply loads a file and returns a dictionary. As soon as the file is updated Safari instantly updates its UI with the bookmark! This was going to work perfectly but I hate having to deal with convoluted dictionaries. Whilst my intention was to use only modules from the standard library I did make one exception by using [Pydantic](https://github.com/pydantic/pydantic). I've been using it a lot at work and just makes it easy to scaffold complex data structures.

The end result became [safari-bookmarks-cli](https://github.com/evilmarty/safari-bookmarks-cli). This was my first Python project that I started from scratch and I have some thoughts about the developer experience but will leave that for another time. I now had a utility that made it easy to manipulate Safari's bookmarks so the journey could continue.

With my new tool I could update the previous script to be able to add entries as so:

```shell
for file in $(find -s ~/.hex/docs -name "index.html" -depth 4); do
  # depth is used to ensure we're retreiving the module's main index.html
  title=$(xq -q title "$file")  # xq is to XML what jq is to JSON
  path=$(realpath "$file")  # get the absolute path
  safari-bookmarks add --to "Elixir Docs" --url "file://${path}" "$title"
done
```

This worked well but the issue now is that re-running this code will append the entries to the list. I needed to only add entries that did are not already included, or remove all entries. Since this is all contained in a folder (Elixir Docs) I don't have an issue with this approach.

```shell
# Use the --format argument to only print the id and use that to remove it
safari-bookmarks --format '{id}' list "Elixir Docs" | xargs -n 1 safari-bookmarks remove

# I could also have simply removed the folder and created it, but then it would lose its position
safari-bookmarks remove "Elixir Docs"
safari-bookmarks add --list "Elixir Docs"
```

One final touch is that over time new versions of modules and their respective docs accumulate and make the older versions redundant. To reduce the clutter of including older versions I want them purged. A little bit of script-fu and the end result:


```shell
for dir in $(find ~/.hex/docs -type d -depth 2); do
  # list and sort all subfolders in the module and omit the last entry, which is the latest version
  find -s "$dir" -type d -depth 1 | head -n -1 | xargs -p rm -r
done

safari-bookmarks --format '{id}' list "Elixir Docs" | xargs -n 1 safari-bookmarks remove

for file in $(find -s ~/.hex/docs -name "index.html" -depth 4); do
  # depth is used to ensure we're retreiving the module's main index.html
  title=$(xq -q title "$file")  # xq is to XML what jq is to JSON
  path=$(realpath "$file")  # get the absolute path
  safari-bookmarks add --to "Elixir Docs" --url "file://${path}" "$title"
done
```

And that's the story of how I met Safari's `Bookmarks.plist`. It was a great learning experience finding better ways to improve interactions with my daily web browser and spired the creation of better utilities that others may find useful.
