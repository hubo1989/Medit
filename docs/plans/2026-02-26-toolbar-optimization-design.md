# 工具栏优化设计文档

## 概述

优化 Medit 的默认工具栏，实现与 Vditor 编辑模式工具栏的无缝衔接，通过智能切换提供更好的用户体验。

## 目标

- 单行工具栏，紧凑高效
- 编辑/分屏模式：扩展 Vditor 工具栏，将应用操作放在右侧
- 预览模式：独立精简工具栏，隐藏编辑工具
- 分屏模式使用 Vditor 内置的 `both` 模式

## 模式与工具栏映射

### 三种模式

| 模式 | Vditor 模式 | 工具栏显示 |
|------|------------|-----------|
| **编辑** | `ir` (即时渲染) | Vditor 工具栏 + 扩展按钮 |
| **分屏** | `both` (双栏) | Vditor 工具栏 + 扩展按钮 |
| **预览** | `preview-only` | 独立精简工具栏 |

### 工具栏内容

**编辑/分屏模式**（扩展 Vditor 工具栏）：

```text
[格式化工具] | [撤销重做] | [模式切换] | [应用操作]
```

- 格式化：标题、粗体、斜体、删除线、列表、代码、链接、表格等（Vditor 原生）
- 模式切换：编辑、分屏、预览（自定义按钮）
- 应用操作：查找、导出（自定义按钮）

**预览模式**（独立工具栏）：

```text
[编辑] [分屏] | [查找] [导出]
```

- 4 个按钮，高度保持 48px 一致
- 设置已移至菜单栏

## 技术实现方案

### Vditor 工具栏扩展

Vditor 支持自定义工具栏项，通过扩展 toolbar 配置实现：

```typescript
// 在 vditor-editor.ts 中配置
toolbar: [
  'headings', 'bold', 'italic', 'strike', '|',
  'list', 'ordered-list', 'check', '|',
  'code', 'inline-code', 'link', 'table', '|',
  'undo', 'redo', '|',
  // 自定义按钮
  {
    name: 'mode-edit',
    tip: '编辑模式',
    icon: '<svg>...</svg>',
    click: () => switchMode('edit')
  },
  {
    name: 'mode-split',
    tip: '分屏模式',
    icon: '<svg>...</svg>',
    click: () => switchMode('split')
  },
  {
    name: 'mode-preview',
    tip: '预览模式',
    icon: '<svg>...</svg>',
    click: () => switchMode('preview')
  },
  '|',
  {
    name: 'find',
    tip: '查找替换',
    icon: '<svg>...</svg>',
    click: () => toggleFindPanel()
  },
  {
    name: 'export',
    tip: '导出',
    icon: '<svg>...</svg>',
    click: () => showExportMenu()
  }
]
```

### 模式切换逻辑

```typescript
// 模式切换时动态修改 Vditor 配置
function switchMode(mode: 'edit' | 'split' | 'preview') {
  if (mode === 'preview') {
    // 销毁 Vditor 实例，显示独立预览工具栏
    vditor?.destroy();
    showPreviewToolbar();
    renderPreviewOnly();
  } else {
    // 创建/更新 Vditor 实例
    const vditorMode = mode === 'edit' ? 'ir' : 'both';
    hidePreviewToolbar();
    createOrSwitchVditor(vditorMode);
  }
}
```

### 预览模式工具栏组件

新建轻量级工具栏组件，仅在预览模式显示：
- 包含：编辑、分屏、查找、导出 4 个按钮
- 复用现有图标模块
- 独立于 Vditor 之外

## 文件改动清单

### 需要修改的文件

| 文件 | 改动内容 |
|------|---------|
| `tauri/src/editor/vditor-editor.ts` | 扩展 toolbar 配置，添加自定义按钮 |
| `tauri/src/editor/editor-mode-service.ts` | 重构模式切换逻辑，支持 Vditor both 模式 |
| `tauri/src/main.ts` | 调整模式切换调用方式 |
| `tauri/src/ui/toolbar.ts` | 简化为预览模式专用工具栏 |
| `tauri/src/styles/main.css` | 预览工具栏样式 |

### 需要新建的文件

| 文件 | 用途 |
|------|------|
| `tauri/src/ui/preview-toolbar.ts` | 预览模式专用精简工具栏 |
| `tauri/src/ui/icons.ts` | SVG 图标定义（模式切换、查找、导出） |

### 需要删除的代码

- 现有 `toolbar.ts` 中的模式切换按钮（移入 Vditor 工具栏）
- 独立的预览容器逻辑（改用 Vditor preview-only 渲染）

## 任务分解

1. **提取图标** - 将模式切换、查找、导出图标提取为独立模块
2. **扩展 Vditor 工具栏** - 修改 `vditor-editor.ts`，添加自定义按钮
3. **重构模式切换** - 修改 `editor-mode-service.ts`，支持 ir/both/preview 三种模式
4. **创建预览工具栏** - 新建 `preview-toolbar.ts`
5. **调整样式** - 确保视觉一致性
6. **测试验证** - 三种模式切换、工具栏功能

## 决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 整合方式 | 智能切换 | 根据模式动态调整工具栏内容 |
| 分屏实现 | Vditor both 模式 | 无缝集成，减少维护成本 |
| 工具栏布局 | 扩展 Vditor 工具栏 | 复用原生功能，代码改动小 |
| 预览工具栏 | 独立精简组件 | 轻量级，仅 4 个按钮 |
| 设置入口 | 移至菜单栏 | 预览模式不需要频繁访问 |
