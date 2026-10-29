// Quick syntax and integrity check for diffslop
import { readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function checkDir(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== 'node_modules' && entry !== '.git') checkDir(full);
    } else if (full.endsWith('.js') || full.endsWith('.mjs')) {
      const res = spawnSync('node', ['--check', full], { encoding: 'utf8' });
      if (res.status !== 0) {
        console.error(`Syntax error in ${full}:`, res.stderr);
        process.exit(1);
      }
    }
  }
}

checkDir(path.join(ROOT, 'lib'));
checkDir(path.join(ROOT, 'bin'));
checkDir(path.join(ROOT, 'scripts'));
checkDir(path.join(ROOT, 'test'));

console.log('✔ All JavaScript files passed syntax verification.');
