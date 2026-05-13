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

### Common Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | **Local Development**: Runs `vmd:gen`, `lex:gen`, then starts the Next.js dev server (listening on `0.0.0.0`). |
| `pnpm build` | **Production Build**: Runs `vmd:gen`, `lex:gen`, then runs `next build` to generate static / server-side output. |
| `pnpm start` | **Start Production Server**: Runs the built Next.js app (requires `pnpm build` first). |

### Markdown to Tsx

| Command | Purpose |
|---------|---------|
| `pnpm vmd:gen` | Runs the VMD parser ([`vmd_parser/main.ts`](vmd_parser/main.ts)), converting Markdown source files into Next.js pages, extracted code blocks, image assets, and site navigation JSON. Default input directory is `dev`. |

### Full-text Search Support

| Command | Purpose |
|---------|---------|
| `pnpm lex:gen` | Generates a compressed lexicon for full-text search. The script automatically: checks and creates a Python virtual environment `.venv`, installs the `jieba` tokenization library, runs [`scripts/search-script/lex.py`](scripts/search-script/lex.py) to generate the index, then exits the virtual environment. |

### Test

| Command | Purpose |
|---------|---------|
| `pnpm test` | Starts Vitest. |


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


## GitHub Repositories

- [v0plex](https://github.com/sjl473/v0plex) — Source code repository
- [v0plex-markdown](https://github.com/sjl473/v0plex-markdown) — Markdown documentation source


## License

© 2026 sjl473
