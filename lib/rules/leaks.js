// Rule SLOP07: Local Machine Paths and Hardcoded Secret Leaks
// Detects developer workstation absolute paths and exposed API credentials in diffs.

export const id = 'SLOP07_LOCAL_PATH_LEAK';
export const name = 'Local Machine Path or Hardcoded Secret Leak';
export const severity = 'critical';
export const weight = 3.5;

const PATH_LEAK_PATTERNS = [
  /(?:\/Users\/[a-zA-Z0-9._-]+\/)/,
  /(?:\/home\/[a-zA-Z0-9._-]+\/)/,
  /(?:[A-Za-z]:\\Users\\[a-zA-Z0-9._-]+\\)/,
  /(?:file:\/\/\/(?:Users|home)\/)/
];

const SECRET_PATTERNS = [
  /\bsk-[a-zA-Z0-9]{20,}\b/,
  /\bghp_[a-zA-Z0-9]{36}\b/,
  /\bxox[baprs]-[0-9a-zA-Z-]{20,}\b/,
  /\bnpm_[a-zA-Z0-9]{36}\b/,
  /-----BEGIN\s+[A-Z\s]*PRIVATE\s+KEY-----/
];

export function check({ file, hunk, line, fullContent, isTest }) {
  const text = line.content;
  if (!text || !text.trim()) return null;

  // 1. Local path leak
  for (const pattern of PATH_LEAK_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        ruleId: id,
        ruleName: name,
        severity,
        weight,
        message: `Hardcoded local workstation path '${match[0]}' leaked in code.`,
        snippet: text.trim()
      };
    }
  }

  // 2. Secret leak
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      return {
        ruleId: id,
        ruleName: name,
        severity,
        weight,
        message: 'High-entropy credential or secret key token committed in diff.',
        snippet: text.trim().slice(0, 30) + '... [REDACTED]'
      };
    }
  }

  return null;
}
