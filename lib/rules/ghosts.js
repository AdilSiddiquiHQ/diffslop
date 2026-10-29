// Rule SLOP05: Ghost Declarations (Orphan Code Left by AI Agents)
// Detects unexported functions, classes, and variables declared in diffs but never used anywhere in the file.

export const id = 'SLOP05_GHOST_DECLARATION';
export const name = 'Ghost Declaration (Unused Orphan Helper)';
export const severity = 'medium';
export const weight = 2.0;

export function check({ file, hunk, line, fullContent, isTest }) {
  if (!fullContent) return null;
  const text = line.content.trim();
  if (!text) return null;

  // Skip export lines
  if (/^export\b/.test(text)) return null;

  // Match function declarations: function foo(, const foo = (, let foo = (
  let nameMatch = null;
  let kind = '';

  const fnMatch = text.match(/^(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(/);
  if (fnMatch) {
    nameMatch = fnMatch[1];
    kind = 'Function';
  } else {
    const arrowMatch = text.match(/^(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/);
    if (arrowMatch) {
      nameMatch = arrowMatch[1];
      kind = 'Arrow function';
    } else {
      const classMatch = text.match(/^class\s+([a-zA-Z0-9_$]+)\b/);
      if (classMatch) {
        nameMatch = classMatch[1];
        kind = 'Class';
      }
    }
  }

  if (!nameMatch) return null;

  // Ignore standard lifecycle or hook names, or dummy names
  if (nameMatch.startsWith('_') && nameMatch.length > 2) {
    // Some developers prefix intentionally unused params or private symbols
  }

  // Count occurrences of the identifier in the full file content
  // Using word boundary matching
  const regex = new RegExp(`\\b${escapeRegExp(nameMatch)}\\b`, 'g');
  const matches = fullContent.match(regex);

  // If it only occurs once (its own declaration), it is 100% unused and unexported
  if (matches && matches.length === 1) {
    return {
      ruleId: id,
      ruleName: name,
      severity,
      weight,
      message: `${kind} '${nameMatch}' is declared in the diff but never exported and never referenced in the file.`,
      snippet: text
    };
  }

  return null;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
