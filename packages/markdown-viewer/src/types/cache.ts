/**
 * Cache Type Definitions
 * Types for caching system
 */

import type { RendererThemeConfig } from './render';

// =============================================================================
// Cache Item Types
// =============================================================================

/**
 * Individual cache item stored in IndexedDB
 */
export interface CacheItem<T = unknown> {
  key: string;
  value: T;
  type: string;
  size: number;
  timestamp: number;
  accessTime: number;
}

// =============================================================================
// Cache Statistics Types
// =============================================================================

/**
 * IndexedDB cache statistics
 */
export interface IndexedDBCacheStats {
  itemCount: number;
  maxItems: number;
  totalSize: number;
  totalSizeMB: string;
  items: Array<{
    key: string;
    type: string;
    size: number;
    sizeMB: string;
    created: string;
    lastAccess: string;
  }>;
}

/**
 * Full cache statistics (for detailed view)
 */
export interface CacheStats {
  indexedDBCache: IndexedDBCacheStats;
  combined: {
    totalItems: number;
    totalSizeMB: string;
  };
  databaseInfo: {
    dbName: string;
    storeName: string;
    version: number;
  };
}

/**
 * Simple cache stats for popup/background communication
 */
export interface SimpleCacheStats {
  itemCount: number;
  maxItems: number;
  totalSize: number;
  totalSizeMB: string;
  items: CacheItem[];
  message?: string;
}

// =============================================================================
// Cache Manager Interface
// =============================================================================

/**
 * Cache manager interface for content scripts
 */
export interface ICacheManager {
  ensureDB?(): Promise<unknown>;
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, type?: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<boolean>;
  cleanup?(): Promise<void>;
  getStats(): Promise<CacheStats | SimpleCacheStats | null>;
}

// =============================================================================
// Renderer Cache Manager Interface
// =============================================================================

/**
 * Cache manager interface for renderers.
 * Used by both the extension-side cache manager and the background proxy.
 */
export interface RendererCacheManager {
  ensureDB(): Promise<unknown>;
  generateKey(
    content: string,
    type: string,
    themeConfig?: RendererThemeConfig | null,
    outputFormat?: string
  ): Promise<string>;
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, type: string): Promise<void>;
  delete?(key: string): Promise<boolean>;
  cleanup?(): Promise<void>;
  getStats(): Promise<CacheStats | SimpleCacheStats | null>;
  clear(): Promise<void>;
}
