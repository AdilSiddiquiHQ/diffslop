import test from 'node:test';
import assert from 'node:assert';
import { auditRawDiff } from '../lib/engine.js';

const SLOP_DIFF = `
diff --git a/src/api.js b/src/api.js
index 1111111..2222222 100644
--- a/src/api.js
+++ b/src/api.js
@@ -10,0 +11,6 @@
+// Note: This was updated to avoid recursion error
+export function fetchData() {
+  if (process.env.NODE_ENV === 'test') return { mock: true };
+  try { fetch('https://api.com'); } catch (e) {}
+  return null;
+}
diff --git a/test/api.test.js b/test/api.test.js
new file mode 100644
index 0000000..3333333
--- /dev/null
+++ b/test/api.test.js
@@ -0,0 +1,4 @@
+import assert from 'node:assert';
+test('api', () => {
+  assert(true);
+});
`.trim();

const CLEAN_DIFF = `
diff --git a/src/math.js b/src/math.js
new file mode 100644
index 0000000..4444444
--- /dev/null
+++ b/src/math.js
@@ -0,0 +1,5 @@
+export function add(a, b) {
+  if (typeof a !== 'number' || typeof b !== 'number') {
+    throw new TypeError('Operands must be numbers');
+  }
+  return a + b;
+}
diff --git a/test/math.test.js b/test/math.test.js
new file mode 100644
index 0000000..5555555
--- /dev/null
+++ b/test/math.test.js
@@ -0,0 +1,7 @@
+import assert from 'node:assert';
+import { add } from '../src/math.js';
+
+test('add adds two numbers', () => {
+  assert.strictEqual(add(2, 3), 5);
+});
`.trim();

test('auditRawDiff correctly identifies slop and computes Slop Index', () => {
  const result = auditRawDiff(SLOP_DIFF);
  assert.strictEqual(result.clean, false);
  assert.ok(result.findings.length >= 4, `Expected at least 4 findings, got ${result.findings.length}`);
  assert.ok(result.slopIndex > 0, 'Slop index should be greater than 0');
  assert.ok(result.totalLinesAdded > 0, 'Lines added should be greater than 0');
});

test('auditRawDiff reports 0% Slop Index on clean diff', () => {
  const result = auditRawDiff(CLEAN_DIFF);
  assert.strictEqual(result.clean, true);
  assert.strictEqual(result.findings.length, 0);
  assert.strictEqual(result.slopIndex, 0);
});
