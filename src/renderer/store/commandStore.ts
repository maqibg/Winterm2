import { create } from 'zustand'
import { nanoid } from 'nanoid'

export interface CommandItem {
  id: string
  name: string
  command: string
  group: string
}

interface CommandState {
  commands: CommandItem[]
  addCommand: (cmd: Omit<CommandItem, 'id'>) => void
  updateCommand: (id: string, updates: Partial<Omit<CommandItem, 'id'>>) => void
  removeCommand: (id: string) => void
  loadCommands: () => Promise<void>
  saveCommands: () => void
}

const CONFIG_NAME = 'commands'

const defaultCommands: CommandItem[] = [
  { id: nanoid(), name: '查看IP', command: 'ipconfig', group: '系统' },
  { id: nanoid(), name: '查看端口', command: 'netstat -ano', group: '系统' },
  { id: nanoid(), name: 'Git状态', command: 'git status', group: 'Git' },
  { id: nanoid(), name: 'Git日志', command: 'git log --oneline -20', group: 'Git' },
  { id: nanoid(), name: 'Git差异', command: 'git diff', group: 'Git' },
]

export const useCommandStore = create<CommandState>((set, get) => ({
  commands: [...defaultCommands],

  addCommand: (cmd) => {
    const newCmd: CommandItem = { ...cmd, id: nanoid() }
    set((state) => ({ commands: [...state.commands, newCmd] }))
    get().saveCommands()
  },

  updateCommand: (id, updates) => {
    set((state) => ({
      commands: state.commands.map((c) => c.id === id ? { ...c, ...updates } : c)
    }))
    get().saveCommands()
  },

  removeCommand: (id) => {
    set((state) => ({ commands: state.commands.filter((c) => c.id !== id) }))
    get().saveCommands()
  },

  loadCommands: async () => {
    try {
      const raw = await window.configAPI.read(CONFIG_NAME)
      if (raw) {
        const saved = JSON.parse(raw) as CommandItem[]
        if (saved.length > 0) {
          // Merge missing default groups
          const savedGroups = new Set(saved.map(c => c.group))
          const missing = defaultCommands.filter(c => !savedGroups.has(c.group))
          set({ commands: missing.length > 0 ? [...saved, ...missing] : saved })
          return
        }
      }
    } catch {
      // ignore
    }
    set({ commands: [...defaultCommands] })
  },

  saveCommands: () => {
    try {
      window.configAPI.write(CONFIG_NAME, JSON.stringify(get().commands, null, 2))
    } catch {
      // ignore
    }
  }
}))
