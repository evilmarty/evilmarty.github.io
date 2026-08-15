#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const HTML_IMG_RE =
  /<img\b[^>]*?\bsrc=(['"])(?<url>data:image\/[^'"]+)\1[^>]*?>/gi;
const MARKDOWN_IMG_RE = /!\[(?<alt>[^\]]*)]\(\s*(?<url>data:image\/[^)\s]+)(?:\s+['"][^'"]*['"])?\s*\)/gi;
const WIDTH_RE = /\bwidth\s*=\s*(['"]?)([^'" >]+)\1/i;
const HEIGHT_RE = /\bheight\s*=\s*(['"]?)([^'" >]+)\1/i;
const ALT_RE = /\balt\s*=\s*(['"])(.*?)\1/i;
const DATA_URL_RE = /^data:(?<mime>[^;,]+)?(?<params>(?:;[^,]*)*?),(?<data>[\s\S]*)$/i;

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

function parsePixelValue(raw) {
  if (!raw) return null;
  const match = String(raw).match(/\d+/);
  return match ? Number(match[0]) : null;
}

function findMatches(content) {
  const matches = [];

  for (const m of content.matchAll(HTML_IMG_RE)) {
    const tag = m[0];
    const dataUrl = m.groups?.url;
    if (!dataUrl) continue;
    const localIndex = tag.indexOf(dataUrl);
    if (localIndex < 0 || typeof m.index !== "number") continue;

    const width = parsePixelValue(tag.match(WIDTH_RE)?.[2]);
    const height = parsePixelValue(tag.match(HEIGHT_RE)?.[2]);
    const alt = tag.match(ALT_RE)?.[2] ?? null;

    matches.push({
      start: m.index + localIndex,
      end: m.index + localIndex + dataUrl.length,
      dataUrl,
      alt,
      width,
      height,
    });
  }

  for (const m of content.matchAll(MARKDOWN_IMG_RE)) {
    const dataUrl = m.groups?.url;
    if (!dataUrl || typeof m.index !== "number") continue;
    const localIndex = m[0].indexOf(dataUrl);
    if (localIndex < 0) continue;

    matches.push({
      start: m.index + localIndex,
      end: m.index + localIndex + dataUrl.length,
      dataUrl,
      alt: m.groups?.alt ?? null,
      width: null,
      height: null,
    });
  }

  matches.sort((a, b) => a.start - b.start);
  return matches;
}

function decodeDataUrl(dataUrl) {
  const parsed = DATA_URL_RE.exec(dataUrl);
  if (!parsed?.groups) {
    throw new Error("Invalid data URL format");
  }

  const mime = (parsed.groups.mime || "application/octet-stream").toLowerCase();
  const params = (parsed.groups.params || "").toLowerCase();
  const payload = parsed.groups.data || "";

  if (params.includes(";base64")) {
    const cleaned = payload.replace(/\s+/g, "");
    return { mime, bytes: Buffer.from(cleaned, "base64") };
  }

  return { mime, bytes: Buffer.from(decodeURIComponent(payload), "utf-8") };
}

function extensionForMime(mime) {
  return MIME_TO_EXT[mime] || "bin";
}

async function resizeImage(bytes, mime, width, height) {
  if (!width && !height) return bytes;
  if (mime === "image/svg+xml") return bytes;

  const image = sharp(bytes, { failOn: "none" });
  const metadata = await image.metadata();
  let targetWidth = width;
  let targetHeight = height;

  if (!targetWidth && targetHeight && metadata.width && metadata.height) {
    targetWidth = Math.round((metadata.width * targetHeight) / metadata.height);
  } else if (!targetHeight && targetWidth && metadata.width && metadata.height) {
    targetHeight = Math.round((metadata.height * targetWidth) / metadata.width);
  }

  if (!targetWidth || !targetHeight) return bytes;

  return image
    .resize({
      width: targetWidth,
      height: targetHeight,
      fit: "fill",
    })
    .toBuffer();
}

function slugify(input) {
  const normalized = String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "image";
}

async function ensureUniquePath(dirPath, baseName, ext, bytes) {
  let attempt = 0;
  while (attempt < 1000) {
    const candidate = `${baseName}${attempt === 0 ? "" : `-${attempt}`}.${ext}`;
    const fullPath = path.join(dirPath, candidate);

    try {
      const existing = await fs.readFile(fullPath);
      if (existing.equals(bytes)) return candidate;
      attempt += 1;
      continue;
    } catch {
      return candidate;
    }
  }

  throw new Error(`Unable to find unique filename for ${baseName}.${ext}`);
}

function applyReplacements(content, replacements) {
  if (replacements.length === 0) return content;

  let output = "";
  let cursor = 0;

  for (const replacement of replacements.sort((a, b) => a.start - b.start)) {
    output += content.slice(cursor, replacement.start);
    output += replacement.value;
    cursor = replacement.end;
  }

  output += content.slice(cursor);
  return output;
}

async function processMarkdownFile(mdFilePath, shouldWrite) {
  const content = await fs.readFile(mdFilePath, "utf-8");
  const matches = findMatches(content);
  if (matches.length === 0) {
    return { changed: false, extracted: 0, resized: 0 };
  }

  const seenUrls = new Map();
  const replacements = [];
  let extracted = 0;
  let resized = 0;

  for (const match of matches) {
    if (seenUrls.has(match.dataUrl)) {
      replacements.push({
        start: match.start,
        end: match.end,
        value: seenUrls.get(match.dataUrl),
      });
      continue;
    }

    const { mime, bytes } = decodeDataUrl(match.dataUrl);
    const transformed = await resizeImage(bytes, mime, match.width, match.height);
    const ext = extensionForMime(mime);
    const altBase = slugify(match.alt);
    const filename = await ensureUniquePath(
      path.dirname(mdFilePath),
      altBase,
      ext,
      transformed,
    );
    const outputPath = path.join(path.dirname(mdFilePath), filename);

    if (shouldWrite) {
      let existing = null;
      try {
        existing = await fs.readFile(outputPath);
      } catch {
        existing = null;
      }
      if (!existing || !existing.equals(transformed)) {
        await fs.writeFile(outputPath, transformed);
      }
    }

    replacements.push({
      start: match.start,
      end: match.end,
      value: filename,
    });

    seenUrls.set(match.dataUrl, filename);
    extracted += 1;
    if (!bytes.equals(transformed)) resized += 1;
  }

  const updated = applyReplacements(content, replacements);
  const changed = updated !== content;
  if (changed && shouldWrite) {
    await fs.writeFile(mdFilePath, updated, "utf-8");
  }

  return { changed, extracted, resized };
}

async function collectMarkdownFiles(inputs) {
  const results = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && fullPath.toLowerCase().endsWith(".md")) {
        results.push(fullPath);
      }
    }
  }

  for (const input of inputs) {
    const full = path.resolve(input);
    let stat;
    try {
      stat = await fs.stat(full);
    } catch {
      continue;
    }

    if (stat.isFile() && full.toLowerCase().endsWith(".md")) {
      results.push(full);
    } else if (stat.isDirectory()) {
      await walk(full);
    }
  }

  results.sort();
  return results;
}

function printHelp() {
  console.log(
    [
      "Extract data:image URLs from Markdown/HTML image tags, save them alongside source files, and rewrite references.",
      "",
      "Usage:",
      "  node scripts/extract-data-url-images.cjs [--write] [path ...]",
      "",
      "Examples:",
      "  node scripts/extract-data-url-images.cjs content",
      "  node scripts/extract-data-url-images.cjs --write content/post/2026-08-15-rebuilding-my-ring-light/index.md",
    ].join("\n"),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const shouldWrite = args.includes("--write");
  const showHelp = args.includes("-h") || args.includes("--help");

  if (showHelp) {
    printHelp();
    return 0;
  }

  const paths = args.filter((arg) => arg !== "--write");
  const inputs = paths.length > 0 ? paths : ["content"];
  const mdFiles = await collectMarkdownFiles(inputs);

  if (mdFiles.length === 0) {
    console.log("No Markdown files found.");
    return 0;
  }

  let changedCount = 0;
  let totalExtracted = 0;
  let totalResized = 0;

  for (const file of mdFiles) {
    const result = await processMarkdownFile(file, shouldWrite);
    if (!result.changed) continue;

    changedCount += 1;
    totalExtracted += result.extracted;
    totalResized += result.resized;

    console.log(
      `[${shouldWrite ? "updated" : "would update"}] ${file} (images: ${
        result.extracted
      }, resized: ${result.resized})`,
    );
  }

  if (changedCount === 0) {
    console.log("No data URL images found.");
    return 0;
  }

  console.log(
    `${shouldWrite ? "Updated" : "Would update"} ${changedCount} file(s); extracted ${totalExtracted} image(s), resized ${totalResized}.`,
  );
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`[error] ${err.message}`);
    process.exit(1);
  });
