# VMD Parser Tests

This directory contains tests for the VMD (V0 Markdown) Parser using Vitest with **automatic markdown file discovery**.

## How It Works

The test suite **automatically discovers and tests ALL markdown files** in `fixtures/markdown/`:
- Each `.md` file becomes a test case
- Tests run automatically when you add new files
- Unified summary shows which files compiled successfully and which failed

## Test Framework

We use [Vitest](https://vitest.dev/) - a blazing fast unit test framework powered by Vite.

## Running Tests

```bash
# Run tests in watch mode (automatically re-runs on file changes)
npm test

# Run tests once with summary
npm run test:run

# Run tests with verbose output (shows detailed summary)
npm test -- --run --reporter=verbose

# Run tests with UI (interactive browser interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Example Output

```
============================================================
VMD COMPILATION SUMMARY
============================================================

✅ SUCCESS (6/6):
   ✓ basic-formatting.md
   ✓ code-blocks.md
   ✓ custom-blocks.md
   ✓ hello-world.md
   ✓ lists.md
   ✓ math.md

============================================================
```

If a file fails, it shows:
```
❌ FAILED (1/7):
   ✗ broken-example.md
     Error: Empty custom block at line 5
```

## Directory Structure

```
vmd_parser/__tests__/
├── README.md                    # This file
├── compiler.test.ts             # Test suite (auto-discovers .md files)
└── fixtures/
    └── markdown/                # Input markdown files (auto-tested)
        ├── hello-world.md       # Complete example with all features
        ├── basic-formatting.md  # Headings, bold, italic, etc.
        ├── lists.md             # Ordered and unordered lists
        ├── code-blocks.md       # Code blocks and inline code
        ├── custom-blocks.md     # Info, warning, success blocks
        └── math.md              # Inline and block math
```

## How to Add a New Test Case

### It's Simple - Just Add a Markdown File!

**Step 1:** Create your markdown file in `fixtures/markdown/`

```bash
# Create a new test file
cat > vmd_parser/__tests__/fixtures/markdown/my-new-feature.md << 'EOF'
---
title: My New Feature
date: 2024-01-01
tags: [test]
---

# My New Feature

Test content here...
EOF
```

**Step 2:** Run tests - your file is automatically discovered!

```bash
npm test
```

That's it! No need to modify the test code. The test suite automatically:
- Discovers your new file
- Parses the frontmatter
- Compiles the markdown
- Reports success or failure

## Available Test Fixtures

### hello-world.md
Complete example demonstrating all VMD features:
- Headings (H1, H2, H3)
- Text formatting (bold, italic)
- Lists
- Code blocks with syntax highlighting
- Inline code
- Math formulas (inline and block)
- Custom blocks (info)

### basic-formatting.md
Tests basic text formatting:
- Multiple heading levels
- Bold, italic, strikethrough
- Inline code

### lists.md
Tests list rendering:
- Unordered lists
- Ordered lists

### code-blocks.md
Tests code handling:
- Multiple language syntax highlighting (JavaScript, Python)
- Inline code

### custom-blocks.md
Tests custom VMD blocks:
- `<info>` blocks
- `<warning>` blocks
- `<success>` blocks

### math.md
Tests mathematical notation:
- Inline math: `$...$`
- Block math: `$$...$$`
- LaTeX formatting

## VMD Output Format

The VMD parser outputs custom HTML tags for React components:

| Markdown | Output Tag |
|----------|-----------|
| `# Heading` | `<H1vmd>` |
| `**bold**` | `<Boldvmd>` |
| `*italic*` | `<Italicvmd>` |
| `~~strike~~` | `<Strikevmd>` |
| `<p>` | `<Pvmd>` |
| Unordered list | `<Ulvmd>`, `<Livmd>` |
| Ordered list | `<Olvmd>`, `<Livmd>` |
| Code block | `<Blockcodevmd language="...">` |
| Inline code | `<Inlinecodevmd>` |
| `<info>` | `<Infovmd>` |
| `<warning>` | `<Warningvmd>` |
| `<success>` | `<Successvmd>` |
| `$...$` | `<Inlinemathvmd>` |
| `$$...$$` | `<Blockmathvmd>` |
| `![alt](src)` | `<Imgvmd>` |

## Writing Good Test Markdown Files

### Do's ✅
- **Always include frontmatter** (title, date, tags)
- **Use descriptive filenames** (e.g., `nested-lists.md`, `code-with-math.md`)
- **Test one feature at a time** when possible
- **Add comments in markdown** to explain complex scenarios
- **Create edge case files** (empty blocks, special characters, etc.)

### Don'ts ❌
- Don't forget frontmatter
- Don't use spaces in filenames (use hyphens instead)
- Don't test multiple unrelated features in one file
- Don't commit files you intend to fail (use `.disabled` extension)

## Testing Error Cases

To test files that should fail (for demonstration or debugging):
1. Create the file with `.md.disabled` extension
2. The test suite will ignore it
3. Rename to `.md` when you want to test it

Example:
```bash
# This file won't be tested
vmd_parser/__tests__/fixtures/markdown/example-error.md.disabled

# Rename to test it
mv example-error.md.disabled example-error.md
npm test
```

## Example: Adding a New Feature Test

Let's say you want to test the `<post>` block feature:

**Create `fixtures/markdown/post-block.md`:**
```markdown
---
title: Post Block Test
date: 2024-01-01
tags: [test]
---

<post>
<lft>
Left side content
</lft>
<rt>
Right side content
</rt>
</post>
```

**Run tests:**
```bash
npm test -- --run --reporter=verbose
```

**See the result:**
```
✅ SUCCESS (7/7):
   ✓ post-block.md
   ... (other files)
```

## Configuration

Test configuration is in `vitest.config.ts` at the project root. It's configured to:
- Use Node environment
- Run tests in `vmd_parser/**/*.test.ts`
- Generate coverage reports for all `vmd_parser/**/*.ts` files

## Troubleshooting

### My file isn't being tested
- Make sure it has `.md` extension (not `.md.disabled` or `.txt`)
- Ensure it's in `fixtures/markdown/` directory
- Check that frontmatter is properly formatted

### Frontmatter parsing errors
Ensure your frontmatter is properly formatted:
```markdown
---
title: Title
date: 2024-01-01
tags: [tag1, tag2]
---

# Content starts here
```

### Test shows as failed but I don't see why
Run with verbose output to see detailed error messages:
```bash
npm test -- --run --reporter=verbose
```

## Contributing

When adding new features to VMD Parser:
1. Create markdown fixtures demonstrating the feature
2. Files are automatically tested - no code changes needed!
3. Run `npm test` to verify
4. Check the unified summary for results
5. Run `npm run test:coverage` to ensure coverage
