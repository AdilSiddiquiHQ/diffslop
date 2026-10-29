// Rule SLOP02: Swallowed Errors and Silent Catch Blocks
// Detects patterns where agents bury errors to suppress test failures.

export const id = 'SLOP02_SWALLOWED_ERROR';
export const name = 'Swallowed Error or Silent Catch Block';
export const severity = 'high';
export const weight = 2.5;

export function check({ file, hunk, line, fullContent, isTest }) {
  const text = line.content.trim();
  if (!text) return null;

  // Ignore comments
  if (text.startsWith('//') || text.startsWith('*') || text.startsWith('/*') || text.startsWith('#')) {
    return null;
  }

  // 1. JavaScript/TypeScript empty catch: catch (e) {}, catch {}, catch (err) {/* ignore */}
  if (/catch\s*(?:\([^)]*\))?\s*\{\s*(?:\/\*.*?\*\/|\/\/.*)?\s*\}/.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Empty catch block silently suppresses all exceptions.',
      snippet: text
    };
  }

  // 2. Swallowed Promise rejection: .catch(() => {}), .catch(noop), .catch(() => null)
  if (/\.catch\s*\(\s*(?:\(\s*\)\s*=>\s*\{?\s*\}?|\([^)]*\)\s*=>\s*(?:\{\s*\}|null|undefined|false))\s*\)/.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Promise rejection handler silently discards rejected errors.',
      snippet: text
    };
  }

  // 3. Catch block that only logs and returns nothing without re-throwing
  if (/catch\s*(?:\([^)]*\))?\s*\{\s*console\.(?:log|error|warn)\([^)]*\);\s*(?:return(?:\s+(?:null|undefined|false|\[\]|\{\}))?;)?\s*\}/.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Catch block only logs error and suppresses failure without propagation.',
      snippet: text
    };
  }

  // 4. Python empty except block: except Exception: pass, except: pass
  if (/except(?:\s+[A-Za-z0-9_]+)?\s*:\s*pass\b/.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Python empty except clause silently ignores exception with pass.',
      snippet: text
    };
  }

  // 5. Go unhandled error assignment: _, _ = ..., or if err != nil { return nil }
  if (/\b_\s*=\s*err\b/.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Go error explicitly discarded with blank identifier.',
      snippet: text
    };
  }

  return null;
}
