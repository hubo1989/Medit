# Medit - Modern Markdown Desktop Editor

A fast, native Markdown editor built with Tauri v2, featuring real-time preview, multi-tab editing, and rich diagram support.

[English](#english) · [简体中文](#简体中文)

---

<a name="english"></a>
## English

### Features

- **Native Performance** - Built with Tauri v2 for lightning-fast startup and minimal memory usage
- **Multi-tab Editing** - Work with multiple Markdown files simultaneously
- **Real-time Preview** - See your rendered document as you type
- **Rich Diagram Support**:
  - Mermaid (flowcharts, sequence diagrams, Gantt charts, etc.)
  - Vega / Vega-Lite (data visualization charts)
  - Graphviz DOT (directed/undirected graphs)
  - drawio diagrams
  - Canvas diagrams
  - Infographic charts
- **LaTeX Math** - Full support for mathematical formulas with KaTeX
- **Syntax Highlighting** - 100+ programming languages supported
- **Multiple Themes** - Choose from various visual themes
- **Bilingual Interface** - English and Chinese (Simplified)
- **Local Processing** - All files processed locally, no cloud upload required
- **Cross-platform** - macOS, Windows, Linux support

### Screenshots

<!-- Add screenshots here -->

### Installation

#### Pre-built Binaries

Download from [Releases](https://github.com/hubo1989/Medit/releases) page.

#### Build from Source

```bash
# Clone the repository
git clone https://github.com/hubo1989/Medit.git
cd Medit/tauri

# Install dependencies
pnpm install

# Development mode
pnpm tauri:dev

# Build for production
pnpm tauri:build
```

### Requirements

- Node.js 18+
- pnpm 8+
- Rust 1.77+
- Platform-specific build tools (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

### Project Structure

```
tauri/
├── src/                    # Frontend TypeScript code
│   ├── editor/            # Vditor editor integration
│   ├── i18n/              # Internationalization
│   ├── services/          # Core services (tabs, preferences, themes)
│   ├── ui/                # UI components (toolbars, menus, dialogs)
│   └── main.ts            # Application entry point
├── src-tauri/             # Rust backend code
│   ├── src/
│   │   ├── commands.rs    # Tauri commands
│   │   ├── lib.rs         # Application setup
│   │   └── menu.rs        # Native menu configuration
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
└── package.json           # npm dependencies
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | TypeScript, Vite |
| Backend | Rust, Tauri v2 |
| Editor | Vditor |
| Diagrams | Mermaid, Vega, Graphviz |
| Math | KaTeX |
| Build | pnpm, Cargo |

### Keyboard Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| New File | `Cmd + N` | `Ctrl + N` |
| Open File | `Cmd + O` | `Ctrl + O` |
| Save | `Cmd + S` | `Ctrl + S` |
| Save As | `Cmd + Shift + S` | `Ctrl + Shift + S` |
| Find | `Cmd + F` | `Ctrl + F` |
| Toggle TOC | `Cmd + B` | `Ctrl + B` |
| Zoom In | `Cmd + =` | `Ctrl + =` |
| Zoom Out | `Cmd + -` | `Ctrl + -` |
| Reset Zoom | `Cmd + 0` | `Ctrl + 0` |

### Development

```bash
# Type checking
pnpm typecheck

# Lint
pnpm lint

# Development server
pnpm tauri:dev
```

### License

MIT License

---

<a name="简体中文"></a>
## 简体中文

### 功能特性

- **原生性能** - 基于 Tauri v2 构建，启动迅速，内存占用低
- **多标签编辑** - 同时编辑多个 Markdown 文件
- **实时预览** - 所见即所得的编辑体验
- **丰富的图表支持**:
  - Mermaid（流程图、时序图、甘特图等）
  - Vega / Vega-Lite（数据可视化图表）
  - Graphviz DOT（有向/无向图）
  - drawio 架构图
  - Canvas 画布
  - Infographic 信息图
- **LaTeX 数学公式** - 基于 KaTeX 的完整数学公式支持
- **语法高亮** - 支持 100+ 编程语言
- **多主题** - 多种视觉主题可选
- **双语界面** - 支持中英文切换
- **本地处理** - 所有文件本地处理，无需上传云端
- **跨平台** - 支持 macOS、Windows、Linux

### 安装

#### 预编译版本

从 [Releases](https://github.com/hubo1989/Medit/releases) 页面下载。

#### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/hubo1989/Medit.git
cd Medit/tauri

# 安装依赖
pnpm install

# 开发模式
pnpm tauri:dev

# 生产构建
pnpm tauri:build
```

### 系统要求

- Node.js 18+
- pnpm 8+
- Rust 1.77+
- 平台相关构建工具（参见 [Tauri 环境要求](https://v2.tauri.app/start/prerequisites/)）

### 快捷键

| 操作 | macOS | Windows/Linux |
|------|-------|---------------|
| 新建文件 | `Cmd + N` | `Ctrl + N` |
| 打开文件 | `Cmd + O` | `Ctrl + O` |
| 保存 | `Cmd + S` | `Ctrl + S` |
| 另存为 | `Cmd + Shift + S` | `Ctrl + Shift + S` |
| 查找 | `Cmd + F` | `Ctrl + F` |
| 切换目录 | `Cmd + B` | `Ctrl + B` |
| 放大 | `Cmd + =` | `Ctrl + =` |
| 缩小 | `Cmd + -` | `Ctrl + -` |
| 重置缩放 | `Cmd + 0` | `Ctrl + 0` |

### 许可证

MIT License

---

## Special Thanks

- [Tauri Team](https://tauri.app/) - Tauri framework
- [Vditor Team](https://b3log.org/vditor/) - Excellent Markdown editor core
- [markdown-viewer](https://github.com/markdown-viewer/markdown-viewer-extension) - Markdown rendering engine
- [Mermaid Team](https://mermaid.js.org/) - Diagram rendering
- [KaTeX Team](https://katex.org/) - Math rendering

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- **Repository**: https://github.com/hubo1989/Medit
- **Issues**: https://github.com/hubo1989/Medit/issues
