<#
.SYNOPSIS
  媒电通工作台 - 一键打包安装版脚本
.DESCRIPTION
  每次更新源码后运行此脚本，自动完成：
  1. 停止应用进程  2. 清理 IndexedDB LOCK  3. 构建源码
  4. 从备份 asar 提取 node_modules  5. 替换 dist/dist-electron
  6. 备份旧 asar  7. 打包新 asar  8. 修复更新源
  9. 清理临时文件  10. 可选启动验证
.NOTES
  使用方法：在项目根目录运行 .\scripts\repack-installer.ps1
  可选参数：-SkipBuild（跳过构建）、-NoLaunch（不启动验证）
#>

param(
  [switch]$SkipBuild,
  [switch]$NoLaunch
)

$ErrorActionPreference = "Stop"

# ============ 配置 ============
$PROJECT_DIR = "D:\HaLeMa\Documents\Obsidianku\原始资料\autoclaw\app"
$INSTALL_DIR = "D:\软件安装\个人工作台\meidiantong-workbench"
$RESOURCES_DIR = "$INSTALL_DIR\resources"
$BACKUP_ASAR = "$RESOURCES_DIR\app.asar.bak-20260914-160204"  # 含完整 node_modules 的备份
$EXTRACT_DIR = "$env:TEMP\mdt_repack_$(Get-Date -Format 'HHmmss')"
$APP_DATA = "$env:APPDATA\meidiantong-workbench"

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red }

# ============ 1. 停止应用进程 ============
Write-Step "1. 停止应用进程"
$procs = Get-Process | Where-Object { $_.Path -like "*meidiantong-workbench*" -or $_.ProcessName -like "*媒电通工作台*" }
if ($procs) {
  $procs | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 3
  Write-Ok "已停止 $($procs.Count) 个进程"
} else {
  Write-Ok "无运行中的进程"
}

# ============ 2. 清理 IndexedDB LOCK ============
Write-Step "2. 清理 IndexedDB LOCK"
$lockPath = "$APP_DATA\IndexedDB\file__0.indexeddb.leveldb\LOCK"
if (Test-Path $lockPath) {
  Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
  Write-Ok "LOCK 已删除"
} else {
  Write-Ok "无 LOCK 文件"
}

# ============ 3. 构建源码 ============
if (-not $SkipBuild) {
  Write-Step "3. 构建源码 (vite + electron:main)"
  Push-Location $PROJECT_DIR
  try {
    npm run build 2>&1 | Select-Object -Last 3
    if ($LASTEXITCODE -ne 0) { throw "vite build 失败" }
    npm run electron:main 2>&1 | Select-Object -Last 3
    if ($LASTEXITCODE -ne 0) { throw "electron:main 构建失败" }
    Write-Ok "源码构建成功"
  } finally {
    Pop-Location
  }
} else {
  Write-Step "3. 跳过源码构建 (-SkipBuild)"
}

# ============ 4. 验证备份 asar 存在 ============
Write-Step "4. 验证备份 asar (node_modules 来源)"
if (-not (Test-Path $BACKUP_ASAR)) {
  Write-Err "备份 asar 不存在: $BACKUP_ASAR"
  Write-Warn "请从安装目录找一个含 node_modules 的 asar 备份，或重新运行 electron-builder 打包"
  exit 1
}
$bakSize = [math]::Round((Get-Item $BACKUP_ASAR).Length / 1MB, 1)
Write-Ok "备份 asar: $bakSize MB"

# ============ 5. 提取备份 asar ============
Write-Step "5. 提取备份 asar (含 node_modules)"
if (Test-Path $EXTRACT_DIR) { Remove-Item $EXTRACT_DIR -Recurse -Force }
New-Item -ItemType Directory $EXTRACT_DIR | Out-Null
Push-Location $PROJECT_DIR
try {
  npx asar extract $BACKUP_ASAR $EXTRACT_DIR 2>&1 | Select-Object -Last 1
  $fileCount = (Get-ChildItem $EXTRACT_DIR -Recurse -File -ErrorAction SilentlyContinue).Count
  Write-Ok "提取完成: $fileCount 个文件"
} finally {
  Pop-Location
}

# ============ 6. 替换 dist / dist-electron / package.json ============
Write-Step "6. 替换最新构建产物"
# dist
if (Test-Path "$EXTRACT_DIR\dist") { Remove-Item "$EXTRACT_DIR\dist" -Recurse -Force }
Copy-Item "$PROJECT_DIR\dist" "$EXTRACT_DIR\dist" -Recurse
Write-Ok "dist 已替换"
# dist-electron
if (Test-Path "$EXTRACT_DIR\dist-electron") { Remove-Item "$EXTRACT_DIR\dist-electron" -Recurse -Force }
Copy-Item "$PROJECT_DIR\dist-electron" "$EXTRACT_DIR\dist-electron" -Recurse
Write-Ok "dist-electron 已替换"
# package.json
Copy-Item "$PROJECT_DIR\package.json" "$EXTRACT_DIR\package.json" -Force
Write-Ok "package.json 已替换"

