# 分屏模式改进设计 - 同步滚动

## 概述

改进 Tauri 应用的分屏模式,实现:
- 左侧: Markdown 源码编辑器 (Vditor sv 模式)
- 右侧: 渲染预览 (只读)
- 双向同步滚动 (按比例)

## 需求

### 核心需求
1. 分屏模式左侧显示纯源码 (Vditor sv 模式)
2. 分屏模式隐藏 Vditor 原生工具栏,保留 Medit 工具栏
3. 编辑模式和预览模式保持现有行为
4. 实现双向同步滚动 (按滚动比例同步)

### 约束
- 不修改主项目代码 (`src/` 目录)
- 仅修改 Tauri 相关代码 (`tauri/` 目录)

## 设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Medit 工具栏 (独立容器)                   │
│  [编辑] [分屏] [预览] | [查找] | [导出...] | [设备...]        │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│   Vditor sv 编辑区        │         渲染预览                 │
│   (无 Vditor 工具栏)      │         (只读)                   │
│                          │                                  │
│   ←── 双向同步滚动 ──→    │                                  │
│                          │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

### HTML 结构变更

**修改前:**
```html
<div id="editor-container" class="editor-pane">
  <div id="vditor-editor"></div>
</div>
```

**修改后:**
```html
<div id="editor-container" class="editor-pane">
  <!-- Medit 工具栏独立容器 -->
  <div id="edit-toolbar-container"></div>
  <!-- Vditor 编辑区 -->
  <div id="vditor-editor"></div>
</div>
```

### 核心组件

#### 1. VditorEditor 修改

新增方法:

```typescript
// vditor-editor.ts

/**
 * 切换编辑器模式
 */
setMode(mode: 'sv' | 'ir' | 'wysiwyg'): void;

/**
 * 显示 Vditor 原生工具栏
 */
showToolbar(): void;

/**
 * 隐藏 Vditor 原生工具栏
 */
hideToolbar(): void;
```

#### 2. 新增 SyncScrollService

**职责:** 管理编辑器和预览区的双向同步滚动

```typescript
// services/sync-scroll-service.ts

interface SyncScrollServiceConfig {
  getEditorScrollContainer: () => HTMLElement | null;
  getPreviewScrollContainer: () => HTMLElement | null;
  enabled?: boolean;
}

class SyncScrollService {
  private _enabled: boolean;
  private _isSyncing: boolean; // 防止循环触发
  
  enable(): void;
  disable(): void;
  destroy(): void;
  
  // 内部方法
  private _syncEditorToPreview(): void;
  private _syncPreviewToEditor(): void;
  private _calculateSyncScroll(
    source: HTMLElement,
    target: HTMLElement
  ): number;
}
```

**同步逻辑 (按比例):**
```typescript
private _calculateSyncScroll(source: HTMLElement, target: HTMLElement): number {
  const sourceMaxScroll = source.scrollHeight - source.clientHeight;
  const targetMaxScroll = target.scrollHeight - target.clientHeight;
  
  if (sourceMaxScroll <= 0 || targetMaxScroll <= 0) {
    return 0;
  }
  
  const scrollRatio = source.scrollTop / sourceMaxScroll;
  return scrollRatio * targetMaxScroll;
}
```

#### 3. MeditApp._applyMode() 修改

**分屏模式 (split):**
```typescript
case 'split':
  // 1. 切换 Vditor 到 sv 模式
  this._editor?.setMode('sv');
  
  // 2. 隐藏 Vditor 原生工具栏
  this._editor?.hideToolbar();
  
  // 3. 显示编辑器和预览
  editorContainer.style.display = 'flex';
  previewContainer.style.display = 'flex';
  
  // 4. 启用同步滚动
  this._syncScrollService?.enable();
  
  // 5. 渲染预览
  await this._renderPreview(this._currentContent);
  break;
```

**编辑模式 (edit):**
```typescript
case 'edit':
  // 1. 切换 Vditor 到 ir 模式
  this._editor?.setMode('ir');
  
  // 2. 显示 Vditor 原生工具栏
  this._editor?.showToolbar();
  
  // 3. 禁用同步滚动
  this._syncScrollService?.disable();
  
  // 4. 隐藏预览,显示编辑器
  previewContainer.style.display = 'none';
  editorContainer.style.display = 'flex';
  break;
```

