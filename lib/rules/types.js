// Rule SLOP04: Type Escape Hatches and Linter Silencers
// Detects shortcuts injected by agents to bypass TypeScript or linter checks.

export const id = 'SLOP04_TYPE_ESCAPE_HATCH';
export const name = 'Type Escape Hatch or Linter Silencer';
export const severity = 'medium';
export const weight = 2.0;

export function check({ file, hunk, line, fullContent, isTest }) {
  const text = line.content.trim();
  if (!text) return null;

  // 1. @ts-ignore or @ts-nocheck directive
  if (/^\/\/\s*@ts-(?:ignore|nocheck)\b/.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'TypeScript compiler check explicitly suppressed via directive.',
      snippet: text
    };
  }

  // 2. @ts-expect-error without explanation comment
  if (/^\/\/\s*@ts-expect-error\s*$/.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity: 'low',
      weight: 1.0,
      message: '@ts-expect-error used without documented justification.',
      snippet: text
    };
  }

  // 3. eslint-disable or eslint-disable-next-line
  if (/^\/\*?\s*eslint-disable(?:-next-line)?\b/.test(text) || /\/\/\s*eslint-disable-next-line\b/.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Linter rule suppressed in diff.',
      snippet: text
    };
  }

  // Ignore standard comments from now on
  if (text.startsWith('//') || text.startsWith('*') || text.startsWith('/*')) return null;

  // Ignore object key definitions like message: '...'
  if (/^[a-zA-Z0-9_$]+\s*:\s*['"]/.test(text)) return null;

  // 4. as any or as unknown as any in expressions
  if (/[)a-zA-Z0-9_$.]\s+as\s+(?:any|unknown\s+as\s+any)\b/.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Unsafe "as any" cast strips type safety.',
      snippet: text
    };
  }

  // 5. Python # type: ignore without comment
  if (/#\s*type:\s*ignore\s*$/.test(text)) {
    return {
      ruleId: id,
      ruleName: name,
      severity: 'low',
      weight: 1.0,
      message: 'Python type checker suppressed without documented explanation.',
      snippet: text
    };
  }

  return null;
}
