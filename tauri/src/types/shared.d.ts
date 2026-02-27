/**
 * Type declarations for main project modules
 * Re-exports types from the main project for Tauri platform implementation
 */

// =============================================================================
// Render Types
// =============================================================================

export interface RenderResult {
  base64?: string;
  width: number;
  height: number;
  format: string;
  success?: boolean;
  error?: string;
}

export interface RendererThemeConfig {
  fontFamily?: string;
  fontSize?: number;
  background?: string;
  foreground?: string;
  diagramStyle?: 'normal' | 'handDrawn';
}

// =============================================================================
// Cache Types
// =============================================================================

export interface CacheItem<T = unknown> {
  key: string;
  value: T;
  type: string;
  size: number;
  timestamp: number;
  accessTime: number;
}

export interface SimpleCacheStats {
  itemCount: number;
  maxItems: number;
  totalSize: number;
  totalSizeMB: string;
  items: CacheItem<unknown>[];
}

// =============================================================================
// Settings Types
// =============================================================================

export type SettingKey = 
  | 'themeId'
  | 'tableMergeEmpty'
  | 'tableLayout'
  | 'frontmatterDisplay'
  | 'preferredLocale'
  | 'docxHrDisplay'
  | 'docxEmojiStyle';

export interface SettingTypes {
  themeId: string;
  tableMergeEmpty: boolean;
  tableLayout: 'left' | 'center';
  frontmatterDisplay: 'hide' | 'table' | 'raw';
  preferredLocale: string;
  docxHrDisplay: 'pageBreak' | 'line' | 'hide';
  docxEmojiStyle: 'apple' | 'windows' | 'system';
}

export interface SetSettingOptions {
  refresh?: boolean;
}

export interface ISettingsService {
  get<K extends SettingKey>(key: K): Promise<SettingTypes[K]>;
  set<K extends SettingKey>(key: K, value: SettingTypes[K], options?: SetSettingOptions): Promise<void>;
  getAll(): Promise<SettingTypes>;
  onChange?(listener: (key: SettingKey, value: unknown) => void): () => void;
}

// =============================================================================
// Core Types
// =============================================================================

export interface FileState {
  scrollLine?: number;
  tocVisible?: boolean;
  zoom?: number;
  layoutMode?: string;
  lastModified?: number;
  [key: string]: unknown;
}

// =============================================================================
// Service Interfaces
// =============================================================================

export interface CacheService {
  init(): Promise<void>;
  calculateHash(text: string): Promise<string>;
  generateKey(content: string, type: string, themeConfig?: RendererThemeConfig | null): Promise<string>;
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, type?: string): Promise<boolean>;
  clear(): Promise<boolean>;
  getStats(): Promise<SimpleCacheStats | null>;
}

export interface RendererService {
  init(): Promise<void>;
  setThemeConfig(config: RendererThemeConfig): void;
  getThemeConfig(): RendererThemeConfig | null;
  render(type: string, content: string | object): Promise<RenderResult>;
}

export interface StorageService {
  get(keys: string[]): Promise<Record<string, unknown>>;
  set(data: Record<string, unknown>): Promise<void>;
  remove(keys: string[]): Promise<void>;
}

export interface FileService {
  download(blob: Blob | string, filename: string, options?: { saveAs?: boolean; mimeType?: string }): Promise<void>;
}

export interface FileStateService {
  get(url: string): Promise<FileState>;
  set(url: string, state: FileState): void;
  clear(url: string): Promise<void>;
}

export interface ResourceService {
  fetch(path: string): Promise<string>;
  getURL(path: string): string;
}

export interface I18nService {
  translate(key: string, substitutions?: string | string[]): string;
  getUILanguage(): string;
  setLocale?(locale: string): Promise<void>;
}

export interface MessageService {
  send(message: Record<string, unknown>): Promise<unknown>;
  addListener(handler: (message: unknown) => void): void;
}

// =============================================================================
// Platform API
// =============================================================================

export type PlatformType = 'chrome' | 'firefox' | 'mobile' | 'vscode' | 'obsidian';

export interface PlatformAPI {
  platform: PlatformType;
  cache: CacheService;
  renderer: RendererService;
  storage: StorageService;
  file: FileService;
  fileState: FileStateService;
  resource: ResourceService;
  i18n: I18nService;
  message: MessageService;
  settings: ISettingsService;
}

// =============================================================================
// Plugin Renderer
// =============================================================================

export interface PluginRenderResult {
  base64?: string;
  width: number;
  height: number;
  format: string;
  error?: string;
}

export interface PluginRenderer {
  render(type: string, content: string | object): Promise<PluginRenderResult | null>;
}

// =============================================================================
// Async Task Manager
// =============================================================================

export class AsyncTaskManager {
  constructor(translate?: (key: string, subs?: string | string[]) => string);
  abort(): void;
}

// =============================================================================
// Render Markdown Flow Options
// =============================================================================

export interface RenderMarkdownFlowOptions {
  markdown: string;
  container: HTMLElement;
  fileChanged?: boolean;
  forceRender?: boolean;
  zoomLevel?: number;
  scrollController: unknown;
  renderer: PluginRenderer;
  translate: (key: string, subs?: string | string[]) => string;
  platform: PlatformAPI;
  currentTaskManagerRef: { current: AsyncTaskManager | null };
  onHeadings?: (headings: unknown[]) => void;
}

// =============================================================================
// Module Declarations
// =============================================================================

declare module '@shared/types/index.js' {
  export * from './shared.d.ts';
}

declare module '@shared/core/viewer/viewer-host.js' {
  export * from '@shared/types/index.js';
  export const renderMarkdownFlow: (options: RenderMarkdownFlowOptions) => Promise<void>;
  export const createPluginRenderer: (platform: PlatformAPI) => PluginRenderer;
  export const setCurrentFileKey: (key: string) => void;
}

declare module '@shared/core/markdown-processor.js' {
  export { AsyncTaskManager } from '@shared/types/index.js';
}
