import test from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '../bin/diffslop.js');

test('CLI --version prints 0.1.0', () => {
  const out = execFileSync('node', [BIN, '--version'], { encoding: 'utf8' }).trim();
  assert.strictEqual(out, '0.1.0');
});

test('CLI --help prints usage instructions', () => {
  const out = execFileSync('node', [BIN, '--help'], { encoding: 'utf8' });
  assert.match(out, /diffslop — Catch AI agent slop/);
  assert.match(out, /USAGE/);
  assert.match(out, /--max-index/);
});

test('CLI --all on diffslop codebase reports clean 0% slop', () => {
  const out = execFileSync('node', [BIN, '--all', '--json'], {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..')
  });
  const data = JSON.parse(out);
  assert.ok(data.totalLinesAdded > 0);
  assert.strictEqual(data.slopIndex, 0, 'diffslop codebase itself must have 0% slop index');
});
