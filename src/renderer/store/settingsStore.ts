import { create } from 'zustand'

interface Settings {
  fontFamily: string
  fontSize: number
  lineHeight: number
  cursorStyle: 'block' | 'underline' | 'bar'
  cursorBlink: boolean
  opacity: number
  defaultShell: string
  scrollback: number
  startupCwd: string
  themeName: string
  dividerColor: string
  dividerWidth: number
  rightClickPaste: boolean
  copyOnSelect: boolean
}

interface SettingsState extends Settings {
  updateSettings: (partial: Partial<Settings>) => void
  loadSettings: () => Promise<void>
  saveSettings: () => void
}

const defaultSettings: Settings = {
  fontFamily: 'Cascadia Code, Consolas, monospace',
  fontSize: 14,
  lineHeight: 1.2,
  cursorStyle: 'bar',
  cursorBlink: true,
  opacity: 1.0,
  defaultShell: '',
  scrollback: 5000,
  startupCwd: '',
  themeName: 'monokai',
  dividerColor: '#ff8c00',
  dividerWidth: 4,
  rightClickPaste: false,
  copyOnSelect: false
}

const CONFIG_NAME = 'settings'

function extractSettings(state: SettingsState): Settings {
  return {
    fontFamily: state.fontFamily,
    fontSize: state.fontSize,
    lineHeight: state.lineHeight,
    cursorStyle: state.cursorStyle,
    cursorBlink: state.cursorBlink,
    opacity: state.opacity,
    defaultShell: state.defaultShell,
    scrollback: state.scrollback,
    startupCwd: state.startupCwd,
    themeName: state.themeName,
    dividerColor: state.dividerColor,
    dividerWidth: state.dividerWidth,
    rightClickPaste: state.rightClickPaste,
    copyOnSelect: state.copyOnSelect
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,

  updateSettings: (partial: Partial<Settings>) => {
    set(partial)
    get().saveSettings()
  },

  loadSettings: async () => {
    try {
      const raw = await window.configAPI.read(CONFIG_NAME)
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Settings>
        set({ ...defaultSettings, ...saved })
      }
    } catch {
      // ignore, keep defaults
    }
  },

  saveSettings: () => {
    try {
      window.configAPI.write(CONFIG_NAME, JSON.stringify(extractSettings(get()), null, 2))
    } catch {
      // ignore
    }
  }
}))
