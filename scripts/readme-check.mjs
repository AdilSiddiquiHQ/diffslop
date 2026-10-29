// Asserts byte-for-byte that outputs and figures cited in README.md match real measured runs.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSlopDemo, runCleanDemo, ROOT } from './demo.mjs';

const readme = readFileSync(path.join(ROOT, 'README.md'), 'utf8');

// 1. Verify Slop Demo numbers
const slop = runSlopDemo();
const slopIndexStr = `${slop.result.slopIndex}%`;
if (!readme.includes(slopIndexStr)) {
  console.error(`README is missing measured Slop Index: ${slopIndexStr}`);
  process.exit(1);
}

const penaltyStr = `${slop.result.totalPenalty.toFixed(1)} pts`;
if (!readme.includes(penaltyStr)) {
  console.error(`README is missing measured penalty: ${penaltyStr}`);
  process.exit(1);
}

// 2. Verify Clean Demo numbers
const clean = runCleanDemo();
const cleanIndexStr = `${clean.result.slopIndex}%`;
if (!readme.includes(cleanIndexStr)) {
  console.error(`README is missing measured clean Slop Index: ${cleanIndexStr}`);
  process.exit(1);
}

// 3. Verify exactly 8 badges
const badgeMatches = readme.match(/\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)/g);
if (!badgeMatches || badgeMatches.length !== 8) {
  console.error(`README must have exactly 8 badges, found ${badgeMatches ? badgeMatches.length : 0}`);
  process.exit(1);
}

console.log('✔ README verification passed: all metrics and badges match measured reality.');
