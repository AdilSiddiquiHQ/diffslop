// Zero-dependency test runner executing all unit and integration tests.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEST_DIR = path.join(ROOT, 'test');

const files = readdirSync(TEST_DIR).filter(f => f.endsWith('.test.js'));
console.log(`Running ${files.length} test suite(s)...`);

let failed = false;
for (const file of files) {
  const full = path.join(TEST_DIR, file);
  const res = spawnSync('node', ['--test', full], {
    stdio: 'inherit',
    cwd: ROOT
  });
  if (res.status !== 0) {
    failed = true;
  }
}

if (failed) {
  console.error('\n✖ One or more tests failed.');
  process.exit(1);
} else {
  console.log('\n✔ All test suites passed cleanly.');
}
