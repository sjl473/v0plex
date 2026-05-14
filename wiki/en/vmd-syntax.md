# VMD Syntax Reference

VMD is v0plex's Markdown extension syntax. It retains most of the structural similarities with Markdown, but adds some extra markup for more accurate TSX page parsing.

## Frontmatter

Every Markdown file must start with a frontmatter. Frontmatter is a key-value configuration block wrapped in three dashes, used to configure page information. The Markdown used by v0plex differs from standard GitHub Flavored Markdown in some extended syntaxes.

v0plex generates page titles, navigation item names, and other information based on this title. **Users of v0plex** only fill in the following fields; no extra fields are allowed:

- `title`: Page title
- `created_at`: Page creation date, format `YYYY-MM-DD` or `@git`
- `last_updated_at`: Last updated date, format `YYYY-MM-DD` or `@git`
- `author`: Author information
- `tags`: Tag list, format `[tag1, tag2]`
- `has_custom_tsx`: Whether to use custom React components, value `true` or `false` (string)

For example:

```yaml
---
title: Quick Start
created_at: 2024-01-01
last_updated_at: 2024-01-15
author: Zhang San->zhangsan@example.com
tags: [tutorial, getting-started]
has_custom_tsx: false
---
```

### Auto-Filling Dates and Authors

v0plex can automatically maintain date and author information. `created_at: @git` looks up the date the file was first committed (earliest commit). `last_updated_at: @git` looks up the date of the file's most recent modification (latest commit). `author: @git` retrieves all committers of the file in git history (sorted by commit time from oldest to newest, automatically deduplicated), in the format `Name->Email`.

```yaml
---
created_at: @git
last_updated_at: @git
author: @git
---
```

The prerequisite for using the `@git` placeholder is that your project uses git for version control, and the file has already been committed. In remote mode, v0plex will clone your configured content repository and read its git history. In local mode, v0plex uses the current project's git history.

### How to Insert Multiple Authors on a Page

The `author` field supports multiple formats; separate multiple authors with `|`:

- Name only: `Zhang San`
- Name and email (connected with `->`): `Zhang San->zhangsan@example.com`
- Using the `@git` placeholder: `@git`
- Mixed form: `Zhang San | Li Si->lisi@example.com | @git`, which means Zhang San, Li Si, and all committers in the file's git history will be displayed on the author line.

### Tags (Not Yet Fully Implemented)

todo

## Math Formulas

VMD supports math formula rendering using MathJax syntax.

### Inline Math

Formulas wrapped in single dollar signs are rendered inline. For example, `$E = mc^2$` displays as Einstein's mass-energy equation. Inline formulas are suitable for short mathematical expressions.

```markdown
The energy-mass conversion formula is $E = mc^2$, where $E$ is energy, $m$ is mass, and $c$ is the speed of light.
```

### Block Math

Formulas wrapped in double dollar signs are displayed independently. Block-level formulas are suitable for complex derivations or important mathematical expressions.

```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

## Alert Boxes

Alert boxes are used to highlight important information in documentation. VMD provides three types of alert boxes (info, warning, success) for different scenarios.

```markdown
<info>
This is an info alert box. You can place any content here that needs attention but is not a warning.
</info>
```

## Post Blocks

`<post>` is used to create left-right column content displays, with text on the left and one or more images on the right.

```markdown
<post>
<lft>

Here is the text content on the left. You can use any Markdown format, including headings, lists, code, etc.

</lft>
<rt>

![Product Screenshot](screenshot.png)
![Product Screenshot](screenshot.png)

</rt>
</post>
```

### Format Requirements

The start and end tags of `<post>`, `<lft>`, and `<rt>` must each be on their own line.

There must be only one space or one newline between `<post>` and `<lft>`.

There must be only one space or one newline between `</lft>` and `<rt>`.

There must be only one space, one newline, or nothing between `</rt>` and `</post>`.

The content of `<lft>` must start and end with two newlines (i.e., one blank line before and after the content).

The content of `<rt>` must also start and end with two newlines.

A `<post>` must contain exactly one `<lft>` and one `<rt>`, and `<lft>` must come before `<rt>`.

### Left Content Rules

The left content area supports inline Markdown elements, including bold, italic, inline code, links, inline math formulas, etc. It also supports block-level elements such as headings and lists.

The left content area **does not allow** the following content:

- Fenced code blocks (```)
- Block-level math formulas (`$$...$$`)
- Regular Markdown images (`![alt](src)`)
- Blockquotes (`>`)
- `<post>`, `<lft>`, `<rt>`, `<info>`, `<warning>`, `<success>`, `<smallimg>` tags

### Right Content Rules

The right content area **only allows images**, and each image must be on its own line. Images must have alt text. Images must be separated by newlines.

## Small Image (Thumbnail)

The `<smallimg>` tag is used to insert small-sized images in text, such as avatars, icons, badges, etc. Unlike regular images, thumbnails do not occupy a full line but are displayed as inline elements.

```markdown
<smallimg>![User Avatar](avatar.png)</smallimg>
```

## Image Processing

v0plex automatically processes all images referenced in Markdown. Images are copied to the `public/vmdimage/` directory and renamed using a hash. The compiled page will reference the processed image path. Images need to be placed in `dev/assets/images/` (when developing in local mode), or in the Git repository of the remote Markdown.

## Code

VMD fully supports Markdown code block syntax and provides syntax highlighting. v0plex automatically extracts all code (including inline code and fenced code blocks) into independent files, stored in the `public/vmdcode/` directory, with filenames using content hashes. The extracted code is rendered on the page in the form of VMD components, with a copy function provided.

## Tables

VMD tables need to be wrapped in `<table>` tags around standard Markdown table syntax.

```markdown
<table>

| Name | Type | Description |
|------|------|-------------|
| id | number | Unique identifier |
| name | string | User name |
| email | string | Email address |

</table>
```

`<table>` and `</table>` must each be on their own line, and there must be blank lines separating them from the table content.

Table cells support inline formatting, including bold, italic, inline code, inline math formulas, links, strikethrough, etc.

Table cells **do not allow** the following block-level elements: code blocks, block-level math formulas, images, blockquotes, lists, and other block-level HTML tags.

## Grid Tables

`<tablegrid>` has the exact same syntax and validation rules as `<table>`. The only difference is the rendering method: `<tablegrid>` uses CSS Grid layout to render a card-style table, suitable for showcasing feature comparisons, capability matrices, and similar scenarios.

```markdown
<tablegrid>

| Feature | Plan A | Plan B |
|---------|--------|--------|
| Performance | `O(n)` | `O(log n)` |
| Compatibility | Supported | **Not supported** |
| Cost | $100 | $200 |

</tablegrid>
```

`<tablegrid>` and `</tablegrid>` must each be on their own line, with blank lines separating them from the table content. Allowed and disallowed content inside cells is identical to `<table>`.

## Standard Markdown Support

In addition to the extensions above, VMD fully supports standard Markdown syntax.

Headings use `#` through `######` for level one through six headings. Paragraphs are separated by one or more blank lines. Bold uses `**text**` or `__text__`. Italic uses `*text*` or `_text_`. Strikethrough uses `~~text~~`. Bold-italic uses `***text***`.

Unordered lists start with `-`, `*`, or `+`. Ordered lists start with a number followed by a period. Lists can be nested, with indentation indicating hierarchy.

Links use `[text](URL)`. Images use `![alt text](image path)`. Blockquotes start with `>`. Horizontal rules use three or more `-`, `*`, or `_`.

Escape characters use a backslash `\` to display the literal value of special characters.
