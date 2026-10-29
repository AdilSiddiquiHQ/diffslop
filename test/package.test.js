import test from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

test('package.json enforces hard invariants', () => {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

  assert.strictEqual(pkg.name, 'diffslop');
  assert.strictEqual(pkg.version, '0.1.0');
  assert.strictEqual(pkg.type, 'module');
  assert.strictEqual(pkg.author, 'Adil Siddiqui');
  assert.strictEqual(pkg.license, 'MIT');

  // Hard Invariant: Zero Runtime Dependencies
  assert.ok(
    !pkg.dependencies || Object.keys(pkg.dependencies).length === 0,
    'Runtime dependencies must remain strictly 0'
  );

  // Engines Node >= 20
  assert.ok(pkg.engines && pkg.engines.node && pkg.engines.node.includes('>=20'));

  // Bin executable exists
  assert.ok(pkg.bin && pkg.bin.diffslop);
  assert.ok(existsSync(path.join(ROOT, pkg.bin.diffslop)));

  // Exports exists
  assert.ok(pkg.exports && pkg.exports['.']);
  assert.ok(existsSync(path.join(ROOT, pkg.exports['.'])));

  // Shell script exists for action.yml
  assert.ok(existsSync(path.join(ROOT, 'scripts/diffslop.sh')));
  assert.ok(existsSync(path.join(ROOT, 'action.yml')));
  assert.ok(existsSync(path.join(ROOT, 'LICENSE')));
});
