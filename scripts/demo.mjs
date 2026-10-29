// Deterministic demo runner on real examples for GIFs, CLI showcases, and README validation.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditParsedDiff, formatReport } from '../lib/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');

/**
 * Synthesizes a diff for a set of example files.
 */
function createExampleDiff(filePairs) {
  const files = [];
  for (const { relPath, fullPath } of filePairs) {
    const content = readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);
    files.push({
      oldPath: relPath,
      newPath: relPath,
      isDeleted: false,
      isNew: false,
      hunks: [
        {
          oldStart: 1,
          oldLen: 0,
          newStart: 1,
          newLen: lines.length,
          lines: lines.map((line, idx) => ({
            type: '+',
            lineNum: idx + 1,
            content: line
          }))
        }
      ]
    });
  }
  return files;
}

export function runSlopDemo() {
  const files = createExampleDiff([
    {
      relPath: 'src/checkout.js',
      fullPath: path.join(ROOT, 'examples/shop-slop/src/checkout.js')
    },
    {
      relPath: 'test/checkout.test.js',
      fullPath: path.join(ROOT, 'examples/shop-slop/test/checkout.test.js')
    }
  ]);

  const result = auditParsedDiff(files, { cwd: ROOT });
  const report = formatReport(result);
  return { result, report };
}

export function runCleanDemo() {
  const files = createExampleDiff([
    {
      relPath: 'src/checkout.js',
      fullPath: path.join(ROOT, 'examples/shop-clean/src/checkout.js')
    },
    {
      relPath: 'test/checkout.test.js',
      fullPath: path.join(ROOT, 'examples/shop-clean/test/checkout.test.js')
    }
  ]);

  const result = auditParsedDiff(files, { cwd: ROOT });
  const report = formatReport(result);
  return { result, report };
}

async function main() {
  console.log('--- RUNNING SLOP DEMO (examples/shop-slop) ---');
  const slop = runSlopDemo();
  console.log(slop.report);

  console.log('--- RUNNING CLEAN DEMO (examples/shop-clean) ---');
  const clean = runCleanDemo();
  console.log(clean.report);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
