---
title: What is v0plex
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex->v0plex@outlook.com
has_custom_tsx: false
tags: [guide, getting-started]
---

# What is v0plex

## Overview

v0plex is a static site generator designed for technical documentation authoring. Its core objective is to transform Markdown files into structured static web pages while maintaining a clear separation between content and technical implementation. The design philosophy of v0plex emphasizes content maintainability, build process reliability, and precise control over the final presentation.

Unlike conventional static site generators, v0plex introduces the concept of VMD (v0plex Markdown)—a markup language that extends standard Markdown syntax. These extensions are not intended to add decorative visual effects but rather to address common layout challenges in technical documentation: side-by-side content and images, information callout boxes, mathematical formula display, and more. Through these extensions, v0plex enables authors to describe complex page structures in plain text without delving into frontend development details.

## Architecture

v0plex adopts a three-layer architecture to organize the entire generation workflow. This layered approach ensures system extensibility and maintains clear boundaries of responsibility among components.

### Content Layer

The Content Layer serves as the data source for the v0plex system. All content intended for publication is stored in the `dev/` directory. Files here follow a specific naming convention: both folders and files begin with a `_NN_` prefix, where `NN` is a two-digit number controlling the content's order in the navigation tree. This convention allows authors to manage content hierarchy directly through the filesystem without relying on additional configuration files.

Each Markdown file in the Content Layer includes YAML frontmatter defining document metadata: title, creation date, last update date, author, and more. This metadata is extracted during the build process and used to generate navigation elements, page headers, and other structural components.

### Build Layer

The Build Layer, located in the `vmd_parser/` directory, is responsible for transforming raw content into formats consumable by the Presentation Layer. This TypeScript-based parser performs several operations: scanning the Content Layer directory structure, parsing frontmatter metadata, compiling Markdown to TSX component code, processing and copying image assets, and generating navigation tree data.

The core component of the Build Layer is MarkdownCompiler, which extends the Marked library with VMD-specific syntax parsers. These parsers handle custom tags (such as `<post>`, `<info>`, `<warning>`, etc.), converting them into specific React component invocations. During the build process, any syntax errors are captured and reported in a structured manner, including error type, location, and suggested remediation.

### Presentation Layer

The Presentation Layer is a Next.js-based React application responsible for rendering the final static pages. It imports generated TSX components from the Build Layer and renders them using the custom VMD component library (located in `components/vmd/`).

The visual design of the Presentation Layer is based on the IBM Carbon Design System, giving generated sites a consistent, professional visual style. Carbon's design principles emphasize clarity, simplicity, and functionality—qualities that align perfectly with the needs of technical documentation. The Presentation Layer supports both light and dark themes, allowing readers to switch according to their preference.

## Workflow

The complete v0plex workflow encompasses the entire process from content authoring to site publication. First, authors write Markdown files in the `dev/` directory, using standard Markdown syntax and VMD extension tags to organize content. Then, executing the `pnpm vmd:gen` command triggers the build process, where the parser scans all Markdown files and generates corresponding TSX components and site data structures. Next, the `pnpm lex:gen` command generates search indices for Chinese content, relying on Python's jieba segmentation library for Chinese text tokenization. Finally, the `pnpm build` command invokes Next.js to generate static HTML files, which can be deployed directly to any static hosting service.

The advantage of this workflow lies in the explicit outputs and validation mechanisms at each step. Errors during the build process are reported immediately rather than surfacing after deployment. Additionally, the generated site is completely static, meaning it can run on any hosting service supporting static files without requiring server-side rendering or database support.

## Technology Choices

The technology stack of v0plex has been carefully selected to balance development efficiency, runtime performance, and long-term maintainability. Next.js 14 serves as the foundational framework, providing excellent static export capabilities and a modern development experience. TypeScript ensures type safety in the codebase, which is particularly important in large projects. The IBM Carbon Design System provides proven design patterns and component libraries, guaranteeing visual consistency. Marked serves as the Markdown parsing engine, renowned for its performance and extensibility, providing a solid foundation for VMD syntax implementation.

For Chinese search, v0plex employs the jieba segmentation library, a widely-used tool in Chinese natural language processing that accurately identifies Chinese word boundaries to deliver high-quality search results. This hybrid approach utilizing both Node.js and Python maximizes the strengths of each ecosystem rather than forcing all solutions into a single technology stack.
