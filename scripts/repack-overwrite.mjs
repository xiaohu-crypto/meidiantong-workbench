import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);

const NEW_RES = 'release/win-unpacked/resources';
const INST_RES = 'D:/软件安装/个人工作台/meidiantong-workbench/resources';
const NEW_ASR = path.join(NEW_RES, 'app.asar');
const INST_ASR = path.join(INST_RES, 'app.asar');

const now = new Date();
const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const bakPath = path.join(INST_RES, `app.asar.pre-v021-${stamp}`);

console.log('=== step 1: backup old asar ===');
fs.copyFileSync(INST_ASR, bakPath);
console.log('backup:', path.basename(bakPath), fs.statSync(bakPath).size);

console.log('=== step 2: overwrite asar atomically ===');
const tmpPath = path.join(INST_RES, `app.asar.tmp-${stamp}`);
fs.copyFileSync(NEW_ASR, tmpPath);
fs.renameSync(tmpPath, INST_ASR);
console.log('installed asar size:', fs.statSync(INST_ASR).size, 'mtime:', fs.statSync(INST_ASR).mtime.toISOString());

console.log('=== step 3: sync app.asar.unpacked ===');
const unpackedSrc = path.join(NEW_RES, 'app.asar.unpacked');
const unpackedDst = path.join(INST_RES, 'app.asar.unpacked');
if (fs.existsSync(unpackedDst)) fs.rmSync(unpackedDst, { recursive: true, force: true });
fs.cpSync(unpackedSrc, unpackedDst, { recursive: true });
console.log('unpacked synced. files:', walkCount(unpackedDst));

function walkCount(dir) {
  let n = 0;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p); else n++;
    }
  }
  return n;
}

console.log('\n=== DONE ===');
console.log('INST asar:', fs.statSync(INST_ASR).size);
console.log('INST unpacked files:', walkCount(unpackedDst));
