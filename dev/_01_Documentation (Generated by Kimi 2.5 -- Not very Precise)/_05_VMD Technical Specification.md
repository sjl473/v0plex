---
title: VMD Technical Specification
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex
has_custom_tsx: false
tags: [reference, api]
---

# VMD Technical Specification

VMD (v0plex Markdown) is v0plex's extension collection to standard Markdown, designed to address common layout requirements in technical documentation. This chapter details the syntax rules, constraints, and usage scenarios for each VMD tag.

## Design Principles

VMD's design follows several core principles. First, extensions should be declarative rather than imperative—authors describe what the content is, not how it should be presented. Second, syntax should maintain consistency with standard Markdown, using similar markup styles. Third, error handling should be strict and explicit; discovering problems during build is easier to fix than issues at runtime. Finally, extensions should be composable, with different tags usable within reasonable nesting boundaries.

Based on these principles, VMD adopts HTML-like tag syntax but limits the available tags and defines strict nesting rules. This design gives VMD expressive power while avoiding the complexity and security risks of unrestricted HTML.

## The post Tag: Side-by-Side Layout

The `<post>` tag is the most complex component in VMD, implementing side-by-side content layouts with text content on the left and a list of images on the right. This layout is common in technical documentation, such as tutorial step illustrations, API documentation screenshots, and similar use cases.

### Syntax Structure

```markdown
<post>
<lft>

Left-side content supporting standard Markdown syntax.
Can be paragraphs, lists, code, etc.

</lft>
<rt>

![Image 1](../assets/images/a.png)
![Image 2](../assets/images/b.png)

</rt>
</post>
```

The `<post>` tag must contain exactly one `<lft>` child tag and one `<rt>` child tag, in fixed order with left before right. There must be exactly one space or newline separating the child tags.

### lft Content Constraints

Content within the `<lft>` tag supports most inline and block-level elements of standard Markdown, but excludes the following elements for layout stability reasons:

Code blocks (surrounded by three backticks) are not permitted because code block heights are difficult to control and may disrupt the visual balance of side-by-side layouts. If code needs to be displayed, inline code formatting is recommended, or alternative layouts should be considered.

Block-level mathematical expressions (`$$...$$`) are not permitted for the same reason as code blocks. Inline mathematical expressions `$...$` are allowed.

Images (`![alt](src)`) are not permitted—this is the clear division of labor between `<lft>` and `<rt>`: left side handles text, right side handles images.

Blockquotes (`> ...`) are not permitted as they typically have specific visual styling (such as left borders) that may conflict with post container styles.

Other VMD custom tags (`info`, `warning`, `success`, `smallimg`) cannot be nested within `<lft>`.

Additionally, `<lft>` content must have one empty line at both the beginning and end. This means there must be two newline characters (one empty line) immediately after the `<lft>` tag, and two newline characters before the content begins.

### rt Content Constraints

Content within the `<rt>` tag is more strictly limited, only allowing Markdown image syntax. Each image must occupy its own line, with images separated by empty lines. Images must include alternative text (alt text), which is a basic requirement for accessibility.

```markdown
<rt>

![Correct image description](../assets/images/correct.png)

![Another image](../assets/images/another.png)

</rt>
```

As with `<lft>`, `<rt>` content must also have one empty line at both beginning and end.

### Common Errors

During the build, the following situations trigger errors:

Incorrect order or wrong number of `<lft>` and `<rt>` tags reports a format error. Using prohibited elements in `<lft>` (code blocks, block formulas, images, blockquotes) reports a content type error. Non-image content in `<rt>` reports an invalid content error. Missing alternative text on images reports a missing alt attribute error. Incorrect number of spaces or newlines between tags reports a format error.

## Callout Tags

VMD provides three callout tags for highlighting specific types of content: `<info>` for general informational messages, `<warning>` for warnings or important notes, and `<success>` for success messages or best practices.

### Syntax Structure

```markdown
<info>
This is an informational message that can contain **bold**, *italic*, and other inline formatting.
Can also include multiple lines of content.
</info>

<warning>
This is a warning message alerting readers to potential issues.
</warning>

<success>
This is a success message indicating recommended approaches or completed states.
</success>
```

These three tags share identical syntax structures: opening tag, content, closing tag. Content supports standard Markdown inline formatting (bold, italic, inline code, links, etc.) and block-level formatting (paragraphs, lists, plain text).

### Content Constraints

Callout tag content has the following restrictions:

Nesting other VMD custom tags (including other info, warning, success tags, as well as post and smallimg tags) is not permitted. This restriction prevents visual hierarchy confusion and style conflicts.

Code blocks and block-level mathematical expressions are not permitted, for the same reasons as in post tag restrictions: these elements have unpredictable heights that may disrupt the visual presentation of callout boxes.

