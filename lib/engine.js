// Core analysis engine coordinating diff parsing, rule execution, and scoring.
import path from 'node:path';
import { parseDiff, isTestFile, isSourceFile, readWorkspaceFile, getDiff, runGit } from './gitdiff.js';

import * as assertsRule from './rules/asserts.js';
import * as errorsRule from './rules/errors.js';
import * as commentsRule from './rules/comments.js';
import * as typesRule from './rules/types.js';
import * as ghostsRule from './rules/ghosts.js';
import * as mocksRule from './rules/mocks.js';
import * as leaksRule from './rules/leaks.js';
import * as noiseRule from './rules/noise.js';

export const RULES = [
  assertsRule,
  errorsRule,
  commentsRule,
  typesRule,
  ghostsRule,
  mocksRule,
  leaksRule,
  noiseRule
];

export const RULE_MAP = new Map(RULES.map(r => [r.id, r]));

/**
 * Audit parsed diff files and compute Slop Index and findings.
 */
export function auditParsedDiff(files, { cwd = process.cwd(), activeRules = null } = {}) {
  const findings = [];
  let totalLinesAdded = 0;
  const flaggedLineKeys = new Set();

  const rulesToRun = activeRules
    ? RULES.filter(r => activeRules.includes(r.id))
    : RULES;

  for (const file of files) {
    const filePath = file.newPath || file.oldPath;
    if (!filePath) continue;

    const isTest = isTestFile(filePath);
    const fullContent = readWorkspaceFile(filePath, cwd);

    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.type !== '+') continue;
        totalLinesAdded++;

        for (const rule of rulesToRun) {
          try {
            const result = rule.check({
              file,
              filePath,
              hunk,
              line,
              fullContent,
              isTest
            });

            if (result) {
              const finding = {
                file: filePath,
                line: line.lineNum,
                ruleId: result.ruleId,
                ruleName: result.ruleName,
                severity: result.severity,
                weight: result.weight,
                message: result.message,
                snippet: result.snippet
              };
              findings.push(finding);
              flaggedLineKeys.add(`${filePath}:${line.lineNum}`);
            }
          } catch (err) {
            // Rule check failure is safely caught
          }
        }
      }
    }
  }

  const totalPenalty = findings.reduce((sum, f) => sum + f.weight, 0);
  const slopLines = flaggedLineKeys.size;
  const slopIndex = totalLinesAdded === 0
    ? 0
    : Math.min(100, Math.round((totalPenalty / Math.max(1, totalLinesAdded)) * 100));

  // Severity count
  const severityCounts = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length
  };

  // Rule counts
  const ruleCounts = {};
  for (const f of findings) {
    ruleCounts[f.ruleId] = (ruleCounts[f.ruleId] || 0) + 1;
  }

  return {
    filesCount: files.length,
    totalLinesAdded,
    slopLines,
    totalPenalty,
    slopIndex,
    severityCounts,
    ruleCounts,
    findings,
    clean: findings.length === 0
  };
}

/**
 * Audit raw diff string.
 */
export function auditRawDiff(rawDiff, options = {}) {
  const parsed = parseDiff(rawDiff);
  return auditParsedDiff(parsed, options);
}

/**
 * Audit git repository using options ({ since, staged, cwd }).
 */
export function auditGitDiff(options = {}) {
  const rawDiff = getDiff(options);
  return auditRawDiff(rawDiff, options);
}

/**
 * Audit all tracked files in the workspace as a synthesized diff.
 */
export function auditAllFiles({ cwd = process.cwd(), activeRules = null, exclude = ['examples/', 'fixtures/', 'test/', 'tests/'] } = {}) {
  const tracked = runGit('git ls-files --cached --others --exclude-standard', cwd);
  if (!tracked) return auditParsedDiff([], { cwd, activeRules });

  const fileList = tracked
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(f => !exclude.some(ex => f.startsWith(ex) || f.includes('/' + ex)))
    .filter(isSourceFile);
  const synthesizedFiles = [];

  for (const relPath of fileList) {
    const content = readWorkspaceFile(relPath, cwd);
    if (!content) continue;

    const lines = content.split(/\r?\n/);
    const hunkLines = lines.map((lineStr, idx) => ({
      type: '+',
      lineNum: idx + 1,
      content: lineStr
    }));

    synthesizedFiles.push({
      oldPath: null,
      newPath: relPath,
      isDeleted: false,
      isNew: true,
      hunks: [
        {
          oldStart: 0,
          oldLen: 0,
          newStart: 1,
          newLen: lines.length,
          lines: hunkLines
        }
      ]
    });
  }

  return auditParsedDiff(synthesizedFiles, { cwd, activeRules });
}
