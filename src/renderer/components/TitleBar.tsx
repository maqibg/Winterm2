import React, { useEffect, useState } from 'react'
import { CommandPanel } from './CommandPanel'
import './TitleBar.css'

interface TitleBarProps {
  onSettingsClick: () => void
}

const TitleBar: React.FC<TitleBarProps> = ({ onSettingsClick }) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [commandPanelVisible, setCommandPanelVisible] = useState(false)

  useEffect(() => {
    const cleanup = window.windowAPI.onMaximizeChange((maximized: boolean) => {
      setIsMaximized(maximized)
    })
    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [])

  return (
    <div className="title-bar">
      <div className="title-bar-title">WinTerm2</div>
      <div className="title-bar-controls">
        <button className="title-bar-btn tool-btn" onClick={() => setCommandPanelVisible(v => !v)} title="常用命令">命令</button>
        <button className="title-bar-btn tool-btn" onClick={onSettingsClick} title="设置">设置</button>
        <button className="title-bar-btn" onClick={() => window.windowAPI.minimize()}>
          <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor" /></svg>
        </button>
        <button className="title-bar-btn" onClick={() => window.windowAPI.maximize()}>
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="2.5" width="7" height="7" />
              <polyline points="2.5,2.5 2.5,0.5 9.5,0.5 9.5,7.5 7.5,7.5" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="9" height="9" />
            </svg>
          )}
        </button>
        <button className="title-bar-btn close" onClick={() => window.windowAPI.close()}>
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1">
            <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" />
            <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" />
          </svg>
        </button>
      </div>
      <CommandPanel visible={commandPanelVisible} onClose={() => setCommandPanelVisible(false)} />
    </div>
  )
}

export default TitleBar
