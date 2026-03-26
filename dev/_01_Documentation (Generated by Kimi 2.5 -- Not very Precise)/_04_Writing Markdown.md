---
title: Writing Markdown
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex
has_custom_tsx: false
tags: [guide, reference]
---

# Writing Markdown

v0plex content is entirely based on Markdown format, a lightweight markup language designed to be easy to read and write. This chapter covers the Markdown syntax supported by v0plex and best practices for content organization.

## File Organization Conventions

v0plex uses the filesystem to organize content hierarchically. All content is stored in the `dev/` directory, supporting unlimited levels of folder nesting.

Files and folders follow a specific naming convention: beginning with a `_NN_` prefix, where `NN` is a two-digit number (zero-padded if less than two digits) controlling the content's order in the navigation tree. Following the prefix is the content's identifier name, which can include spaces and Chinese characters. For example:

```
dev/
├── _00_Getting Started/
│   ├── _01_Installation.md
│   ├── _02_Quick Start.md
│   └── _03_FAQ.md
├── _01_Advanced Topics/
│   ├── _01_Configuration Details.md
│   └── _02_Custom Components/
│       └── _01_Creating Components.md
└── _02_API Reference/
    └── _01_Interface Documentation.md
```

This naming scheme gives authors complete control over ordering, independent of filesystem or alphabetical order. Meanwhile, the hierarchical structure clearly reflects the logical relationships between content, allowing readers to intuitively understand the content organization through the navigation sidebar.

## Frontmatter Format

Each Markdown file must begin with YAML frontmatter, enclosed by three pairs of hyphens `---`. Frontmatter defines document metadata; v0plex supports the following fields:

```yaml
---
title: Document Title
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: Author Name
has_custom_tsx: false
description: Brief description of the document
---
```

`title` is the document's display title, appearing at the top of the page, browser tab, and navigation links. `created_at` and `last_updated_at` use ISO 8601 date format (YYYY-MM-DD), representing the document's creation time and last update time respectively. `author` is the author name, which can be a person, team, or organization. `has_custom_tsx` is a boolean indicating whether the document has an associated custom TSX component, defaulting to false. `description` is an optional brief description used for SEO and search summaries.

Tab characters are not allowed for indentation in frontmatter; spaces must be used. Field names are followed immediately by a colon and space, then the value. String values typically do not require quotes, but if they contain special characters or colons, it is recommended to enclose them in quotes.

## Basic Markdown Syntax

v0plex fully supports the basic syntax of the CommonMark specification.

Paragraphs are separated by blank lines. Consecutive lines of text are merged into a single paragraph unless forced line breaks are used with two trailing spaces or HTML `<br>` tags. It is generally recommended to control text flow through proper paragraphing rather than forced line breaks, providing a better reading experience across different screen widths.

Headings use hash marks, with one hash for level one, two for level two, and support up to six levels. v0plex automatically generates anchor links for each heading, allowing readers to quickly navigate by clicking the link icon next to headings.

```markdown
# Level 1 Heading
## Level 2 Heading
### Level 3 Heading
```

There are three emphasis styles: text wrapped in double asterisks or double underscores displays as bold; text wrapped in single asterisks or single underscores displays as italic; text wrapped in three asterisks displays as bold italic. Strikethrough uses double tildes.

```markdown
**Bold text** or __Bold text__
*Italic text* or _Italic text_
***Bold italic text***
~~Strikethrough text~~
```

Lists are divided into unordered and ordered lists. Unordered lists use hyphens, plus signs, or asterisks as markers and support multi-level nesting, with sublists requiring indentation. Ordered lists use numbers followed by periods; the numbers need not be consecutive as they are renumbered sequentially during rendering.

```markdown
- Unordered list item
  - Nested item
  - Nested item
- Another item

1. Ordered list item
2. Another item
   1. Nested ordered item
   2. Nested ordered item
```

Links use square brackets to wrap the link text, followed immediately by parentheses wrapping the URL. Links can point to external websites, other pages within the site, or in-page anchors. Images use similar syntax to links but with an exclamation mark prefix.

```markdown
[External link](https://example.com)
[Internal link](../_01_Other Chapter/_01_Document.md)
[In-page anchor](#Section Title)

![Image description](../assets/images/screenshot.png)
```

Blockquotes use greater-than signs at the beginning of lines and can span multiple lines or be nested.

```markdown
> This is a quoted text.
> It can span multiple lines.
>
> > This is a nested quote.
```

Code comes in two forms: inline code and code blocks. Inline code is wrapped in single backticks. Code blocks are enclosed by three backticks, with an optional language identifier at the beginning for syntax highlighting.

```markdown
Inline code: `const x = 1`

```javascript
function example() {
  return "syntax highlighting";
}
```
```

## Mathematical Expressions

v0plex supports LaTeX format mathematical expressions, rendered using MathJax.

Inline formulas are wrapped in single dollar signs:

```markdown
The mass-energy equation $E = mc^2$ was proposed by Einstein.
```

Block formulas are wrapped in double dollar signs:

