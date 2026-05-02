# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WinTerm2 是一个 Windows 上的高级终端模拟器，灵感来自 macOS iTerm2。基于 Electron + React + xterm.js 构建，使用 node-pty 管理 PTY 进程，支持多标签页、嵌套分屏、浮动面板、WebGL 渲染等特性。

## Development Commands

```bash
pnpm install          # 安装依赖
pnpm dev              # 启动开发模式（electron-vite dev）
pnpm build            # 构建（electron-vite build）
pnpm dist             # 构建 + 打包安装程序（electron-vite build && electron-builder）
```

项目使用 pnpm 作为包管理器，electron-vite 作为构建工具。

## Architecture

### 三进程结构（Electron）

```
src/
  main/          # 主进程 (Node.js)
    index.ts       — 窗口创建、IPC 注册、窗口控制
    ptyManager.ts  — PTY 生命周期管理、Shell 检测、路径解析、OSC 7 跟踪
  preload/       # 预加载桥接
    index.ts       — contextBridge 暴露 terminalAPI / windowAPI / shellAPI
    index.d.ts     — 上述 API 的 TypeScript 类型声明
  renderer/      # 渲染进程 (React)
    ...
```

### 渲染进程核心架构

**状态管理（Zustand）**：
- `store/tabStore.ts` — 标签页/分屏树/浮动面板的全部状态和操作。分屏使用二叉树数据结构（`PaneNode = TerminalPane | SplitPane`），序列化/反序列化用于会话保存恢复
- `store/settingsStore.ts` — 用户设置（字体、字号、光标、Shell 等），通过 localStorage 持久化
- `store/themeStore.ts` — 主题切换，将 UI 颜色映射到 CSS 变量

**终端管理**：
- `hooks/useTerminal.ts` — 核心 hook。维护全局 `terminalInstances` Map（跨 React 重渲染持久化），负责 xterm.js 实例创建、PTY 绑定、ResizeObserver、链接提供器（URL/文件路径识别）、同步输入广播
- 终端实例生命周期与组件解耦：实例在 pane 首次挂载时创建，在 pane 从 tabStore 移除时销毁

**键绑定系统**：
- `keybindings/manager.ts` — `KeybindingManager` 类，序列化键盘事件并匹配绑定，通过 `createXtermKeyHandler()` 阻止 xterm.js 处理应用级快捷键
- `keybindings/defaults.ts` — 默认快捷键定义
- 键绑定在 `App.tsx` 中统一注册，handler 内使用 `getState()` 获取最新状态

**IPC 通信**：
- 主进程 ↔ 渲染进程通过 `contextBridge` 暴露三个 API 对象：`terminalAPI`（PTY 操作）、`windowAPI`（窗口控制）、`shellAPI`（系统 shell 操作）
- PTY 数据通过 `pty:data:{id}` 频道传输，每个 PTY 实例使用独立频道

**分屏渲染**：
- `SplitView.tsx` — 递归组件，根据 `PaneNode` 树渲染终端或分屏容器，支持拖拽分割线调整比例
- `FloatingPanel.tsx` — 浮动面板，绝对定位覆盖在终端区域上方，支持拖拽移动和调整大小

### 关键数据流

```
用户输入 → xterm.js → term.onData → terminalAPI.writePty → IPC → node-pty.write
node-pty.onData → IPC → terminalAPI.onPtyData → term.write → xterm.js 渲染
```

路径点击：终端输出 → linkProvider 正则匹配 → shellAPI.openTerminalPath → 主进程根据 shell 类型解析路径 → shell.openPath

### Shell 类型检测

`ptyManager.ts` 中检测三种 shell 类型（`ShellType = 'wsl' | 'gitbash' | 'windows'`），影响：
- PTY 启动参数（WSL 使用 `--cd` 传递 Unix 路径）
- 路径解析策略（Windows 绝对路径 vs WSL Unix 路径 vs Git Bash `/c/...` 路径）
- 链接提供器中的正则匹配范围（Unix 绝对路径仅在 WSL/Git Bash 中识别）

### 主题系统

`themes/builtinThemes.ts` 定义 6 套主题，每套包含 `terminal`（xterm 配色）和 `ui`（UI 配色）两部分。`themeStore` 将 UI 颜色映射到 CSS 变量注入 `document.documentElement`，终端配色通过 xterm.js `options.theme` 应用。

## Key Technical Details

- **WebGL 降级**：`useTerminal.ts` 中先尝试加载 `WebglAddon`，失败则自动降级到 Canvas 渲染
- **会话保存**：每 5 秒异步保存到 localStorage（含 cwd 和活动面板），`beforeunload` 时使用缓存的 JSON 同步写入避免竞态
- **OSC 7 跟踪**：主进程和渲染端双重解析终端输出中的 OSC 7 序列，实时跟踪工作目录变化
- **node-pty 外部化**：`electron.vite.config.ts` 中将 `node-pty` 标记为外部依赖，不打包进 bundle
- **CSP 策略**：`index.html` 中配置 Content-Security-Policy，`script-src 'self' 'unsafe-eval'`（xterm.js 需要）
- **ID 生成**：使用 `nanoid` 生成所有面板、标签、分屏节点的唯一 ID

## Component Map

| 组件 | 职责 |
|------|------|
| `TitleBar` | 自定义标题栏（无边框窗口），最小化/最大化/关闭按钮 |
| `TabBar` | 标签页管理，双击重命名，`+` 新建标签 |
| `SplitView` | 递归分屏渲染，拖拽分割线 |
| `TerminalPane` | 单个终端面板，xterm.js 容器，右键菜单 |
| `FloatingPanel` | 浮动终端窗口，拖拽移动/调整大小 |
| `SearchBar` | 搜索栏（正则/大小写/全词），匹配计数 |
| `SettingsPanel` | 设置面板，主题/字体/Shell 等配置 |
| `StatusBar` | 底部状态栏，面板信息和快捷键提示 |
| `CommandPalette` | 命令面板（Ctrl+Shift+P），模糊搜索执行命令 |
| `ContextMenu` | 右键上下文菜单 |
