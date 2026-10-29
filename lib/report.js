// Terminal report formatting, progress bars, and JSON output generation.
import { bold, dim, red, green, yellow, blue, cyan, magenta, gray } from './color.js';

export function makeProgressBar(ratio, width = 20) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const filled = Math.round(clamped * width);
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled));
}

export function formatReport(result, { verbose = true } = {}) {
  const lines = [];

  const index = result.slopIndex;
  const ratio = index / 100;
  const bar = makeProgressBar(ratio, 20);

  let indexColor = green;
  let verdict = 'CLEAN DIFF (READY FOR REVIEW)';
  if (index > 25) {
    indexColor = red;
    verdict = 'HEAVY AGENT SLOP DETECTED (REJECT)';
  } else if (index > 0) {
    indexColor = yellow;
    verdict = 'MINOR SLOP DETECTED (NEEDS CLEANUP)';
  }

  lines.push('');
  lines.push(`  ${bold('diffslop')} ${dim('v0.1.1')} — AI Agent Diff & Slop Auditor`);
  lines.push('');
  lines.push(`  ${bold('Slop Index:')} ${indexColor(bold(`${index}%`))} [${indexColor(bar)}] ${dim(`(${verdict})`)}`);
  lines.push(`  ${dim(`Scanned ${result.filesCount} file(s), ${result.totalLinesAdded} added line(s), found ${result.findings.length} issue(s) on ${result.slopLines} line(s)`)}`);
  lines.push('');

  if (result.findings.length === 0) {
    lines.push(`  ${green('✔')} No agent slop, weakened tests, or ghost declarations found.`);
    lines.push('');
    return lines.join('\n');
  }

  // Group findings by file
  const byFile = new Map();
  for (const f of result.findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }

  for (const [file, items] of byFile.entries()) {
    lines.push(`  ${bold(file)}`);
    for (const item of items) {
      let badge = dim(item.severity.toUpperCase().padEnd(8));
      if (item.severity === 'critical') badge = red(bold('CRITICAL'));
      else if (item.severity === 'high') badge = red('HIGH    ');
      else if (item.severity === 'medium') badge = yellow('MEDIUM  ');
      else if (item.severity === 'low') badge = blue('LOW     ');

      const loc = cyan(`L${String(item.line).padEnd(4)}`);
      lines.push(`    ${loc}  ${badge}  ${bold(item.ruleId)}`);
      lines.push(`          ${dim('snippet:')} ${item.snippet}`);
      lines.push(`          ${dim('reason :')} ${item.message}`);
      lines.push('');
    }
  }

  // Summary Table
  lines.push(`  ${dim('───────────────────────────────────────────────────────────────────────')}`);
  lines.push(`  ${dim('Rule Breakdown'.padEnd(36))} ${dim('Severity'.padEnd(10))} ${dim('Count'.padEnd(8))} ${dim('Penalty')}`);
  lines.push(`  ${dim('───────────────────────────────────────────────────────────────────────')}`);

  for (const [ruleId, count] of Object.entries(result.ruleCounts)) {
    const sample = result.findings.find(f => f.ruleId === ruleId);
    const sev = sample ? sample.severity : 'unknown';
    const weight = sample ? sample.weight * count : 0;
    lines.push(`  ${ruleId.padEnd(36)} ${sev.padEnd(10)} ${String(count).padEnd(8)} +${weight.toFixed(1)} pts`);
  }
  lines.push(`  ${dim('───────────────────────────────────────────────────────────────────────')}`);
  lines.push(`  ${bold('Total Slop Penalty:')} ${bold(`${result.totalPenalty.toFixed(1)} pts`)} across ${result.totalLinesAdded} added lines -> ${indexColor(bold(`${index}% Slop Index`))}`);
  lines.push('');

  return lines.join('\n');
}

export function formatJson(result) {
  return JSON.stringify(result, null, 2);
}
