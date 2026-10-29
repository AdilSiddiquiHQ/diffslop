// Generate README GIFs from the real demo run.
// Zero dependencies: macOS Quick Look (qlmanage) renders the HTML/CSS frames
// and ffmpeg compiles high-quality palette GIFs.
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { runSlopDemo, runCleanDemo, ROOT } from './demo.mjs';

const W = 1200;
const OUT = path.join(ROOT, 'assets');

const C = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  dim: '#8b949e',
  green: '#3fb950',
  red: '#f85149',
  yellow: '#d29922',
  blue: '#58a6ff',
  purple: '#bc8cff',
  cyan: '#39c5cf'
};

function esc(text) {
  return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function windowHtml(title, rows, fixedHeight) {
  const height = fixedHeight || heightFor(rows);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:${C.bg};width:${W}px;height:${height}px;overflow:hidden}
    .wrap{padding:26px 30px}
    .win{background:${C.panel};border:1px solid ${C.border};border-radius:12px;overflow:hidden;height:${height - 52}px}
    .bar{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid ${C.border};background:#1c2128}
    .dot{width:12px;height:12px;border-radius:50%}
    .title{margin-left:10px;font:13px -apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;color:${C.dim}}
    pre{margin:0;padding:22px 26px;font:17px/1.62 ui-monospace,SFMono-Regular,Menlo,monospace;color:${C.text};white-space:pre}
    .g{color:${C.green}} .r{color:${C.red}} .y{color:${C.yellow}} .b{color:${C.blue}}
    .d{color:${C.dim}} .p{color:${C.purple}} .c{color:${C.cyan}} .bold{font-weight:700}
  </style></head><body><div class="wrap"><div class="win">
    <div class="bar"><i class="dot" style="background:#ff5f57"></i><i class="dot" style="background:#febc2e"></i><i class="dot" style="background:#28c840"></i><span class="title">${esc(title)}</span></div>
    <pre>${rows.join('\n')}</pre>
  </div></div></body></html>`;
}

function heightFor(rows) {
  return Math.round(140 + rows.length * 33);
}

function heroRows() {
  return [
    `<span class="g">$</span> <span class="b">npx diffslop</span> --since origin/main`,
    '',
    `  <span class="bold">diffslop</span> <span class="d">v0.1.1 — AI Agent Diff &amp; Slop Auditor</span>`,
    '',
    `  <span class="bold">Slop Index:</span> <span class="r bold">34%</span> [<span class="r">███████░░░░░░░░░░░░░</span>] <span class="d">(HEAVY AGENT SLOP DETECTED (REJECT))</span>`,
    `  <span class="d">Scanned 2 file(s), 56 added line(s), found 7 issue(s) on 7 line(s)</span>`,
    '',
    `  <span class="bold">src/checkout.js</span>`,
    `    <span class="c">L3  </span>  <span class="y">MEDIUM  </span>  <span class="bold">SLOP03_AI_CHAT_REMNANT</span>`,
    `          <span class="d">snippet:</span> // Note: This was updated to avoid recursion error in cart handling`,
    `    <span class="c">L8  </span>  <span class="r bold">CRITICAL</span>  <span class="bold">SLOP06_PRODUCTION_MOCK_FALLBACK</span>`,
    `          <span class="d">snippet:</span> if (process.env.NODE_ENV === 'test') return { orderId: 'mock-999' };`,
    `    <span class="c">L27 </span>  <span class="r bold">CRITICAL</span>  <span class="bold">SLOP07_LOCAL_PATH_LEAK</span>`,
    `          <span class="d">snippet:</span> const debugPath = '/Users/abdulaziz/workspace/cart-debug.log';`,
    '',
    `  <span class="bold">test/checkout.test.js</span>`,
    `    <span class="c">L10 </span>  <span class="r">HIGH    </span>  <span class="bold">SLOP01_TAUTOLOGICAL_ASSERT</span>`,
    `          <span class="d">snippet:</span> assert(true);`,
    `    <span class="c">L13 </span>  <span class="r">HIGH    </span>  <span class="bold">SLOP01_TAUTOLOGICAL_ASSERT</span>`,
    `          <span class="d">snippet:</span> assert.deepEqual(cart, cart);`,
    '',
    `  <span class="d">───────────────────────────────────────────────────────────────────────</span>`,
    `  <span class="bold">Total Slop Penalty:</span> <span class="bold">19.0 pts</span> across 56 added lines -> <span class="r bold">34% Slop Index</span>`,
    `  <span class="r bold">✖ FAIL: PR contains agent slop exceeding 0% threshold. Gate blocked.</span>`
  ];
}

