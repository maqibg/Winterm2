import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron'
import { join } from 'path'
import { setupPtyHandlers, destroyAllPtys } from './ptyManager'
import { readConfig, writeConfig } from './configManager'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  Menu.setApplicationMenu(null)

  setupPtyHandlers(mainWindow)

  // 窗口控制
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false
  })

  ipcMain.on('window:setOpacity', (_event, opacity: number) => {
    mainWindow?.setOpacity(Math.max(0.3, Math.min(1, opacity)))
  })

  ipcMain.handle('shell:openPath', async (_event, filePath: string) => {
    try {
      await shell.openPath(filePath)
    } catch {
      // ignore
    }
  })

  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    try {
      await shell.openExternal(url)
    } catch {
      // ignore
    }
  })

  // 配置文件读写
  ipcMain.handle('config:read', (_event, name: string) => readConfig(name))
  ipcMain.on('config:write', (_event, name: string, data: string) => writeConfig(name, data))

  // 应用版本
  ipcMain.handle('app:getVersion', () => app.getVersion())

  // 最大化状态变化通知
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', false)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 加载页面
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  destroyAllPtys()
  app.quit()
})
