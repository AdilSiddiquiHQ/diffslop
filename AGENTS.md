# Notes for AI agents working in this repository

`diffslop` exists to answer one question: **did the code or tests the agent just wrote introduce slop, weakened tests, or ghost code into the git diff?**

Because this tool measures whether other agents' code and tests are real, this codebase must hold itself to the highest standard of verification. Do not guess, do not fabricate numbers, and never weaken assertions to pass tests.

## Commands

```bash
npm test        # Full unit + integration + README transcript verification
npm run check   # Quick syntax and export check
npm run demo    # Run demo on examples/shop-slop and examples/shop-clean
npm run gifs    # Regenerate assets/demo.gif, assets/score.gif, and assets/card.png (macOS only)
npm run readme  # Verify README metrics match real runs byte-for-byte
```

Always run `npm test` before concluding your work.

## Core Architecture

- **Git Diff (`lib/gitdiff.js`):** Parses `git diff -U0 <base>` (or staged changes) into structured hunks and added line numbers. Categorizes test vs source vs config files.
- **Rule Engine (`lib/engine.js`):** Coordinates running the 8 deterministic rules across parsed files and hunks. Calculates total penalty points, added line counts, and computes the Slop Index (%).
- **Rules (`lib/rules/`):**
  - `asserts.js`: Rule `SLOP01_TAUTOLOGICAL_ASSERT` (tautological and hollow assertions in tests).
  - `errors.js`: Rule `SLOP02_SWALLOWED_ERROR` (empty catch, swallowed rejections, buried exceptions).
  - `comments.js`: Rule `SLOP03_AI_CHAT_REMNANT` (conversational notes, AI attribution, hack confessions).
  - `types.js`: Rule `SLOP04_TYPE_ESCAPE_HATCH` (`as any`, `@ts-ignore`, linter suppressions).
  - `ghosts.js`: Rule `SLOP05_GHOST_DECLARATION` (unexported, unreferenced helpers left in diff).
  - `mocks.js`: Rule `SLOP06_PRODUCTION_MOCK_FALLBACK` (test-mode branches and mock returns in production).
  - `leaks.js`: Rule `SLOP07_LOCAL_PATH_LEAK` (local machine paths and high-entropy secret tokens).
  - `noise.js`: Rule `SLOP08_COLLATERAL_DIFF_NOISE` (trailing whitespace and blank line churn).
- **Report (`lib/report.js`):** Formats terminal tables, ANSI progress bars, severity badges, and structured JSON output.
- **Color (`lib/color.js`):** Zero-dependency ANSI formatting respecting `NO_COLOR`, `FORCE_COLOR`, and TTY checks.

## Hard Invariants

1. **Zero runtime dependencies:** `package.json` must have `dependencies: {}`. Enforced by `test/package.test.js`.
2. **Never claim an unmeasured number:** If a number or score is in `README.md`, it must be backed by a test or match the real demo output.
3. **README metrics are byte-pinned:** Real outputs in `README.md` are verified byte-for-byte in `scripts/readme-check.mjs`.
4. **Action YAML has no inline script logic:** `action.yml` must use `using: composite` and call `scripts/diffslop.sh` directly. `scripts/diffslop.sh` must start with `set -euo pipefail`.
5. **Exact badge count:** `README.md` must have exactly 8 badges. Enforced by `scripts/readme-check.mjs`.
6. **Execution speed:** Diff scanning must execute in under 25 milliseconds.
7. **Offline operation:** 100% offline. Zero external API calls, zero telemetry.
