interface TerminalAPI {
  createPty(id: string, cols: number, rows: number, cwd?: string, shell?: string): Promise<void>
  writePty(id: string, data: string): void
  resizePty(id: string, cols: number, rows: number): void
  destroyPty(id: string): void
  onPtyData(id: string, callback: (data: string) => void): () => void
  onPtyExit(id: string, callback: (exitCode: number) => void): () => void
  getCwd(id: string): Promise<string>
  getShellType(id: string): Promise<string>
  updateCwd(id: string, cwd: string): void
}

interface WindowAPI {
  getVersion(): Promise<string>
  getStartupCwd(): Promise<string | null>
  minimize(): void
  maximize(): void
  close(): void
  isMaximized(): Promise<boolean>
  onMaximizeChange(callback: (maximized: boolean) => void): () => void
  setOpacity(opacity: number): void
}

interface ShellAPI {
  openPath(filePath: string): Promise<void>
  openExternal(url: string): Promise<void>
  openTerminalPath(paneId: string, rawPath: string): Promise<void>
  enableContextMenu(): Promise<void>
  disableContextMenu(): Promise<void>
}

interface ClipboardAPI {
  hasImage(): boolean
  readImageAsPngBase64(): string | null
  saveImageToTempFile(): string | null
  readText(): string
}

interface ConfigAPI {
  read(name: string): Promise<string | null>
  write(name: string, data: string): void
}

declare global {
  interface Window {
    terminalAPI: TerminalAPI
    windowAPI: WindowAPI
    shellAPI: ShellAPI
    clipboardAPI: ClipboardAPI
    configAPI: ConfigAPI
  }
}

export {}
