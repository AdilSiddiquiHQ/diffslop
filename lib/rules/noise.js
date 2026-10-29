// Rule SLOP08: Collateral Diff Noise and Trailing Whitespace
// Detects accidental formatting churn, trailing spaces, and blank line spam in diffs.

export const id = 'SLOP08_COLLATERAL_DIFF_NOISE';
export const name = 'Collateral Diff Noise (Trailing Whitespace / Blank Churn)';
export const severity = 'low';
export const weight = 1.0;

export function check({ file, hunk, line, fullContent, isTest }) {
  const raw = line.content;

  // 1. Trailing whitespace on added line
  if (/[ \t]+$/.test(raw)) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: 'Added line contains trailing whitespace characters.',
      snippet: raw.trimEnd() + '·'
    };
  }

  // 2. Consecutive empty added lines (e.g. 3+ blank lines in a row)
  const addedLines = hunk.lines.filter(l => l.type === '+');
  if (addedLines.length >= 3 && addedLines.every(l => !l.content.trim())) {
    if (line === addedLines[0]) {
      return {
        ruleId: id,
        ruleName: name,
        severity,
        weight,
        message: 'Diff inserts redundant consecutive blank lines with no code.',
        snippet: '<blank line churn>'
      };
    }
  }

  return null;
}
