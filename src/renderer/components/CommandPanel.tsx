import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useCommandStore, type CommandItem } from '../store/commandStore'
import { useTabStore } from '../store/tabStore'
import './CommandPanel.css'

interface CommandPanelProps {
  visible: boolean
  onClose: () => void
}

const GroupSelect: React.FC<{
  value: string
  options: string[]
  onChange: (v: string) => void
}> = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setInputValue(value) }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="group-select" ref={ref}>
      <input
        className="command-panel-input"
        placeholder="分组"
        value={inputValue}
        onChange={e => { setInputValue(e.target.value); onChange(e.target.value) }}
        onFocus={() => setOpen(true)}
      />
      {open && options.length > 0 && (
        <div className="group-select-dropdown">
          {options.map(g => (
            <div
              key={g}
              className={`group-select-option ${g === inputValue ? 'selected' : ''}`}
              onMouseDown={e => {
                e.preventDefault()
                setInputValue(g)
                onChange(g)
                setOpen(false)
              }}
            >
              {g}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const CommandPanel: React.FC<CommandPanelProps> = ({ visible, onClose }) => {
  const commands = useCommandStore((s) => s.commands)
  const addCommand = useCommandStore((s) => s.addCommand)
  const updateCommand = useCommandStore((s) => s.updateCommand)
  const removeCommand = useCommandStore((s) => s.removeCommand)

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formCommand, setFormCommand] = useState('')
  const [formGroup, setFormGroup] = useState('')

  const panelRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const cmd of commands) {
      const list = map.get(cmd.group) || []
      list.push(cmd)
      map.set(cmd.group, list)
    }
    return map
  }, [commands])

  const allGroups = useMemo(() => [...groups.keys()], [groups])

  useEffect(() => {
    if (showForm && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [showForm])

  if (!visible) return null

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const executeCommand = (cmd: CommandItem) => {
    try {
      const tab = useTabStore.getState().getActiveTab()
      if (!tab) return
      window.terminalAPI.writePty(tab.activePaneId, cmd.command)
    } catch (e) {
      console.error('executeCommand error:', e)
    }
    onClose()
  }

  const startAdd = () => {
    setEditingId(null)
    setFormName('')
    setFormCommand('')
    setFormGroup(allGroups[0] || '常用')
    setShowForm(true)
  }

  const startEdit = (cmd: CommandItem) => {
    setEditingId(cmd.id)
    setFormName(cmd.name)
    setFormCommand(cmd.command)
    setFormGroup(cmd.group)
    setShowForm(true)
  }

  const saveForm = () => {
    if (!formName.trim() || !formCommand.trim()) return
    if (editingId) {
      updateCommand(editingId, { name: formName.trim(), command: formCommand.trim(), group: formGroup.trim() || '常用' })
    } else {
      addCommand({ name: formName.trim(), command: formCommand.trim(), group: formGroup.trim() || '常用' })
    }
    setShowForm(false)
  }

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveForm()
    if (e.key === 'Escape') setShowForm(false)
  }

  return (
    <>
      <div className="command-panel-overlay" onClick={onClose} />
      <div className="command-panel" ref={panelRef}>
        <div className="command-panel-header">
          <span>常用命令</span>
          <div className="command-panel-header-actions">
            <button className="command-panel-icon-btn" onClick={startAdd} title="添加命令">+</button>
          </div>
        </div>
        <div className="command-panel-body">
          {commands.length === 0 && !showForm && (
            <div className="command-panel-empty">暂无命令，点击 + 添加</div>
          )}
          {[...groups.entries()].map(([group, cmds]) => (
            <div key={group} className="command-panel-group">
              <div className="command-panel-group-header" onClick={() => toggleGroup(group)}>
                <span className={`command-panel-group-arrow ${collapsedGroups.has(group) ? 'collapsed' : ''}`}>▼</span>
                {group}
              </div>
              {!collapsedGroups.has(group) && cmds.map((cmd) => (
                <div key={cmd.id} className="command-panel-cmd" onClick={() => executeCommand(cmd)}>
                  <span className="command-panel-cmd-name">{cmd.name}</span>
                  <span className="command-panel-cmd-text">{cmd.command}</span>
                  <div className="command-panel-cmd-actions">
                    <button className="command-panel-cmd-btn" onClick={(e) => { e.stopPropagation(); startEdit(cmd) }} title="编辑">✎</button>
                    <button className="command-panel-cmd-btn" onClick={(e) => { e.stopPropagation(); removeCommand(cmd.id) }} title="删除">×</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        {showForm && (
          <div className="command-panel-form" onKeyDown={handleFormKeyDown}>
            <div className="command-panel-form-row">
              <input
                ref={nameInputRef}
                className="command-panel-input"
                placeholder="名称"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <GroupSelect
                value={formGroup}
                options={allGroups}
                onChange={setFormGroup}
              />
            </div>
            <input
              className="command-panel-input"
              placeholder="命令"
              value={formCommand}
              onChange={(e) => setFormCommand(e.target.value)}
            />
            <div className="command-panel-form-actions">
              <button className="command-panel-btn command-panel-btn-cancel" onClick={() => setShowForm(false)}>取消</button>
              <button className="command-panel-btn command-panel-btn-primary" onClick={saveForm}>{editingId ? '保存' : '添加'}</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
