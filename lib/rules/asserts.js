// Rule SLOP01: Tautological and Hollow Test Assertions
// Detects tests written by coding agents that pass without proving anything.

export const id = 'SLOP01_TAUTOLOGICAL_ASSERT';
export const name = 'Tautological or Hollow Test Assertion';
export const severity = 'high';
export const weight = 3.0;

export function check({ file, hunk, line, fullContent, isTest }) {
  if (!isTest) return null;

  const raw = line.content.trim();
  if (!raw) return null;

  // Ignore comments and string object declarations
  if (raw.startsWith('//') || raw.startsWith('*') || raw.startsWith('/*')) return null;

  // Must look like an assertion statement or call, not a string definition
  if (!/^\s*(?:await\s+)?(?:expect|assert)\b/.test(raw) && !/;\s*(?:await\s+)?(?:expect|assert)\b/.test(raw)) {
    return null;
  }

  // 1. Literal tautology: expect(true).toBe(true), expect(1).toBe(1), assert(true)
  if (/expect\s*\(\s*(true|false|1|0|null|undefined)\s*\)\s*\.\s*(toBe|toEqual|toStrictEqual)\s*\(\s*\1\s*\)/.test(raw)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Assertion trivially compares a literal to itself, testing nothing.',
      snippet: raw
    };
  }

  // 2. Identity tautology: expect(val).toBe(val), expect(res).toEqual(res)
  const identMatch = raw.match(/expect\s*\(\s*([a-zA-Z0-9_$.]+)\s*\)\s*\.\s*(toBe|toEqual|toStrictEqual)\s*\(\s*\1\s*\)/);
  if (identMatch) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: `Assertion compares variable '${identMatch[1]}' to itself.`,
      snippet: raw
    };
  }

  // 3. assert(true) or assert(1 === 1) or assert.ok(true)
  if (/assert(?:\.ok)?\s*\(\s*(true|1\s*===\s*1)\s*\)/.test(raw)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Assertion asserts true constant, guaranteeing pass without testing code.',
      snippet: raw
    };
  }

  // 4. assert.strictEqual(true, true) or assert.equal(x, x)
  if (/assert\.(?:strictEqual|equal|deepEqual|deepStrictEqual)\s*\(\s*([a-zA-Z0-9_$.]+)\s*,\s*\1\s*\)/.test(raw)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Assertion asserts equality of identical operands.',
      snippet: raw
    };
  }

  // 5. Hollow assertions: expect(res).toBeDefined() alone without property validation
  if (/expect\s*\([^)]+\)\s*\.\s*(toBeDefined|toBeTruthy|not\.toBeNull|not\.toBeUndefined)\s*\(\s*\)/.test(raw)) {
    return {
      ruleId: id,
      ruleName: name,
      severity: 'medium',
      weight: 1.5,
      message: 'Hollow assertion checks only existence/truthiness without inspecting return structure or value.',
      snippet: raw
    };
  }

  // 6. Shallow type assertion: expect(typeof x).toBe('object')
  if (/expect\s*\(\s*typeof\s+[^)]+\)\s*\.\s*(?:toBe|toEqual)\s*\(\s*['"](?:object|string|number|boolean)['"]\s*\)/.test(raw)) {
    return {
      ruleId: id,
      ruleName: name,
      severity: 'medium',
      weight: 1.5,
      message: 'Shallow typeof assertion does not verify payload integrity.',
      snippet: raw
    };
  }

  // 7. Array.isArray(x) without checking elements
  if (/expect\s*\(\s*Array\.isArray\([^)]+\)\s*\)\s*\.\s*(?:toBe|toEqual)\s*\(\s*true\s*\)/.test(raw)) {
    return {
      ruleId: id,
      ruleName: name,
      severity: 'medium',
      weight: 1.5,
      message: 'Shallow Array.isArray assertion checks type without inspecting element contents.',
      snippet: raw
    };
  }

  return null;
}
