// Rule SLOP06: Production Mock Fallbacks and Fake Returns
// Detects test-mode branches and hardcoded fake returns baked directly into production logic.

export const id = 'SLOP06_PRODUCTION_MOCK_FALLBACK';
export const name = 'Production Mock Fallback or Fake Return';
export const severity = 'critical';
export const weight = 3.5;

export function check({ file, hunk, line, fullContent, isTest }) {
  // Test mocks in test files are expected; only flag in production files
  if (isTest) return null;

  const text = line.content.trim();
  if (!text) return null;

  // Ignore regexes, rule definitions, and comments
  if (text.startsWith('//') || text.startsWith('*') || text.startsWith('/*')) return null;
  if (text.startsWith('if (isTest)') || text.startsWith('if (!isTest)')) return null;

  // 1. Inlined NODE_ENV === 'test' branch returning fake data
  if (/(?:process\.env\.NODE_ENV\s*===?\s*['"]test['"]|process\.env\.TEST\b|\binTestMode\b)\s*.*(?:return\b|=>)/i.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Test-environment branch inlines artificial mock behavior in production code.',
      snippet: text
    };
  }

  // 2. Return statements returning explicit mock/dummy/fake objects
  if (/^return\s+(?:mock[A-Z0-9_$]+|dummy[A-Z0-9_$]+|fake[A-Z0-9_$]+)\b/i.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Production function directly returns mock or dummy data structure.',
      snippet: text
    };
  }

  // 3. Fallback mock comments on return lines
  if (/^return\b.*(?:\/\/|\/\*).*(?:mock|dummy|fake|placeholder)/i.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Return statement labelled as mock or placeholder fallback.',
      snippet: text
    };
  }

  return null;
}
