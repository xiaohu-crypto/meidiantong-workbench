import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const asar = require('@electron/asar');

const INST_ASR = 'D:/软件安装/个人工作台/meidiantong-workbench/resources/app.asar';
console.log('=== 1. 安装目录 asar 终态确认 ===');
console.log('size:', fs.statSync(INST_ASR).size, 'mtime:', fs.statSync(INST_ASR).mtime.toISOString());
// 解包读新 hash
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'final-'));
asar.extractAll(INST_ASR, tmp);
const distHtml = fs.readFileSync(path.join(tmp, 'dist/index.html'), 'utf8');
const hash = distHtml.match(/index-[A-Za-z0-9]+\.js/)?.[0];
console.log('installed dist/index.html refs:', hash);
console.log('expected new hash index-BE00GoUr.js :', hash === 'index-BE00GoUr.js' ? 'MATCH ✓' : 'MISMATCH ✗');
if (hash) {
  const jsPath = path.join(tmp, 'dist/assets', hash);
  const s = fs.readFileSync(jsPath, 'latin1');
  for (const k of ['crm-workbench','wb-left','wb-right','wb-ai-eval','wb-health-badge','wb-health-wrap']) {
    console.log('  has', k, ':', s.includes(k));
  }
}
fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n=== 2. 启动主程序并等待渲染 ===');
const exe = 'D:/软件安装/个人工作台/meidiantong-workbench/媒电通工作台.exe';
const app = spawn(exe, [], { detached: false, stdio: 'ignore' });
console.log('spawned pid', app.pid);
await new Promise((r) => setTimeout(r, 9000));

// 检查进程存活
let running = false;
try {
  app.kill(0); // 不会真的杀，仅探测
  running = true;
} catch { running = false; }
console.log('app process alive after 9s:', running);
app.kill('SIGTERM').catch(() => {});
await new Promise((r) => setTimeout(r, 1500));
console.log('terminated app for clean check');
