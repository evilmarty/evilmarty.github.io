# Agent Instructions: Marty's Personal Website

This is a personal website built with **Hugo**, styled with **TailwindCSS v4** and **DaisyUI v5**. Layouts and assets live at the repository root (no theme directory).

## Core Tech Stack
- **Static Site Generator:** Hugo (Extended version required for Tailwind support).
- **CSS Framework:** TailwindCSS v4 (using `@tailwindcss/cli`).
- **UI Components:** DaisyUI v5.
- **Package Manager:** NPM (for Tailwind and DaisyUI dependencies).

## Project Structure

### Content (`content/`)
- `content/post/`: Blog posts as [page bundles](https://gohugo.io/content-management/page-bundles/) (each post is a directory containing `index.md` and its assets like images/videos).
- `content/projects/`: Projects as page bundles (each project is a directory containing `index.md` and a `cover.*` image).

### Layouts (`layouts/`)
All layouts are at the repository root — there is no `themes/` directory.
- `baseof.html`: Base template (head, navbar, footer).
- `home.html`: Homepage with hero section.
- `list.html`: Blog post listing.
- `single.html`: Individual blog post with prev/next navigation.
- `projects/section.html`: Projects grid gallery.
- `projects/page.html`: Single project detail page.
- `_markup/`: Custom render hooks for headings, images, links, and code blocks.
- `_shortcodes/`: Custom shortcodes — `image`, `video`, `alert`, `gist`.

### Assets (`assets/`)
- `css/main.css`: Tailwind entry point (imports Tailwind, Typography plugin, and DaisyUI).
- `images/`: Site logo (`logo.svg`), author photo (`author.jpg`), and social media icons.

### Data (`data/`)
- `links.yml`: Social media links used in the navbar and footer (name + url pairs).

### Static (`static/`)
- Files copied as-is to output: `favicon.ico`, `cv.pdf`, `LICENSE`.

### Archetypes (`archetypes/`)
- `default.md`: Fallback template for new content.
- `posts/index.md`: Template for new blog posts.
- `projects/index.md`: Template for new projects (includes `params.url` placeholder).

## Common Tasks for Agents

### 1. Adding a New Blog Post
Create a new page bundle under `content/post/`:
```
content/post/YYYY-MM-DD-slug-name/
├── index.md
└── (optional images/videos)
```
Front matter:
```yaml
---
date: 'YYYY-MM-DDTHH:MM:SSZ'
title: 'Post Title'
tags:
  - tag1
  - tag2
---
```
Reference bundled images in content using the `image` shortcode: `{{</* image "filename.jpg" */>}}`.

### 2. Adding a New Project
Create a new page bundle under `content/projects/`:
```
content/projects/project-name/
├── index.md
└── cover.jpg  (or cover.png — displayed in the gallery grid)
```
Front matter:
```yaml
---
date: 'YYYY-MM-DDTHH:MM:SSZ'
title: 'Project Name'
params:
  github: "https://github.com/user/repo"   # optional
  url: "https://example.com"                # optional
tags:
  - technology
---
Project description in markdown.
```

### 3. Modifying Styles
- **Global Styles:** Edit `assets/css/main.css`.
- **Component Styles:** Use Tailwind utility classes directly in `.html` layout files under `layouts/`.
- **Theme/Colors:** Change the `data-theme` attribute in `layouts/baseof.html` (e.g., `light`, `dark`, `cupcake`, etc. from DaisyUI's themes).

### 4. Building and Development
- **Local Dev:** `hugo server -D`
- **Build:** `hugo`
- **Dependency Update:** `npm update`

## Architectural Notes
- **No Theme Directory:** All layouts and assets are at the repository root, not inside `themes/`.
- **CSS Processing:** Hugo's `css.TailwindCSS` pipe is used in `baseof.html` to process `assets/css/main.css` via the Tailwind CLI from `node_modules`.
- **Page Bundles:** Both posts and projects use Hugo leaf bundles — each piece of content is a directory with `index.md` and co-located assets (images, videos). Reference bundled resources via shortcodes or `.Resources` in templates.
- **Cover Images:** Projects and posts can include a `cover.*` file in their bundle, rendered by templates using `.Resources.Match "cover.*"`.
- **Data-Driven Footer:** Social links in the footer/homepage are sourced from `data/links.yml` via `hugo.Data.links`.
- **Taxonomies:** Tags are the only taxonomy (`hugo.yaml`). Both posts and projects use tags.
- **Markdown Rendering:** Custom render hooks in `layouts/_markup/` style headings, images, links, and code blocks (including a DaisyUI `mockup-code` treatment for `shell` code blocks).

## Constraints
- **Do not** manually edit files in `public/`; they are overwritten on every build.
- **Prefer** Tailwind utility classes over custom CSS rules.
- **Maintain** the mobile-responsive navbar and card layouts.
