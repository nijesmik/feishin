# CLAUDE.md

## Change Style

Prefer adding new components alongside existing ones over modifying or removing existing code.

- Do not edit existing files unless strictly necessary.
- Place new components beside the old ones; swap at the router/dispatcher level.
- Keep edits to existing files to the minimum (e.g. one-line dispatch, type/config additions).

## Build Target

This project is **web only**. Do not use `pnpm dev` (Electron) or `pnpm build` (Electron + remote).

- Dev: `pnpm dev:web`
- Build: `pnpm build:web`
- Runtime config: placeholders in `settings.js.template` are replaced at deploy time.
