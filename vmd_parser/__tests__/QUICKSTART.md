# VMD Parser Tests - Quick Start

## TL;DR

**Just add a markdown file to test it!**

```bash
# 1. Create your markdown file
cat > vmd_parser/__tests__/fixtures/markdown/my-test.md << 'EOF'
---
title: My Test
date: 2024-01-01
tags: [test]
---

# Hello World

This is my test!
EOF

# 2. Run tests
npm test

# 3. See the result in the summary!
```

## What You Get

```
============================================================
VMD COMPILATION SUMMARY
============================================================

✅ SUCCESS (7/7):
   ✓ basic-formatting.md
   ✓ code-blocks.md
   ✓ custom-blocks.md
   ✓ hello-world.md
   ✓ lists.md
   ✓ math.md
   ✓ my-test.md           ← Your new test!

============================================================
```

## How It Works

1. **Auto-Discovery**: Test suite scans `fixtures/markdown/` for all `.md` files
2. **Auto-Testing**: Each file is compiled with VMD Parser
3. **Unified Report**: Shows which files succeeded ✅ and which failed ❌

## Test Commands

```bash
# Watch mode (re-runs on file changes)
npm test

# Run once
npm run test:run

# Detailed output with summary
npm test -- --run --reporter=verbose

# Interactive UI
npm run test:ui
```

## File Requirements

Your markdown file MUST have frontmatter:

```markdown
---
title: Your Title
date: 2024-01-01
tags: [tag1, tag2]
---

# Your content here
```

## Example Files

Look at these examples in `fixtures/markdown/`:
- `hello-world.md` - Complete demo with all features
- `basic-formatting.md` - Simple formatting
- `code-blocks.md` - Code examples
- `custom-blocks.md` - Info/warning/success blocks
- `math.md` - LaTeX math formulas

## See Full Documentation

Read [README.md](./README.md) for detailed information.