No additional empty lines are required before or after content; tags should directly wrap the content. However, for readability, it is recommended to use empty lines to separate different paragraphs within tags.

### Visual Presentation

The three callout types are visually distinguished by color and icon. Info typically uses a blue color scheme, warning uses orange, and success uses green. This color coding follows common design conventions, allowing readers to quickly identify the type and importance of information.

## The smallimg Tag: Small Image Annotation

The `<smallimg>` tag is used to insert small-sized images within paragraphs, commonly for icons, thumbnails, or inline example images. Unlike standard Markdown image syntax, `<smallimg>` renders at a fixed small size and does not occupy an entire line.

### Syntax Structure

```markdown
This is a paragraph containing a <smallimg>![icon](../assets/images/icon.png)</smallimg> small image in the text.
```

`<smallimg>` is an inline tag and must begin and end on the same line. The tag must contain exactly one Markdown image syntax with no spaces or other content before or after the image.

### Usage Scenarios

`<smallimg>` is suitable for the following scenarios:

Inserting icons or symbols within paragraphs, such as operating system logos, file type icons, etc. Displaying interface element thumbnails, such as buttons, input field screenshots. Inserting small operation diagrams in step-by-step instructions.

Situations not suitable for `<smallimg>` include: needing to display full-size screenshots, images requiring detailed descriptions, or images containing important text information. In these cases, standard Markdown image syntax or the post tag should be used.

## Tag Nesting Rules

VMD tag nesting is strictly limited to maintain predictable rendering and visual consistency. Understanding these rules helps avoid build errors.

### Prohibited Nesting

The following nesting patterns trigger build errors:

`<post>` cannot be nested within any other VMD tag. This means you cannot use post layouts inside info, warning, or success tags.

`<lft>` and `<rt>` can only appear as direct children of `<post>`, cannot be used independently, and cannot be nested within other tags.

`<info>`, `<warning>`, and `<success>` cannot be nested within each other.

All VMD custom tags cannot be nested within `<lft>`.

### Permitted Nesting

The following nesting patterns are permitted:

Standard Markdown elements (paragraphs, lists, emphasis, etc.) can be nested within any VMD tag, subject to that tag's content constraints.

`<smallimg>` can appear within standard Markdown paragraphs and within the content of `<info>`, `<warning>`, and `<success>` tags.

Lists can be nested within callout tags, which is a common way to organize multi-line tip content.

## Error Handling

v0plex performs strict validation of VMD syntax during the build phase. Any syntax errors prevent build completion and output detailed error information.

### Error Report Format

When VMD syntax errors are detected, the build tool outputs information in the following format:

```
ERROR [VMD-XXXX] Error description
  File: dev/_01_Example/_01_file.md
  Line: 25
  Details: Additional context about the error
```

Error codes (VMD-XXXX) uniquely identify error types for searching solutions. File paths and line numbers precisely locate where errors occur. Detailed information provides specific problem descriptions and possible remediation suggestions.

### Common Error Codes

VMD-1001: EXTENSION_POST_INVALID_FORMAT — The post tag format is incorrect, possibly due to wrong child tag order, incorrect number of tags, or improper separators between child tags.

VMD-1002: EXTENSION_POST_LFT_CODE_BLOCK — Code block used in lft. Solution is to convert code to inline format or consider alternative layouts.

VMD-1003: EXTENSION_POST_LFT_BLOCK_MATH — Block-level mathematical expression used in lft. Solution is to use inline mathematical expressions or move the formula outside the post layout.

VMD-1004: EXTENSION_POST_LFT_IMAGE — Image used in lft. Solution is to move the image to rt or use standard image syntax outside the post layout.

VMD-1005: EXTENSION_POST_LFT_BLOCKQUOTE — Blockquote used in lft. Solution is to rewrite as a normal paragraph or list.

VMD-1006: EXTENSION_POST_RT_INVALID_SPACING — Incorrect spacing in rt content. Check for empty lines after the rt tag and proper separation between images.

VMD-1007: EXTENSION_POST_INVALID_CONTENT — Non-image content in rt. rt can only contain images, not text or other Markdown elements.

## Performance Considerations

VMD tag parsing and rendering introduce some performance overhead, but in normal usage scenarios these overheads are negligible.

During the parsing phase, each VMD tag requires regular expression matching and string processing, with complexity linear to document length. For documents containing large numbers of post layouts, build time may increase slightly.

During the rendering phase, complex layouts (such as post) require more DOM nodes and CSS calculations. On mobile devices, frequent layout changes may affect scrolling performance, but v0plex's responsive design has already been optimized for this.

Recommended usage limits: The number of post tags in a single document should not exceed 20, as excessive side-by-side layouts make pages appear cluttered. The number of images in rt should be limited to 5 or fewer, as too many images cause the right column to become excessively long, disrupting visual balance.