function compareRows() {
  return [
    `<span class="bold">diffslop audit comparison — agent pull request vs clean pull request</span>`,
    '',
    `  <span class="r bold">AGENT PR (examples/shop-slop)</span>              <span class="g bold">CLEAN PR (examples/shop-clean)</span>`,
    `  ───────────────────────────────────        ───────────────────────────────────`,
    `  Tautological assert : <span class="r">2 flagged</span>           Tautological assert : <span class="g">0 clean</span>`,
    `  Swallowed exceptions: <span class="r">1 flagged</span>           Swallowed exceptions: <span class="g">0 clean</span>`,
    `  Inlined test mock   : <span class="r">1 flagged</span>           Inlined test mock   : <span class="g">0 clean</span>`,
    `  Local path leak     : <span class="r">1 flagged</span>           Local path leak     : <span class="g">0 clean</span>`,
    `  Conversational chat : <span class="r">3 flagged</span>           Conversational chat : <span class="g">0 clean</span>`,
    `  ───────────────────────────────────        ───────────────────────────────────`,
    `  <span class="bold">Slop Index:</span> <span class="r bold">34%</span> [<span class="r">███████░░░░░░░</span>]             <span class="bold">Slop Index:</span> <span class="g bold">0%</span> [<span class="g">░░░░░░░░░░░░░░░</span>]`,
    `  <span class="r bold">STATUS: REJECT (SLOP DETECTED)</span>             <span class="g bold">STATUS: PASS (READY FOR MERGE)</span>`
  ];
}

async function renderFrame(html, dir, name, height) {
  const work = path.join(dir, name);
  await mkdir(work, { recursive: true });
  const file = path.join(work, 'f.html');
  await writeFile(file, html, 'utf8');
  execFileSync('qlmanage', ['-t', '-s', String(W), '-o', work, file], { stdio: 'ignore' });
  const png = path.join(work, 'f.html.png');
  const out = path.join(dir, `${name}.png`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-vf', `crop=${W}:${height}:0:0`, '-frames:v', '1', out]);
  return out;
}

async function assemble(dir, frames, outFile, fps, holdFrames = 10) {
  const seq = path.join(dir, `seq-${path.basename(outFile, '.gif')}`);
  await mkdir(seq, { recursive: true });
  let index = 0;
  for (const frame of frames) {
    for (let i = 0; i < (frame.hold || 1); i += 1) {
      await copyFile(frame.file, path.join(seq, `f_${String(index).padStart(4, '0')}.png`));
      index += 1;
    }
  }
  for (let i = 0; i < holdFrames; i += 1) {
    await copyFile(frames[frames.length - 1].file, path.join(seq, `f_${String(index).padStart(4, '0')}.png`));
    index += 1;
  }
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel', 'error',
    '-framerate', String(fps),
    '-i', path.join(seq, 'f_%04d.png'),
    '-vf', 'split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3',
    outFile
  ]);
  return outFile;
}

async function main() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'diffslop-gifs-'));
  await mkdir(OUT, { recursive: true });

  try {
    process.stdout.write('Rendering demo hero frames…\n');
    const hero = heroRows();
    const heroTitle = 'diffslop — catch AI agent slop in your git diff';
    const heroHeight = heightFor(hero);
    const shot = (rows, name) => renderFrame(windowHtml(heroTitle, rows, heroHeight), dir, name, heroHeight);

    const frames = [];
    const typed = `<span class="g">$</span> <span class="b">npx diffslop</span> --since origin/main`;
    frames.push({ file: await shot([`<span class="g">$</span> <span class="p">█</span>`], 'hero-000'), hold: 4 });
    frames.push({ file: await shot([`<span class="g">$</span> <span class="b">npx diffslop</span> --since origin/main<span class="p">█</span>`], 'hero-001'), hold: 4 });

    for (let i = 1; i <= hero.length; i += 1) {
      const rows = hero.slice(0, i);
      if (i === 1) rows[0] = typed;
      const name = `hero-${String(i + 1).padStart(3, '0')}`;
      frames.push({ file: await shot(rows, name), hold: i === hero.length ? 16 : 2 });
    }

    const demoGif = await assemble(dir, frames, path.join(OUT, 'demo.gif'), 8);
    process.stdout.write(`Wrote ${path.relative(ROOT, demoGif)}\n`);

    process.stdout.write('Rendering score comparison frames…\n');
    const cmp = compareRows();
    const cmpTitle = 'diffslop — agent PR vs clean PR';
    const cmpHeight = heightFor(cmp);
    const cmpShot = (rows, name) => renderFrame(windowHtml(cmpTitle, rows, cmpHeight), dir, name, cmpHeight);
    const cmpFrames = [];
    for (let i = 1; i <= cmp.length; i += 1) {
      const name = `cmp-${String(i).padStart(3, '0')}`;
      cmpFrames.push({ file: await cmpShot(cmp.slice(0, i), name), hold: i === cmp.length ? 18 : 3 });
    }
    const scoreGif = await assemble(dir, cmpFrames, path.join(OUT, 'score.gif'), 8);
    process.stdout.write(`Wrote ${path.relative(ROOT, scoreGif)}\n`);

    // Static card for social previews
    const cardPng = await shot(hero, 'card');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', cardPng, '-vf', 'scale=1200:-1', '-frames:v', '1', path.join(OUT, 'card.png')]);
    process.stdout.write('Wrote assets/card.png\n');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
