# Medit - Markdown Editor

[English](#english) · [简体中文](#简体中文)

---

<a name="english"></a>

## English

**A modern Markdown editor with live preview, built with Tauri**

Medit is a desktop Markdown editor forked from [markdown-viewer-extension](https://github.com/markdown-viewer/markdown-viewer-extension), focused on providing a native desktop editing experience.

### Features

- **Live Preview**: Real-time Markdown rendering with sync scroll
- **Multiple Diagrams**: Mermaid, Vega/Vega-Lite, drawio, Canvas, Graphviz support
- **LaTeX Math**: Full LaTeX formula support with live preview
- **DOCX Export**: One-click export to Word with editable formulas
- **29 Themes**: Professional themes for different scenarios
- **Offline**: All processing done locally, no internet required

### Project Structure

This is a monorepo containing:

| Package | Description |
|---------|-------------|
| [`packages/markdown-viewer`](packages/markdown-viewer/) | Core rendering engine (`@markdown-viewer/core`) - upstream code |
| [`packages/tauri`](packages/tauri/) | Tauri desktop application (`@medit/tauri`) |

### Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm tauri:dev

# Build for production
pnpm tauri:build
```

### Requirements

- Node.js 18+
- pnpm 8+
- Rust (for Tauri)

### Credits

- Core rendering engine: [markdown-viewer-extension](https://github.com/markdown-viewer/markdown-viewer-extension)
- Editor: [Vditor](https://github.com/Vanessa219/Vditor)
- Desktop framework: [Tauri](https://tauri.app/)

### License

MIT License

---

<a name="简体中文"></a>

## 简体中文

**现代化 Markdown 编辑器，基于 Tauri 构建**

Medit 是从 [markdown-viewer-extension](https://github.com/markdown-viewer/markdown-viewer-extension) 分叉的桌面 Markdown 编辑器，专注于提供原生桌面编辑体验。

### 功能特性

- **实时预览**：Markdown 实时渲染，同步滚动
- **多种图表**：支持 Mermaid、Vega/Vega-Lite、drawio、Canvas、Graphviz
- **LaTeX 公式**：完整 LaTeX 公式支持，实时预览
- **DOCX 导出**：一键导出 Word，公式可编辑
- **29 种主题**：专业主题适应不同场景
- **离线使用**：所有处理本地完成，无需网络

### 项目结构

这是一个 monorepo，包含：

| 包 | 描述 |
|---------|-------------|
| [`packages/markdown-viewer`](packages/markdown-viewer/) | 核心渲染引擎 (`@markdown-viewer/core`) - 上游代码 |
| [`packages/tauri`](packages/tauri/) | Tauri 桌面应用 (`@medit/tauri`) |

### 快速开始

```bash
# 安装依赖
pnpm install

# 运行开发服务器
pnpm tauri:dev

# 生产构建
pnpm tauri:build
```

### 系统要求

- Node.js 18+
- pnpm 8+
- Rust (Tauri 需要)

### 致谢

- 核心渲染引擎：[markdown-viewer-extension](https://github.com/markdown-viewer/markdown-viewer-extension)
- 编辑器：[Vditor](https://github.com/Vanessa219/Vditor)
- 桌面框架：[Tauri](https://tauri.app/)

### 许可证

MIT License
