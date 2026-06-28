<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Codex toolchain

- In this repository, use the global RTK, Context7, Serena, ast-grep, ripgrep, and Repomix defaults automatically.
- Read `node_modules/next/dist/docs/` before making Next.js API or file-structure changes.
- Prefer `rg` for search, `ast-grep`/`sg` for structural code queries, and Serena for symbol-level navigation.