# ============ 7. 备份当前 asar ============
Write-Step "7. 备份当前 asar"
$currentAsar = "$RESOURCES_DIR\app.asar"
if (Test-Path $currentAsar) {
  $bakName = "app.asar.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Copy-Item $currentAsar "$RESOURCES_DIR\$bakName" -Force
  Write-Ok "已备份为 $bakName"
  # 只保留最近3个备份
  $oldBaks = Get-ChildItem "$RESOURCES_DIR\app.asar.bak-*" | Sort-Object LastWriteTime -Descending
  if ($oldBaks.Count -gt 3) {
    $oldBaks | Select-Object -Skip 3 | Remove-Item -Force
    Write-Ok "已清理旧备份（保留最近3个）"
  }
}

# ============ 8. 打包新 asar ============
Write-Step "8. 打包新 asar"
Push-Location $PROJECT_DIR
try {
  npx asar pack $EXTRACT_DIR $currentAsar 2>&1 | Select-Object -Last 1
  $newSize = [math]::Round((Get-Item $currentAsar).Length / 1MB, 1)
  Write-Ok "打包完成: $newSize MB"
} finally {
  Pop-Location
}

# ============ 9. 修复更新源 ============
Write-Step "9. 确保更新源正确"
$updateYml = "$RESOURCES_DIR\app-update.yml"
$correctContent = @"
owner: xiaohu-crypto
repo: meidiantong-workbench
provider: github
updaterCacheDirName: meidiantong-workbench-updater
"@
if (Test-Path $updateYml) {
  $currentContent = Get-Content $updateYml -Raw
  if ($currentContent -match "repo:\s*meidiantong-workbench") {
    Write-Ok "更新源已正确 (meidiantong-workbench)"
  } else {
    Copy-Item $updateYml "$updateYml.wrong" -Force
    Set-Content -Path $updateYml -Value $correctContent -Encoding UTF8
    Write-Warn "更新源已修复（原错误配置备份为 app-update.yml.wrong）"
  }
} else {
  Set-Content -Path $updateYml -Value $correctContent -Encoding UTF8
  Write-Ok "已创建 app-update.yml"
}

# ============ 10. 清理临时文件 ============
Write-Step "10. 清理临时文件"
if (Test-Path $EXTRACT_DIR) {
  Remove-Item $EXTRACT_DIR -Recurse -Force -ErrorAction SilentlyContinue
  Write-Ok "提取目录已清理"
}
# 清理更新缓存
$updateCache = "$env:LOCALAPPDATA\meidiantong-workbench-updater"
if (Test-Path $updateCache) {
  Remove-Item $updateCache -Recurse -Force -ErrorAction SilentlyContinue
  Write-Ok "更新缓存已清理"
}
# 清理 Temp 中残留的媒电通应用目录
$tempAppDirs = Get-ChildItem "$env:TEMP" -Directory -ErrorAction SilentlyContinue | Where-Object {
  $_.Name -match "^[A-Za-z0-9]{15,}$" -and (Test-Path "$($_.FullName)\媒电通工作台.exe")
}
foreach ($d in $tempAppDirs) {
  Remove-Item $d.FullName -Recurse -Force -ErrorAction SilentlyContinue
  Write-Ok "Temp 残留应用已清理: $($d.Name)"
}

# ============ 11. 启动验证 ============
if (-not $NoLaunch) {
  Write-Step "11. 启动验证"
  Start-Process "$INSTALL_DIR\媒电通工作台.exe"
  Write-Ok "应用已启动，等待10秒..."
  Start-Sleep -Seconds 10
  $running = Get-Process | Where-Object { $_.Path -like "*meidiantong-workbench*" }
  if ($running) {
    $mainWin = $running | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object -First 1
    if ($mainWin) {
      Write-Ok "应用运行正常，窗口标题: $($mainWin.MainWindowTitle)"
    } else {
      Write-Warn "进程在运行但无主窗口（可能仍在加载）"
    }
  } else {
    Write-Err "应用启动失败，请检查日志"
  }
}

# ============ 完成 ============
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  打包完成！" -ForegroundColor Green
Write-Host "  asar: $newSize MB" -ForegroundColor Green
Write-Host "  安装目录: $INSTALL_DIR" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
