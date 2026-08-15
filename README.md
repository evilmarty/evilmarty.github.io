Fansite for the mighty evilmarty.

Take a look-see at [marty.zalega.me](http://marty.zalega.me)

## Data URL image extraction

Use the Node.js script below to extract `data:image/...` URLs in markdown/HTML `<img>` tags into image files saved next to the source `.md` file, then rewrite references to those files.

```bash
# dry-run
node scripts/extract-data-url-images.cjs content

# write changes and extracted files
node scripts/extract-data-url-images.cjs --write content
```

If `width` and/or `height` attributes are present on an HTML `<img>` tag, the extracted image is resized accordingly.
