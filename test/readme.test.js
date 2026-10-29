import test from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '../scripts/readme-check.mjs');

test('README metrics match real measured runs byte-for-byte', () => {
  const out = execFileSync('node', [SCRIPT], { encoding: 'utf8' });
  assert.match(out, /README verification passed/);
});
