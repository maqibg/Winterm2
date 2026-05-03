import { app } from 'electron'
import { execSync } from 'child_process'

const MENU_KEY = 'WinTerm2'
const MENU_LABEL = '在 WinTerm2 中打开'

function getExePath(): string {
  return app.getPath('exe')
}

function regAdd(key: string, value: string, data: string): void {
  try {
    execSync(`reg add "${key}" /ve /t REG_SZ /d "${data}" /f`, { stdio: 'pipe' })
  } catch {
    // ignore
  }
}

function regAddIcon(key: string, iconPath: string): void {
  try {
    execSync(`reg add "${key}" /v Icon /t REG_SZ /d "${iconPath}" /f`, { stdio: 'pipe' })
  } catch {
    // ignore
  }
}

function regDelete(key: string): void {
  try {
    execSync(`reg delete "${key}" /f`, { stdio: 'pipe' })
  } catch {
    // key may not exist
  }
}

export function enableContextMenu(): void {
  const exe = getExePath()
  const icon = exe

  // 右键文件夹
  const dirKey = `HKCU\\Software\\Classes\\Directory\\shell\\${MENU_KEY}`
  regAdd(dirKey, '', MENU_LABEL)
  regAddIcon(dirKey, icon)
  regAdd(`${dirKey}\\command`, '', `"${exe}" "%1"`)

  // 右键文件夹背景
  const bgKey = `HKCU\\Software\\Classes\\Directory\\Background\\shell\\${MENU_KEY}`
  regAdd(bgKey, '', MENU_LABEL)
  regAddIcon(bgKey, icon)
  regAdd(`${bgKey}\\command`, '', `"${exe}" "%V"`)

  // 右键磁盘驱动器
  const driveKey = `HKCU\\Software\\Classes\\Drive\\shell\\${MENU_KEY}`
  regAdd(driveKey, '', MENU_LABEL)
  regAddIcon(driveKey, icon)
  regAdd(`${driveKey}\\command`, '', `"${exe}" "%V"`)
}

export function disableContextMenu(): void {
  regDelete(`HKCU\\Software\\Classes\\Directory\\shell\\${MENU_KEY}`)
  regDelete(`HKCU\\Software\\Classes\\Directory\\Background\\shell\\${MENU_KEY}`)
  regDelete(`HKCU\\Software\\Classes\\Drive\\shell\\${MENU_KEY}`)
}
