# VMD Parser Tests

## Usage

```bash
# Run all tests
npm run test:run

# Watch mode (auto-rerun on changes)
npm test

# Verbose output
npm test -- --run --reporter=verbose

# Output test log to file
VMD_TEST_LOG=1 npm run test:run
```

## Add New Test

```bash
# Create test file
cat > vmd_parser/__tests__/fixtures/markdown/test-md-41.md << 'EOF'
---
title: Your Test
date: 2024-01-01
tags: [test]
---

# Your content
EOF

# Run tests
npm run test:run
```

## Test Files

All `.md` files in [`fixtures/markdown/`](./fixtures/markdown/) are auto-discovered and tested.

Current files: `test-md-1.md` ~ `test-md-40.md`

## Requirements

- Must include frontmatter (title, date, tags)
- Use naming: `test-md-N.md`
- Invalid tests: use `.md.disabled` extension