```markdown
$$
\int_{a}^{b} f(x) \, dx = F(b) - F(a)
$$
```

v0plex uses MathJax's `tex-chtml` output format, supporting the vast majority of standard LaTeX mathematical commands. Complex formulas may take longer to render; it is recommended to verify the display effect before final publication.

## Escaping Characters

Certain characters have special meanings in Markdown. To display these characters literally, they must be escaped with a backslash.

```markdown
\* Literal asterisk \*
\# Literal hash \#
\[ Literal square bracket \]
```

Within code blocks and inline code, all characters are processed literally and do not require escaping.

## Writing Recommendations

Good Markdown documentation is not only syntactically correct but also easy to read and maintain.

Line length is recommended to be controlled between 80 and 100 characters. This is not a hard limit, but excessively long lines produce ugly diffs in version control and are difficult to read on narrow screens. Most modern editors support soft wrapping, which does not affect actual Markdown rendering.

Use blank lines to clearly separate different content blocks. There should be blank lines between paragraphs, between lists and body text, and before and after code blocks. This makes the source structure clearer and avoids rendering issues in certain edge cases.

Images should have descriptive alternative text. This is not only for accessibility (screen readers will read the alternative text aloud) but also to provide context to readers when images fail to load.

Avoid excessive nesting. Markdown has limited nesting levels, and deeply nested structures are difficult to write and read. If you need to express complex hierarchical relationships, consider splitting into multiple pages or using tables.

## Using Custom TSX Components

When Markdown's expressive capabilities are insufficient, v0plex supports using custom React/TSX components for complete control over page rendering. This is suitable for scenarios requiring complex interactions, custom layouts, or integration with external component libraries.

### Enabling Custom Components

To use custom TSX components, first set the `has_custom_tsx` field to `true` in the document's frontmatter:

```yaml
---
title: Document with Custom Components
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex
has_custom_tsx: true
---
```

Then, in the same directory as the Markdown file, create a TSX file with the same name as the Markdown file. For example, if the Markdown file is named `_01_My Document.md`, create `_01_My Document.tsx`.

### TSX Component Structure

The custom TSX component is a standard React component that needs to follow a specific structure to ensure proper integration with v0plex's theming system:

```tsx
"use client"

import { GlobalTheme } from "@carbon/react"
import { useTheme } from "@/components/common/theme-provider"

export default function CustomPage() {
    const { theme } = useTheme()

    return (
        <GlobalTheme theme={theme}>
            <div className="v0plex-content">
                <div className="page-typography-content">
                    {/* Write custom content here */}
                    <h1>Custom Page Title</h1>
                    <p>This is content rendered using a React component.</p>
                </div>
            </div>
        </GlobalTheme>
    )
}
```

The component must use the `"use client"` directive because v0plex requires client-side interactive functionality. The `useTheme` hook is used to get the current theme setting (light or dark), and the `GlobalTheme` component ensures Carbon Design System styles are consistent with the current theme. The `v0plex-content` and `page-typography-content` class names ensure the content area adopts v0plex's standard layout and typography styles.

### Migrating from Markdown to Custom Components

If you have already written a Markdown document and later need to add functionality that can only be implemented via React components (such as complex interactive tables, data visualization charts, etc.), the migration process is as follows:

First, keep the original Markdown file but change `has_custom_tsx` to `true`. Then, create a TSX file with the same name and write the component following the structure above. At this point, v0plex will completely ignore the Markdown file's content (except for frontmatter used to generate navigation), and the page will be rendered by the TSX component.

This means the Markdown file is only used to provide metadata needed for navigation, while the actual display content is controlled by the TSX file. If you want to preserve the original Markdown content, you need to manually convert it to JSX format and embed it in the TSX component. For simple static content, you can copy and paste with appropriate format adjustments; for content containing VMD extension tags, you need to find the corresponding React components to replace them.

### Using Carbon Components

Since v0plex is based on the IBM Carbon Design System, you can directly use Carbon React components to build interfaces. For example, creating a structured data table:

```tsx
import { DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@carbon/react"

// Use in component
<DataTable rows={rows} headers={headers}>
    {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
        <Table {...getTableProps()}>
            <TableHead>
                <TableRow>
                    {headers.map(header => (
                        <TableHeader {...getHeaderProps({ header })}>
                            {header.header}
                        </TableHeader>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {rows.map(row => (
                    <TableRow {...getRowProps({ row })}>
                        {row.cells.map(cell => <TableCell key={cell.id}>{cell.value}</TableCell>)}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )}
</DataTable>
```

This approach is more flexible than Markdown tables, supporting interactive features like sorting, filtering, and pagination.

### Important Notes

After using custom TSX components, the page loses the convenience of Markdown: VMD extension tags cannot be used; you need to use the corresponding React components directly. Automatic link processing and format conversion of Markdown are not available. You need to manually handle responsive layouts and mobile adaptation.

Therefore, it is recommended to use custom components only when necessary. For most content, standard Markdown with VMD extensions is sufficient; only consider switching to TSX components when complex client-side interactions or specific layout structures are required.
