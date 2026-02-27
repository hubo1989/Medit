/**
 * Type declarations for main project modules
 * These declarations allow TypeScript to compile without checking main project files
 */

// Main Platform API interface - using any for flexibility
declare module '@shared/types/index.js' {
  export interface PluginRenderer {
    renderMermaid(code: string, id: string): Promise<string>;
    renderVega(spec: unknown, id: string): Promise<string>;
    renderVegaLite(spec: unknown, id: string): Promise<string>;
    renderGraphviz(code: string, id: string): Promise<string>;
    renderDrawio(xml: string, id: string): Promise<string>;
    renderCanvas(json: string, id: string): Promise<string>;
    renderInfographic(json: string, id: string): Promise<string>;
  }
  
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
  
  // Main Platform API interface - allow any for flexibility
  export interface PlatformAPI {
    settings: any;
    cache: any;
    renderer: any;
    storage: any;
    file: any;
    fileState: any;
    resource: any;
    i18n: any;
    message: any;
    platform?: string;
  }
  
  // Export types for compatibility
  export type CacheService = any;
  export type RendererService = any;
  export type StorageService = any;
  export type FileService = any;
  export type FileStateService = any;
  export type ResourceService = any;
  export type I18nService = any;
  export type MessageService = any;
  export type SimpleCacheStats = any;
  export type ISettingsService = any;
  export type SettingTypes = any;
  export type SettingKey = any;
  export type FileState = any;
  export type RendererThemeConfig = any;
  export type RenderResult = any;
  
  export class AsyncTaskManager {
    constructor(translate?: (key: string, subs?: string | string[]) => string);
    abort(): void;
  }
}

declare module '@shared/core/viewer/viewer-host.js' {
  export * from '@shared/types/index.js';
  export const renderMarkdownFlow: (options: import('@shared/types/index.js').RenderMarkdownFlowOptions) => Promise<void>;
  export const createPluginRenderer: (platform: import('@shared/types/index.js').PlatformAPI) => import('@shared/types/index.js').PluginRenderer;
  export const setCurrentFileKey: (key: string) => void;
  export class AsyncTaskManager {
    constructor(translate?: (key: string, subs?: string | string[]) => string);
    abort(): void;
  }
}

declare module '@shared/core/markdown-processor.js' {
  export class AsyncTaskManager {
    constructor(translate?: (key: string, subs?: string | string[]) => string);
    abort(): void;
  }
}
