---
title: Invalid VMD Example
created_at: 2024-01-15
last_updated_at: 2024-01-20
author: Jane Doe
has_custom_tsx: false
tags: [example, invalid, errors]
---

# Invalid VMD Document

This document contains intentional errors that should fail compilation.

## ERROR 1: Nested Code Blocks

The following is invalid because code blocks cannot be nested inside each other:

```typescript
outer code block
```typescript
nested code block - THIS IS INVALID
```
remaining outer block
```

## ERROR 2: Single Backtick Code Block

Using single backticks for code blocks is not allowed:

`this is not a valid code block`

## ERROR 3: Invalid Post Block Spacing

<post>
<lft>

This has wrong spacing - needs exactly one space or newline between tags

</lft>

<rt>

![Image description](/path/to/image.png)

</rt>
</post>

## ERROR 4: Post Block Missing Required Tags

<post>
This post block is missing the required <lft> and <rt> tags.
</post>

## ERROR 5: Disallowed Content in Post Left Side

<post>
<lft>

```
Code blocks are NOT allowed inside <lft>
```

</lft>
<rt>

![Alt text](/path/to/image.png)

</rt>
</post>

## ERROR 6: Images Without Alt Text in RT

<post>
<lft>

Some content here.

</lft>
<rt>

![](/path/to/image.png)

</rt>
</post>

## ERROR 7: Protected Tag Inside Container

<info>
<post>
Post blocks cannot be nested inside info blocks.
</post>
</info>

## ERROR 8: Invalid Table Format

<table>

| Header 1 | Header 2 |
| This is not a proper separator row |
| Cell 1   | Cell 2   |

</table>

## ERROR 9: Multiple @git Placeholders

This document simulates frontmatter with multiple @git placeholders in author field
(which would be caught during frontmatter validation).

## ERROR 10: Empty Custom Block

<warning>
</warning>

## Conclusion

This document contains various syntax errors that the VMD compiler should detect and report.
