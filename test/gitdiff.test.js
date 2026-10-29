import test from 'node:test';
import assert from 'node:assert';
import { parseDiff, isTestFile, isSourceFile } from '../lib/gitdiff.js';

const SAMPLE_DIFF = `
diff --git a/src/cart.js b/src/cart.js
index e69de29..49b613e 100644
--- a/src/cart.js
+++ b/src/cart.js
@@ -10,0 +11,4 @@
+// Note: This was updated to avoid recursion error
+function calculateTotal(items) {
+  return items.length;
+}
diff --git a/test/cart.test.js b/test/cart.test.js
new file mode 100644
index 0000000..d6e4b85
--- /dev/null
+++ b/test/cart.test.js
@@ -0,0 +1,5 @@
+import assert from 'node:assert';
+test('cart', () => {
+  assert(true);
+});
`.trim();

test('parseDiff parses multi-file unified diff with line numbers', () => {
  const files = parseDiff(SAMPLE_DIFF);
  assert.strictEqual(files.length, 2);

  const file1 = files[0];
  assert.strictEqual(file1.newPath, 'src/cart.js');
  assert.strictEqual(file1.hunks.length, 1);
  const hunk1 = file1.hunks[0];
  assert.strictEqual(hunk1.newStart, 11);
  assert.strictEqual(hunk1.lines.length, 4);
  assert.strictEqual(hunk1.lines[0].lineNum, 11);
  assert.strictEqual(hunk1.lines[0].content, '// Note: This was updated to avoid recursion error');

  const file2 = files[1];
  assert.strictEqual(file2.newPath, 'test/cart.test.js');
  assert.strictEqual(file2.isNew, true);
  assert.strictEqual(file2.hunks[0].newStart, 1);
  assert.strictEqual(file2.hunks[0].lines.length, 4);
});

test('isTestFile accurately identifies test files', () => {
  assert.strictEqual(isTestFile('src/cart.js'), false);
  assert.strictEqual(isTestFile('test/cart.test.js'), true);
  assert.strictEqual(isTestFile('cart.spec.ts'), true);
  assert.strictEqual(isTestFile('pkg/cart_test.go'), true);
  assert.strictEqual(isTestFile('tests/unit/test_cart.py'), true);
});

test('isSourceFile accurately identifies code files', () => {
  assert.strictEqual(isSourceFile('src/cart.js'), true);
  assert.strictEqual(isSourceFile('src/cart.ts'), true);
  assert.strictEqual(isSourceFile('src/cart.py'), true);
  assert.strictEqual(isSourceFile('README.md'), false);
  assert.strictEqual(isSourceFile('package.json'), false);
});
