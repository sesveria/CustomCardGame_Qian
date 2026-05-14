// Cross-platform pack script — generates distributable ZIP using Node.js only.
// Usage: node scripts/pack.mjs
// Works on Windows, macOS, Linux.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SERVE = path.join(ROOT, 'scripts', 'serve.mjs');
const START_CMD = path.join(ROOT, 'scripts', 'start.cmd');
const START_SH = path.join(ROOT, 'scripts', 'start.sh');
const OUT = path.join(ROOT, 'knowledge-card-game.zip');

// 1. Build
console.log('🔨 Building...');
execSync('npm run full:build', { cwd: ROOT, stdio: 'inherit' });

// 2. Copy serve.mjs + start scripts into dist/
console.log('📁 Copying launcher scripts...');
fs.cpSync(SERVE, path.join(DIST, 'serve.mjs'));
fs.cpSync(START_CMD, path.join(DIST, 'start.cmd'));
fs.cpSync(START_SH, path.join(DIST, 'start.sh'));
fs.cpSync(path.join(ROOT, 'README.md'), path.join(DIST, 'README.md'));

// 3. Create ZIP (platform-aware)
console.log('📦 Creating ZIP...');
if (fs.existsSync(OUT)) fs.unlinkSync(OUT);

// Try PowerShell Compress-Archive on Windows, otherwise zip on Unix
if (process.platform === 'win32') {
  try {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${DIST}\\*' -DestinationPath '${OUT}'"`,
      { cwd: ROOT, stdio: 'inherit' }
    );
  } catch {
    console.log('⚠️  PowerShell not available. Skipping ZIP. Files ready in dist/');
  }
} else {
  try {
    execSync(`zip -r "${OUT}" .`, { cwd: DIST, stdio: 'inherit' });
  } catch {
    console.log('⚠️  zip not found. Install zip or use: tar -czf knowledge-card-game.tar.gz -C dist .');
  }
}

if (fs.existsSync(OUT)) {
  const stat = fs.statSync(OUT);
  console.log(`✅ 打包完成: knowledge-card-game.zip (${(stat.size / 1024).toFixed(0)} KB)`);
} else {
  console.log('✅ 构建完成! dist/ 目录可以直接分发');
}
