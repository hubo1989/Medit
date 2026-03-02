# 标签栏功能设计文档

> 创建日期：2026-02-28
> 状态：已批准

## 概述

为 Medit Markdown 编辑器添加多标签页支持，允许用户同时编辑多个文档。

## 功能需求

1. **标签栏 UI**：显示当前打开的所有标签页
2. **多标签切换**：点击标签切换到对应文档
3. **关闭保存提示**：有未保存更改时弹出保存对话框
4. **关闭最后标签**：提示退出应用，选择否则创建新标签
5. **新建标签按钮**：快速创建新标签页
6. **偏好设置**：恢复标签页开关、最大标签数、新标签默认行为

## 技术方案

### 方案选择：轻量级 Tab State 管理

保持单一 `VditorEditor` 实例，通过 Tab 状态管理器切换内容。

**优点**：
- 实现简单，改动范围小
- 内存占用低（只有一个编辑器实例）
- 与现有代码兼容性好

## 数据模型

```typescript
// types/tab.ts

/** 单个标签页的状态 */
interface TabState {
  id: string;                    // 唯一标识符
  title: string;                 // 显示标题（文件名或"未命名"）
  filePath: string | null;       // 关联的文件路径（null 表示未保存的新文档）
  content: string;               // 当前内容
  lastSavedContent: string;      // 最后保存的内容（用于检测未保存更改）
  scrollPosition: number;        // 预览滚动位置
  editorScrollPosition: number;  // 编辑器滚动位置
  isDirty: boolean;              // 是否有未保存更改
  createdAt: number;             // 创建时间戳
  modifiedAt: number;            // 最后修改时间戳
}

/** 标签管理器配置 */
interface TabManagerConfig {
  maxTabs: number;               // 最大标签数
  restoreOnStartup: boolean;     // 启动时恢复标签
  defaultNewTabBehavior: 'blank' | 'welcome';  // 新标签默认内容
}

/** 状态持久化结构（localStorage） */
interface PersistedTabState {
  id: string;
  title: string;
  filePath: string | null;
  scrollPosition: number;
  createdAt: number;
}
```

## 核心服务架构

```typescript
// services/tab-manager.ts

class TabManager {
  private _tabs: Map<string, TabState>;
  private _activeTabId: string | null;
  private _config: TabManagerConfig;
  private _listeners: Set<TabChangeListener>;
  
  // 核心方法
  createTab(options?: { filePath?: string; content?: string }): TabState;
  closeTab(tabId: string): Promise<CloseResult>;
  switchTab(tabId: string): void;
  
  // 状态查询
  getActiveTab(): TabState | null;
  getTab(tabId: string): TabState | null;
  getAllTabs(): TabState[];
  hasUnsavedChanges(): boolean;
  
  // 内容操作
  updateTabContent(tabId: string, content: string): void;
  markTabSaved(tabId: string, filePath: string): void;
  
  // 持久化
  saveState(): void;
  restoreState(): Promise<void>;
  
  // 事件
  onTabChange(callback: TabChangeListener): () => void;
}

type CloseResult = 'saved' | 'discarded' | 'cancelled';

interface TabChangeEvent {
  type: 'created' | 'closed' | 'activated' | 'updated' | 'saved';
  tabId: string;
  tab?: TabState;
}
```

## UI 组件设计

```typescript
// ui/tab-bar.ts

interface TabBarConfig {
  container: HTMLElement;
  tabManager: TabManager;
  i18n: I18nService;
  onNewTab: () => void;
  onTabClose: (tabId: string) => Promise<boolean>;
  onTabSwitch: (tabId: string) => void;
}

class TabBar {
  render(): void;
  updateTabTitle(tabId: string, title: string): void;
  updateTabDirtyState(tabId: string, isDirty: boolean): void;
  setActiveTab(tabId: string): void;
  destroy(): void;
}
```

### HTML 结构

```html
<div class="tab-bar">
  <div class="tab-bar-scroll">
    <div class="tab-item active" data-tab-id="xxx">
      <span class="tab-icon">📄</span>
      <span class="tab-title">文档.md</span>
      <span class="tab-dirty-indicator">●</span>
      <button class="tab-close-btn">×</button>
    </div>
  </div>
  <button class="tab-new-btn" title="新建标签">
    <svg>+</svg>
  </button>
</div>
```

### 交互行为

- 点击标签：切换到该标签
- 点击关闭按钮：触发关闭流程
- 点击新建按钮：创建新标签
- 中键点击标签：直接关闭（不提示）

## 关闭流程

### 单个标签关闭流程

```
用户点击关闭按钮
    │
    ▼
检查 hasUnsavedChanges()
    │
    ├── 无更改 ──→ 直接关闭标签
    │
    └── 有更改 ──→ 弹出对话框
                    │
                    ├── 保存 ──→ 执行保存 → 关闭标签
                    ├── 不保存 ──→ 直接关闭标签
                    └── 取消 ──→ 什么都不做
```

### 关闭最后一个标签

```
关闭最后一个标签
    │
    ▼
检查 hasUnsavedChanges()
    │
    ├── 有更改 ──→ 弹出保存对话框
    │
    └── 无更改 ──→ 弹出退出确认对话框
                    │
                    ├── 是（退出）──→ 调用 exit_app
                    └── 否（不退出）──→ 创建新的空白标签
```

## 偏好设置集成

### 新增配置项

```typescript
'tabs.restoreOnStartup': {
  defaultValue: true,
  validate: (value) => typeof value === 'boolean',
},
'tabs.maxTabs': {
  defaultValue: 10,
  validate: (value) => typeof value === 'number' && value >= 1 && value <= 50,
},
'tabs.defaultNewTabBehavior': {
  defaultValue: 'blank',
  validate: (value) => value === 'blank' || value === 'welcome',
},
```

### 偏好设置面板新增分类

- 恢复标签页开关
- 最大标签数
- 新标签默认内容（空白/欢迎页）

## 文件结构

### 新增文件

```
tauri/src/
├── services/
│   └── tab-manager.ts          # 核心标签管理服务
├── ui/
│   └── tab-bar.ts              # 标签栏 UI 组件
├── types/
│   └── tab.ts                  # TabState 等类型定义
└── styles/
    └── tabs.css                # 标签栏样式
```

### 修改文件

```
tauri/src/
├── main.ts                     # 集成 TabManager
├── services/
│   ├── preferences-service.ts  # 添加标签相关偏好定义
│   └── index.ts                # 导出 TabManager
├── ui/
│   ├── preferences-panel.ts    # 添加标签页设置分类
│   ├── index.ts                # 导出 TabBar
│   └── icons.ts                # 添加标签相关图标
└── i18n/
    └── index.ts                # 添加标签相关翻译
```

## 实现顺序

1. 类型定义 (`types/tab.ts`)
2. 核心服务 (`services/tab-manager.ts`)
3. UI 组件 (`ui/tab-bar.ts`)
4. 样式文件 (`styles/tabs.css`)
5. 偏好设置集成
6. i18n 更新
7. 主应用集成
8. 测试和调试
