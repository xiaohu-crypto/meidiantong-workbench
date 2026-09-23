// One-shot repack: overlay new dist + dist-electron + package.json into the 953MB container asar
// (extract from latest app.asar.bak-*, back up current app.asar, re-pack, pin app-update.yml).
const fs = require("fs");
const path = require("path");
const os = require("os");
const asar = require("@electron/asar");

const PROJECT = "D:/HaLeMa/Documents/媒电通工作台/code/meidiantong-workbench";
const INSTALL = "D:/软件安装/个人工作台/meidiantong-workbench";
const RES = path.join(INSTALL, "resources");

for (const p of [path.join(PROJECT, "dist/index.html"), path.join(PROJECT, "dist-electron/main.js"), path.join(PROJECT, "dist-electron/preload.js")]) {
  if (!fs.existsSync(p)) throw new Error("missing build artifact: " + p);
}

const baks = fs.readdirSync(RES)
  .filter((f) => (f.startsWith("app.asar.bak-") || f.startsWith("app.asar.old-")) && !f.includes(".wrong"))
  .map((f) => ({ f, s: fs.statSync(path.join(RES, f)).size }))
  .filter((x) => x.s > 100 * 1024 * 1024)
  .sort((a, b) => b.s - a.s);
if (!baks.length) throw new Error("no >100MB backup asar in " + RES);
const bakPath = path.join(RES, baks[0].f);
console.log("container source: " + baks[0].f + " (" + (baks[0].s / 1048576).toFixed(1) + "MB)");

const cur = path.join(RES, "app.asar");
const ts = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
fs.copyFileSync(cur, path.join(RES, "app.asar.pre-v021-" + ts));
console.log("backed up current app.asar");

const exDir = path.join(os.tmpdir(), "mdt_repack_" + ts);
fs.rmSync(exDir, { recursive: true, force: true });
fs.mkdirSync(exDir, { recursive: true });
console.log("$ asar extract " + path.basename(bakPath));
asar.extractAll(bakPath, exDir);

for (const sub of ["dist", "dist-electron"]) {
  const dst = path.join(exDir, sub);
  fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(path.join(PROJECT, sub), dst, { recursive: true });
  console.log("replaced " + sub);
}
fs.copyFileSync(path.join(PROJECT, "package.json"), path.join(exDir, "package.json"));
console.log("replaced package.json");

console.log("$ asar pack " + exDir + " -> app.asar");
asar.createPackage(exDir, cur);
console.log("new app.asar = " + (fs.statSync(cur).size / 1048576).toFixed(1) + "MB");

fs.writeFileSync(path.join(RES, "app-update.yml"), "owner: xiaohu-crypto\nrepo: meidiantong-workbench\nprovider: github\nupdaterCacheDirName: meidiantong-workbench-updater\n");
console.log("app-update.yml pinned");

fs.rmSync(exDir, { recursive: true, force: true });
console.log("DONE: v0.2.1 overlaid onto container; install dir now ships new app logic with full node_modules.");
