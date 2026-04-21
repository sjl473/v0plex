---
title: Valid VMD Example
created_at: 2024-01-15
last_updated_at: 2024-01-20
author: John Doe
has_custom_tsx: false
tags: [example, valid, documentation]
---

# Valid VMD Document

This is a correctly formatted VMD document that should compile without errors.

## Basic Formatting

You can use **bold text**, *italic text*, and ***bold italic*** combined.
You can also use ~~strikethrough~~ for deleted content.

## Code Blocks

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

## Lists

### Unordered List
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

### Ordered List
1. First step
2. Second step
3. Third step

## Links and Images

Visit [v0plex documentation](https://example.com) for more info.

## Blockquotes

> This is a blockquote.
> It can span multiple lines.

## Math Expressions

Inline math: $E = mc^2$

Block math:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## Custom Blocks

<info>
This is an information block.
</info>

<warning>
This is a warning block.
</warning>

<success>
This is a success block.
</success>

## Post Block Example

<post>
<lft>

This is the left side content with some inline code: `const x = 5`.
It can contain **formatting** and *italic* text.

</lft>
<rt>

![Alt text for the image](/path/to/image.png)

</rt>
</post>

## Tables

<table>

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

</table>

## Horizontal Rule

---

## Conclusion

This document demonstrates all the valid VMD syntax patterns.
