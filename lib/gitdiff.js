// Zero-dependency git diff parser and file extractor.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Execute git command safely and return output.
 */
export function runGit(cmd, cwd = process.cwd()) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    return null;
  }
}

/**
 * Fetch unified diff with 0 context lines for strict line-attribution.
 */
export function getDiff({ since = 'origin/main', staged = false, cwd = process.cwd() } = {}) {
  let cmd = 'git diff -U0';
  if (staged) {
    cmd += ' --cached';
  } else if (since) {
    // If since is provided, check if it exists in repo
    const hasRef = runGit(`git rev-parse --verify ${since}^{commit}`, cwd);
    if (hasRef) {
      cmd += ` ${since}`;
    } else {
      // Fallback: compare against HEAD~1 or HEAD if available
      const hasHead1 = runGit('git rev-parse --verify HEAD~1', cwd);
      if (hasHead1) {
        cmd += ' HEAD~1';
      }
    }
  }

  const raw = runGit(cmd, cwd);
  return raw || '';
}

/**
 * Parse unified diff output into structured files and hunks.
 */
export function parseDiff(rawDiff) {
  if (!rawDiff || typeof rawDiff !== 'string') return [];

  const files = [];
  const lines = rawDiff.split(/\r?\n/);
  let currentFile = null;
  let currentHunk = null;
  let currentNewLineNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect file header
    if (line.startsWith('diff --git ')) {
      currentFile = {
        oldPath: null,
        newPath: null,
        isDeleted: false,
        isNew: false,
        isBinary: false,
        hunks: []
      };
      files.push(currentFile);
      currentHunk = null;
      continue;
    }

    if (!currentFile) continue;

    if (line.startsWith('--- a/')) {
      currentFile.oldPath = line.slice(6);
      continue;
    } else if (line.startsWith('--- /dev/null')) {
      currentFile.oldPath = null;
      currentFile.isNew = true;
      continue;
    }

    if (line.startsWith('+++ b/')) {
      currentFile.newPath = line.slice(6);
      continue;
    } else if (line.startsWith('+++ /dev/null')) {
      currentFile.newPath = null;
      currentFile.isDeleted = true;
      continue;
    }

    if (line.startsWith('Binary files ')) {
      currentFile.isBinary = true;
      continue;
    }

    // Detect hunk header: @@ -oldStart,oldLen +newStart,newLen @@
    const hunkMatch = line.match(/^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)$/);
    if (hunkMatch) {
      const oldStart = parseInt(hunkMatch[1], 10);
      const oldLen = hunkMatch[2] !== undefined ? parseInt(hunkMatch[2], 10) : 1;
      const newStart = parseInt(hunkMatch[3], 10);
      const newLen = hunkMatch[4] !== undefined ? parseInt(hunkMatch[4], 10) : 1;
      const heading = hunkMatch[5] || '';

      currentNewLineNum = newStart;
      currentHunk = {
        oldStart,
        oldLen,
        newStart,
        newLen,
        heading: heading.trim(),
        lines: []
      };
      currentFile.hunks.push(currentHunk);
      continue;
    }

    // Inside a hunk
    if (currentHunk) {
      if (line.startsWith('+')) {
        currentHunk.lines.push({
          type: '+',
          lineNum: currentNewLineNum,
          content: line.slice(1)
        });
        currentNewLineNum++;
      } else if (line.startsWith('-')) {
        currentHunk.lines.push({
          type: '-',
          content: line.slice(1)
        });
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push({
          type: ' ',
          lineNum: currentNewLineNum,
          content: line.slice(1)
        });
        currentNewLineNum++;
      }
    }
  }

  // Filter out binary and deleted files with no new path
  return files.filter(f => f.newPath && !f.isBinary);
}

/**
 * Determine if a file is a test file.
 */
export function isTestFile(filePath) {
  if (!filePath) return false;
  const p = filePath.toLowerCase().replace(/\\/g, '/');
  const base = path.basename(p);
  return (
    p.includes('.test.') ||
    p.includes('.spec.') ||
    p.includes('/test/') ||
    p.includes('/tests/') ||
    p.includes('__tests__') ||
    base.endsWith('_test.go') ||
    base.endsWith('_test.py') ||
    base.startsWith('test_')
  );
}

/**
 * Determine if a file is a source code file (JS/TS/Python/Go/Rust/etc).
 */
export function isSourceFile(filePath) {
  if (!filePath) return false;
  const ext = path.extname(filePath).toLowerCase();
  const validExts = new Set([
    '.js', '.mjs', '.cjs', '.jsx',
    '.ts', '.mts', '.cts', '.tsx',
    '.py', '.go', '.rs', '.rb',
    '.java', '.c', '.cpp', '.h', '.cs',
    '.php', '.swift', '.kt'
  ]);
  return validExts.has(ext);
}

/**
 * Read the full file content from workspace.
 */
export function readWorkspaceFile(filePath, cwd = process.cwd()) {
  try {
    const full = path.resolve(cwd, filePath);
    if (!existsSync(full)) return null;
    return readFileSync(full, 'utf8');
  } catch {
    return null;
  }
}
