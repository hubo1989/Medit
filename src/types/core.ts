/**
 * Core Type Definitions
 * Basic types used throughout the application
 */

// =============================================================================
// Function Types
// =============================================================================

/**
 * Translation function - supports both single string and array substitutions
 */
export type TranslateFunction = (key: string, substitutions?: string | string[]) => string;

/**
 * HTML escape function
 */
export type EscapeHtmlFunction = (str: string) => string;

// =============================================================================
// File State Types
// =============================================================================

/**
 * Per-file UI state (scroll position, TOC visibility, zoom, etc.)
 */
export interface FileState {
  /** Line-based scroll position (stable during content changes) */
  scrollLine?: number;
  tocVisible?: boolean;
  zoom?: number;
  layoutMode?: string;
  lastModified?: number;
  [key: string]: unknown;
}

/**
 * All file states storage - keyed by URL
 */
export interface AllFileStates {
  [url: string]: FileState;
}

/**
 * History entry for recently viewed files
 */
export interface HistoryEntry {
  url: string;
  title: string;
  lastAccess: string;
}

/**
 * File state manager interface
 */
export interface FileStateManager {
  saveFileState(state: FileState): void;
  getFileState(): Promise<FileState>;
}

// =============================================================================
// Message Types
// =============================================================================

/**
 * Background script message
 * 
 * @deprecated Use RequestEnvelope from src/types/messaging.ts instead.
 * This flat message format is being phased out in favor of the standardized
 * envelope format: { id, type, payload, timestamp, source? }
 * 
 * Migration guide:
 * - Move all flat fields (action, url, state, etc.) into the `payload` object
 * - Use ServiceChannel.send() or ServiceChannel.post() for message passing
 * - See docs/dev/messaging-audit.md for details
 */
export interface BackgroundMessage {
  type?: string;
  action?: string;
  url?: string;
  state?: FileState;
  position?: number;
  operation?: string;
  key?: string;
  value?: unknown;
  dataType?: string;
  limit?: number;
  renderType?: string;
  input?: string | object;
  themeConfig?: unknown;
  config?: unknown;
  extraParams?: unknown;
  filePath?: string;
  binary?: boolean;
  payload?: {
    purpose?: string;
    encoding?: string;
    metadata?: Record<string, unknown>;
    expectedSize?: number;
    chunkSize?: number;
  };
  token?: string;
  chunk?: string;
}

/**
 * Generic message handler
 */
export type MessageHandler = (message: unknown) => void;

// =============================================================================
// Upload Types
// =============================================================================

/**
 * Upload session for chunked file uploads
 */
export interface UploadSession {
  purpose: string;
  encoding: 'text' | 'base64';
  metadata: Record<string, unknown>;
  expectedSize: number | null;
  chunkSize: number;
  chunks: string[];
  receivedBytes: number;
  createdAt: number;
  completed: boolean;
  data?: string;
  lastChunkTime?: number;
  completedAt?: number;
}
