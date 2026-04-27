# v0plex

A documentation site generator built on Next.js + React + TypeScript + Carbon Design System.


## Versions

| Technology | Version |
|------------|---------|
| Next.js | `^15.1.4` |
| React | `^19.0.0` |
| React DOM | `^19.0.0` |
| TypeScript | `^5.7.3` |
| @carbon/react | `1.105.0` |
| tsx | `^4.19.2` |
| Vitest | `^2.1.8` |
| pnpm | Based on local installed version (check with `pnpm -v`) |
| Python jieba | Latest (auto-installed by `lex:gen` script) |


## Available Commands

All commands are defined in [`package.json`](package.json) and executed with `pnpm`.

### Core Development Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | **Local Development**: Runs `vmd:gen`, `lex:gen`, then starts the Next.js dev server (listening on `0.0.0.0`). |
| `pnpm build` | **Production Build**: Runs `vmd:gen`, `lex:gen`, then runs `next build` to generate static / server-side output. |
| `pnpm start` | **Start Production Server**: Runs the built Next.js app (requires `pnpm build` first). |

### VMD Content Generation

| Command | Purpose |
|---------|---------|
| `pnpm vmd:gen` | Runs the VMD parser ([`vmd_parser/main.ts`](vmd_parser/main.ts)), converting Markdown source files into Next.js pages, extracted code blocks, image assets, and site navigation JSON. Default input directory is `dev`. |

### Search Index Generation

| Command | Purpose |
|---------|---------|
| `pnpm lex:gen` | Generates a compressed lexicon for full-text search. The script automatically: checks and creates a Python virtual environment `.venv`, installs the `jieba` tokenization library, runs [`scripts/search-script/lex.py`](scripts/search-script/lex.py) to generate the index, then exits the virtual environment. **Note**: If the current terminal is already in a Python venv, the command will error and exit. |

### Test Commands

| Command | Purpose |
|---------|---------|
| `pnpm test` | Starts the Vitest interactive test runner (watch mode). |
| `pnpm test:ui` | Starts Vitest and opens the graphical UI. |
| `pnpm test:run` | Runs all tests once and exits (suitable for CI pipelines). |

## Common Commands Cheat Sheet

```bash
# Install dependencies
pnpm install

# Local development (auto-generate content + start dev server)
pnpm dev

# Build for production (auto-generate content + next build)
pnpm build

# Generate VMD page content only
pnpm vmd:gen

# Generate search lexicon only
pnpm lex:gen

# Run tests
pnpm test
```

## Project Structure Overview

- `components/` — React components (including VMD rendering components)
- `config/` — Site configuration
- `vmd_parser/` — VMD Markdown parser and page generator
- `scripts/search-script/` — Search index generation Python scripts
- `dev/` — Markdown
- `public/` — Static assets (including MathJax fonts, etc.)

---

## License

© 2026 sjl473
