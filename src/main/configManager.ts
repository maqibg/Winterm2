import { app } from 'electron'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'

function getDataDir(): string {
  let dir: string
  if (app.isPackaged) {
    // 打包后：与 exe 同级
    dir = join(dirname(app.getPath('exe')), 'data')
  } else {
    // 开发模式：项目根目录
    dir = join(app.getAppPath(), 'data')
  }
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export function readConfig(name: string): string | null {
  const file = join(getDataDir(), `${name}.json`)
  if (!existsSync(file)) return null
  return readFileSync(file, 'utf-8')
}

export function writeConfig(name: string, data: string): void {
  writeFileSync(join(getDataDir(), `${name}.json`), data, 'utf-8')
}
