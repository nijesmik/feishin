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

## Workflow

1. **Branch**: Create a feature branch before starting any work. Never commit directly to `dev`.
2. **Implement**: Do the work on the feature branch.
3. **Review**: Run the appropriate `pr-review-toolkit` agents on the changes. Pick agents based on what the change touches:
   - `code-reviewer` — general code quality, security, architecture
   - `silent-failure-hunter` — error handling, catch blocks, fallback behavior
   - `pr-test-analyzer` — test coverage gaps
   - `type-design-analyzer` — model/type design (when adding new types)
   - `code-simplifier` — simplification opportunities (after major features)
   - `comment-analyzer` — comment accuracy (when adding docs/comments)
4. **Verify**: Run agents to verify whether each finding is a true positive. Discard false positives.
   - If there are many findings, split verification across multiple agents grouped by topic — don't overload a single agent.
5. **Fix**: Apply fixes only for verified true positives.
6. **Merge**: Merge the feature branch into `dev`.
