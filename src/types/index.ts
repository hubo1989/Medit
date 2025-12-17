/**
 * Unified Type Definitions
 * 
 * All shared types should be imported from this file.
 * This is the single source of truth for type definitions.
 */

// =============================================================================
// Core Types
// =============================================================================

export type {
  TranslateFunction,
  EscapeHtmlFunction,
  FileState,
  AllFileStates,
  HistoryEntry,
  FileStateManager,
  BackgroundMessage,
  ContentMessage,
  MessageHandler,
  UploadSession,
} from './core';

// =============================================================================
// Cache Types
// =============================================================================

export type {
  CacheItem,
  MemoryCacheItem,
  MemoryCacheStats,
  IndexedDBCacheStats,
  CacheStats,
  SimpleCacheStats,
  ICacheManager,
  RendererCacheManager,
} from './cache';

// =============================================================================
// Render Types
// =============================================================================

export type {
  RenderResult,
  RenderOptions,
  RenderResultType,
  RenderResultContent,
  RenderResultDisplay,
  UnifiedRenderResult,
  RendererThemeConfig,
} from './render';

// =============================================================================
// Theme Types
// =============================================================================

export type {
  HeadingConfig,
  FontScheme,
  BorderConfig,
  TableStyleConfig,
  CodeThemeConfig,
  SpacingScheme,
  Theme,
  ThemeDefinition,
  ThemeCategoryInfo,
  ThemeRegistry,
  ThemeRegistryInfo,
} from './theme';

// =============================================================================
// Platform Types
// =============================================================================

export type {
  PlatformType,
  PlatformMessageAPI,
  PlatformStorageAPI,
  PlatformResourceAPI,
  PlatformI18nAPI,
  PlatformBridgeAPI,
  DownloadOptions,
  CacheService,
  RendererService,
  StorageService,
  FileService,
  ResourceService,
  I18nService,
  MessageService,
  PlatformAPI,
} from './platform';

// =============================================================================
// Plugin Types
// =============================================================================

export type {
  TaskStatus,
  TaskData,
  AsyncTaskObject,
  PlaceholderResult,
  AsyncTaskResult,
  AsyncTaskPlugin,
  AsyncTaskQueueManager,
  ASTNode,
  IPlugin,
  PluginRenderer,
  PluginRenderResult,
} from './plugin';

// =============================================================================
// DOCX Types
// =============================================================================

export type {
  AlignmentTypeValue,
  BorderStyleValue,
  DOCXRunStyle,
  DOCXParagraphSpacing,
  DOCXParagraphStyle,
  DOCXHeadingStyle,
  DOCXCharacterStyle,
  DOCXBorder,
  DOCXTableBorders,
  DOCXTableStyle,
  DOCXCodeColors,
  DOCXThemeStyles,
  LinkDefinition,
  ImageBufferResult,
  DOCXImageType,
  FetchImageResult,
  DOCXExportResult,
  DOCXProgressCallback,
  DocxExporter,
  DOCXASTNode,
  DOCXListNode,
  DOCXBlockquoteNode,
  DOCXTableNode,
  DOCXInlineNode,
} from './docx';

export { BorderStyle, AlignmentType } from './docx';

// =============================================================================
// Toolbar Types
// =============================================================================

export type {
  LayoutConfig,
  ToolbarManagerOptions,
  GenerateToolbarHTMLOptions,
  ToolbarManagerInstance,
} from './toolbar';
