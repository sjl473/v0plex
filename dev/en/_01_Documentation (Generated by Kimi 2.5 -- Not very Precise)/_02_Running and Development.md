---
title: Running and Development
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex->v0plex@outlook.com
has_custom_tsx: false
tags: [guide, development]
---

# Running and Development

After installation, you can begin content creation with v0plex. This chapter covers using the development server, details of the build workflow, and fundamental principles of content organization.

## Starting the Development Server

v0plex provides a hot-reload development server that allows real-time preview while editing content. Execute the following in the project root directory:

```bash
pnpm dev
```

This command is actually a combination of three steps: first executing `pnpm vmd:gen` to parse Markdown files, then `pnpm lex:gen` to generate Chinese search indices, and finally starting the Next.js development server. On first launch, the build process may take 30 seconds to 2 minutes depending on the amount of content and system performance.

The development server listens on `0.0.0.0:3000` by default, meaning it can be accessed not only locally via `http://localhost:3000` but also from other devices on the network, provided firewall rules permit. If you need to specify a different port, you can modify the `dev` script in `package.json` by adding the `-p` parameter.

## Content Editing Workflow

v0plex is designed to separate content creation from technical implementation. All content resides in the `dev/` directory, where you can directly create, edit, and delete Markdown files.

File organization follows specific naming conventions. Folders and files begin with a `_NN_` prefix, where `NN` is a two-digit number controlling the display order in the navigation tree. For example, `_01_Quick Start/` appears before `_02_Advanced Topics/`. This naming scheme ensures that ordering does not depend on filesystem timestamps or alphabetical order but is explicitly controlled by the author.

When editing Markdown files, note the frontmatter format requirements. Each file must begin with a YAML metadata block enclosed by three hyphens `---`. Required fields include `title` (display title), `created_at` (creation date), `last_updated_at` (last update date), and `author` (author). The optional field `has_custom_tsx` marks whether the document has an associated custom TSX component.

After saving modifications, the development server automatically rebuilds affected portions. However, automatic reloading may not always take effect completely, especially when frontmatter or file structure is modified. In such cases, press Ctrl+C to stop the server and re-execute `pnpm dev`.

## Adding Image Assets

Technical documentation typically contains numerous screenshots, diagrams, and charts. v0plex manages these resources through the `dev/assets/` directory.

When referencing images in Markdown, use relative paths. For example, a document located under `dev/_01_Guide/` referencing an image in `dev/assets/images/` should use the path `../../assets/images/screenshot.png`. During the build process, v0plex automatically copies these images to the `public/vmdimage/` directory and correctly references them in the final static site.

For image filenames, lowercase letters, numbers, and hyphens are recommended, avoiding spaces and special characters. Although v0plex supports filenames with spaces, spaces require URL encoding, adding unnecessary complications.

## Understanding the Build Workflow

Understanding v0plex's build workflow helps diagnose issues when they arise. The complete build consists of four phases.

The first phase is cleanup. Before building begins, `vmd_parser/cleaner.ts` deletes outputs from the previous build, including the `app/vmdcode/`, `app/vmdjson/`, and `public/vmdimage/` directories. This ensures that old files from deleted content do not persist.

The second phase is Markdown parsing. `vmd_parser/main.ts` traverses the `dev/` directory, reads each Markdown file, parses frontmatter, and compiles Markdown content to TSX code. This phase detects syntax errors such as unclosed custom tags or invalid nesting structures. All errors are displayed in the terminal with the affected file and line number indicated.

The third phase is search index generation. `public/lex.py` reads the parsed content, uses the jieba library to tokenize Chinese text, and generates the inverted index file `public/lexicon.json`. This index supports the document's full-text search functionality.

The fourth phase is static export. Next.js reads the generated TSX components, renders them to HTML files, and outputs to the `gh-page-output/` directory. This directory contains all files needed to deploy the site and can be directly uploaded to any static hosting service.

## Building for Production

When content is ready for deployment to production, execute:

```bash
pnpm build
```

This executes the same parsing and indexing steps as development mode but uses Next.js's production mode for building. The generated HTML is optimized, including code minification, asset hashing, and more. After completion, the `gh-page-output/` directory contains the complete static site.

Build output is displayed in the terminal. If everything is functioning correctly, the final lines should show the number of pages built and total time elapsed. If there are errors, follow the prompts to fix issues and rebuild.

## Debugging Tips

Various issues may be encountered during development. Here are troubleshooting methods for common situations.

If pages display blank or show errors, first check the terminal for build errors. v0plex's error reporting is usually detailed, indicating the problematic file and line number. After fixing, restart the development server.

If the navigation tree does not display correctly, check that filenames conform to the `_NN_` prefix format. Numbers less than two digits require zero-padding, such as `_01_` rather than `_1_`.

If images fail to display, confirm that image paths are correct. In development mode, v0plex validates whether image files exist; if a non-existent file is referenced, an error is reported during build.

If Chinese search returns no results, check whether `pnpm lex:gen` executed successfully. This step depends on the Python environment; if the virtual environment has issues, it may fail silently. You can run `python public/lex.py` separately to view detailed error messages.
