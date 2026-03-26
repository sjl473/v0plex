---
title: Escaping Special Characters
created_at: 2024-01-01
last_updated_at: 2024-01-01
author: test-author
has_custom_tsx: false
tags: [test, combo]
---

# Escaping Special Characters

## Backslash Escapes

<info>
**Special Characters:**

- \\* Not italic
- \\** Not bold
- \\` Not code
- \\[ Not link
- \\# Not heading
</info>

## In Code Blocks

<warning>
**Code Example:**

```
<info>
This is NOT a real info box
</info>

Use \\ to escape in markdown.
```
</warning>

## Mixed Escapes

<success>
**Testing:**

- Normal: **bold**
- Escaped: \**not bold\**
- Code: `<tag>` vs `\<tag\>`
- Math: $x$ vs \$x\$
</success>
