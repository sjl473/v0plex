# Deployment Guide

v0plex builds a standard Next.js application that can be deployed to an Nginx server or Github Pages.

## Build Process

When running the build command, v0plex executes a series of operations. First, it runs the VMD compiler to convert Markdown files in the `dev/` directory into React components. Then it runs the lexicon generation script to prepare data for the search function. Finally, it runs the Next.js build to generate optimized static files.

```bash
pnpm run build
```

After the build is complete, the output is in `gh-page-output`:

```
├── gh-page-output
........... static deployment files
```

In development mode, running the dev command enables hot reloading. However, because this project compiles Markdown content into TSX pages, instant updates for `page/` pages are not possible, and a second restart is required:

```bash
pnpm run dev
```

## Deployment in an Offline Environment (To Be Continued)

todo
