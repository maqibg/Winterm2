import type { Terminal } from '@xterm/xterm'
import type { Keybinding } from './types'
import { defaultKeybindings } from './defaults'

type ActionHandler = () => void

class KeybindingManager {
  private keybindings: Keybinding[]
  private handlers: Map<string, ActionHandler> = new Map()

  constructor(keybindings?: Keybinding[]) {
    this.keybindings = keybindings ?? [...defaultKeybindings]
  }

  register(action: string, handler: ActionHandler): void {
    this.handlers.set(action, handler)
  }

  unregister(action: string): void {
    this.handlers.delete(action)
  }

  private serializeEvent(e: KeyboardEvent): string {
    const parts: string[] = []

    if (e.ctrlKey) parts.push('ctrl')
    if (e.shiftKey) parts.push('shift')
    if (e.altKey) parts.push('alt')

    const key = e.key
    let normalizedKey: string

    switch (key) {
      case 'Tab':
        normalizedKey = 'tab'
        break
      case '=':
      case '+':
        normalizedKey = '='
        break
      case '-':
      case '_':
        normalizedKey = '-'
        break
      case ',':
      case '<':
        normalizedKey = ','
        break
      default:
        normalizedKey = key.toLowerCase()
    }

    parts.push(normalizedKey)
    return parts.join('+')
  }

  // Check if event matches a keybinding without executing
  matchesKeybinding(e: KeyboardEvent): boolean {
    const serialized = this.serializeEvent(e)
    const binding = this.keybindings.find((kb) => kb.keys === serialized)
    return !!(binding && this.handlers.has(binding.action))
  }

  handleKeyEvent(e: KeyboardEvent): boolean {
    const serialized = this.serializeEvent(e)
    const binding = this.keybindings.find((kb) => kb.keys === serialized)

    if (binding) {
      const handler = this.handlers.get(binding.action)
      if (handler) {
        e.preventDefault()
        e.stopPropagation()
        handler()
        return true
      }
    }

    return false
  }

  getKeybindings(): Keybinding[] {
    return [...this.keybindings]
  }

  updateKeybinding(id: string, newKeys: string): void {
    const binding = this.keybindings.find((kb) => kb.id === id)
    if (binding) {
      binding.keys = newKeys
    }
  }

  createXtermKeyHandler(): (e: KeyboardEvent) => boolean {
    return (e: KeyboardEvent): boolean => {
      // Only check on keydown, ignore keyup
      if (e.type !== 'keydown') return true
      // Return false to prevent xterm from handling app-level keybindings
      // Do NOT execute the handler here — the global keydown listener handles that
      return !this.matchesKeybinding(e)
    }
  }

  /** Ctrl+C/V 智能处理：有选中→复制，无选中→SIGINT；V→图片检测或粘贴 */
  createSmartKeyHandler(term: Terminal): (e: KeyboardEvent) => boolean {
    return (e: KeyboardEvent): boolean => {
      if (e.type !== 'keydown') return true

      // Ctrl+C: smart copy/SIGINT
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 'c') {
        if (term.hasSelection()) {
          navigator.clipboard.writeText(term.getSelection())
          return false
        }
        return true
      }

      // Ctrl+V: smart paste with image detection
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 'v') {
        if (window.clipboardAPI.hasImage()) {
          term.write('\x1bv')
        } else {
          const text = window.clipboardAPI.readText()
          if (text) term.paste(text)
        }
        return false
      }

      return !this.matchesKeybinding(e)
    }
  }
}

export const keybindingManager = new KeybindingManager()
export { KeybindingManager }