### EditToolbar 初始化位置变更

**修改前:** EditToolbar 插入到 Vditor 的 `.vditor-toolbar` 内部

**修改后:** EditToolbar 挂载到独立的 `#edit-toolbar-container`

```typescript
// main.ts - _initEditToolbar()

private _initEditToolbar(): void {
  // 查找独立容器
  const editToolbarContainer = document.getElementById('edit-toolbar-container');
  if (!editToolbarContainer) {
    logger.warn('Edit toolbar container not found');
    return;
  }

  this._editToolbar = new EditToolbar({
    container: editToolbarContainer,
    modeService: this._modeService,
    i18n: this._i18n,
    // ... 其他配置
  });
}
```

### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `tauri/index.html` | 修改 | 新增 `#edit-toolbar-container` |
| `tauri/src/editor/vditor-editor.ts` | 修改 | 新增 setMode, showToolbar, hideToolbar |
| `tauri/src/services/sync-scroll-service.ts` | 新增 | 同步滚动服务 |
| `tauri/src/services/index.ts` | 修改 | 导出 SyncScrollService |
| `tauri/src/main.ts` | 修改 | 集成同步滚动,修改 _applyMode, 修改 _initEditToolbar |
| `tauri/src/types/sync-scroll.d.ts` | 新增 | 类型定义 |
| `tauri/src/styles/main.css` | 修改 | 新增 `#edit-toolbar-container` 样式 |

### 交互细节

| 操作 | 行为 |
|------|------|
| 进入分屏模式 | 切换到 sv 模式,隐藏 Vditor 工具栏,启用同步滚动 |
| 退出分屏模式到编辑 | 切换到 ir 模式,显示 Vditor 工具栏,禁用同步滚动 |
| 退出分屏模式到预览 | 禁用同步滚动,隐藏编辑器 |
| 编辑器滚动 | 预览区同步滚动 (按比例) |
| 预览区滚动 | 编辑器同步滚动 (按比例) |
| 编辑内容 | 实时更新预览 (已有逻辑,无需修改) |

### 边界情况处理

1. **快速模式切换:** 同步滚动服务使用 `enable()`/`disable()` 方法,状态切换是原子操作
2. **内容为空时滚动:** `scrollHeight === clientHeight` 时跳过同步
3. **图片/图表加载后:** 预览区高度变化,滚动比例自动适应 (基于实时计算)
4. **循环触发防止:** 使用 `_isSyncing` 标志防止双向同步时循环触发

### CSS 样式补充

```css
/* main.css */

/* Medit 工具栏独立容器 */
#edit-toolbar-container {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--toolbar-bg);
}

/* 分屏模式下的编辑器容器 */
#app[data-mode="split"] #editor-container {
  display: flex;
  flex-direction: column;
}

/* 分屏模式下隐藏 Vditor 工具栏 */
#app[data-mode="split"] .vditor-toolbar {
  display: none;
}

/* 编辑模式下显示 Vditor 工具栏 */
#app[data-mode="edit"] .vditor-toolbar {
  display: flex;
}
```

## 测试计划

1. **单元测试:** SyncScrollService 的滚动计算逻辑
2. **集成测试:** 模式切换时的状态正确性
3. **手动测试:**
   - 分屏模式下双向滚动同步
   - 快速切换模式不崩溃
   - 大文档滚动流畅
   - 图片加载后滚动位置正确

## 风险评估

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| Vditor setMode 不稳定 | 中 | 测试各模式切换场景,必要时重新初始化 |
| 同步滚动性能 | 低 | 使用 requestAnimationFrame 节流 |
| 样式冲突 | 低 | 使用 CSS 变量和 data-mode 属性隔离 |

## 实现优先级

1. HTML 结构调整 (新增 `#edit-toolbar-container`)
2. VditorEditor 新增方法
3. SyncScrollService 实现
4. MeditApp 集成
5. CSS 样式调整
6. 测试验证
