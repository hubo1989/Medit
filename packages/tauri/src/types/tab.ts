/**
 * Tab types for multi-tab document editing support
 */

/** 单个标签页的状态 */
export interface TabState {
  /** 唯一标识符 */
  id: string;
  /** 显示标题（文件名或"未命名"） */
  title: string;
  /** 关联的文件路径（null 表示未保存的新文档） */
  filePath: string | null;
  /** 当前内容 */
  content: string;
  /** 最后保存的内容（用于检测未保存更改） */
  lastSavedContent: string;
  /** 预览滚动位置 */
  scrollPosition: number;
  /** 编辑器滚动位置 */
  editorScrollPosition: number;
  /** 是否有未保存更改 */
  isDirty: boolean;
  /** 创建时间戳 */
  createdAt: number;
  /** 最后修改时间戳 */
  modifiedAt: number;
}

/** 标签管理器配置 */
export interface TabManagerConfig {
  /** 最大标签数 */
  maxTabs: number;
  /** 启动时恢复标签 */
  restoreOnStartup: boolean;
  /** 新标签默认内容 */
  defaultNewTabBehavior: 'blank' | 'welcome';
  /** 当内容变更时的回调 */
  onContentChange?: (tabId: string, content: string) => void;
  /** 当标签切换时的回调 */
  onTabSwitch?: (tabId: string, tab: TabState) => void;
  /** 当标签创建时的回调 */
  onTabCreate?: (tabId: string, tab: TabState) => void;
  /** 当标签关闭时的回调 */
  onTabClose?: (tabId: string) => void;
  /** 当标签更新时的回调 */
  onTabUpdate?: (tabId: string, tab: TabState) => void;
  /** 当需要保存时的回调 */
  onSave?: (tabId: string, content: string) => Promise<boolean>;
  /** 当需要退出应用时的回调 */
  onExitRequest?: () => void;
}

/** 状态持久化结构（localStorage） */
export interface PersistedTabState {
  id: string;
  title: string;
  filePath: string | null;
  scrollPosition: number;
  editorScrollPosition: number;
  createdAt: number;
}

/** 标签变更事件类型 */
export type TabChangeEventType = 'created' | 'closed' | 'activated' | 'updated' | 'saved';

/** 标签变更事件 */
export interface TabChangeEvent {
  type: TabChangeEventType;
  tabId: string;
  tab?: TabState;
}

/** 标签变更监听器 */
export type TabChangeListener = (event: TabChangeEvent) => void;

/** 关闭结果 */
export type CloseResult = 'saved' | 'discarded' | 'cancelled';

/** 标签关闭选项 */
export interface CloseTabOptions {
  /** 是否强制关闭（不提示保存） */
  force?: boolean;
  /** 是否是最后一个标签 */
  isLastTab?: boolean;
}

/** 新建标签选项 */
export interface CreateTabOptions {
  /** 文件路径 */
  filePath?: string;
  /** 初始内容 */
  content?: string;
  /** 标题 */
  title?: string;
  /** 是否激活新标签 */
  activate?: boolean;
}

/** 持久化的标签管理器状态 */
export interface PersistedTabManagerState {
  /** 标签列表 */
  tabs: PersistedTabState[];
  /** 当前激活的标签ID */
  activeTabId: string | null;
  /** 保存时间戳 */
  savedAt: number;
}
