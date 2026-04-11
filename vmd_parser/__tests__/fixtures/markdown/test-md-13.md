---
title: Code Blocks with VMD Tags
created_at: 2024-01-01
last_updated_at: 2024-01-01
author: test-author->test@example.com
has_custom_tsx: false
tags: [test, combo]
---

# Code Blocks with VMD Tags

## VMD Tags in Code Block (Should Not Render)

```markdown
<info>
This should appear as plain text in code block.
</info>

<warning>
Not a real warning box.
</warning>

<post>
<lft>Left</lft>
<rt>Right</rt>
</post>
```

## Inline Code with Tags

Use `<info>` for info boxes, `<warning>` for warnings, and `<success>` for success messages.

The `<post>` tag requires `<lft>` and `<rt>` children.

## Mixed Content

<info>
**Example Code:**

Use this syntax:
```html
<div class="info">
  <p>Content here</p>
</div>
```

Not the same as `<info>` VMD tag!
</info>
