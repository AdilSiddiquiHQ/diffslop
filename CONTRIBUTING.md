# Contributing to diffslop

Thanks for your interest in improving `diffslop`! We welcome issues, bug reports, and pull requests.

## Development Setup

`diffslop` has **zero runtime dependencies** and **zero dev dependencies**. All you need is Node.js 20 or newer.

```bash
# Clone the repository
git clone https://github.com/AdilSiddiquiHQ/diffslop.git
cd diffslop

# Run test suite
npm test

# Run syntax check
npm run check

# Run live demo
npm run demo

# Verify README metrics match measured output
npm run readme
```

## Ground Rules

1. **Zero runtime dependencies**: `package.json` `dependencies: {}` must remain empty. We rely exclusively on the Node.js standard library.
2. **Speed**: Analysis on a typical 500-line diff must execute in under 25 milliseconds.
3. **No Network**: `diffslop` runs 100% offline. No telemetry, no API calls, no LLMs at runtime.
4. **All claims measured**: Any score or metric mentioned in documentation must be backed by a deterministic test in `test/`.

## Running Tests

```bash
npm test
```

## Adding a New Slop Rule

1. Add your rule in `lib/rules/<name>.js`.
2. Follow the rule interface:
   ```javascript
   export const id = 'SLOP09_NEW_RULE';
   export const name = 'Description of the rule';
   export const severity = 'medium'; // 'critical' | 'high' | 'medium' | 'low'
   export const weight = 2.0;

   export function check({ file, hunk, line, fullContent, isTest }) {
     // Return null if clean, or { ruleId, ruleName, severity, weight, message, snippet } if flagged
   }
   ```
3. Register the rule in `lib/engine.js`.
4. Add unit tests in `test/rules.test.js`.
5. Run `npm test` and `npm run check`.
