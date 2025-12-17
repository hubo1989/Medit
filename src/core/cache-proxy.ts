// Background Cache Proxy for Content Scripts
// Communicates with background script via platform message API

import type {
  CacheStats,
  PlatformAPI,
  RendererCacheManager,
  RendererThemeConfig,
  SimpleCacheStats,
} from '../types/index';

/**
 * Cache manager proxy that delegates cache operations to the background script.
 * This is used in content scripts where direct IndexedDB access is not available.
 */
export class BackgroundCacheManagerProxy implements RendererCacheManager {
  private platform: PlatformAPI;
  dbName = 'MarkdownViewerCache';
  storeName = 'cache';
  dbVersion = 1;

  constructor(platform: PlatformAPI) {
    this.platform = platform;
  }

  async get(key: string): Promise<unknown> {
    try {
      const response = await this.platform.message.send({
        type: 'cacheOperation',
        operation: 'get',
        key: key
      });

      const error = (response as { error?: unknown } | null | undefined)?.error;
      if (typeof error === 'string' && error) {
        throw new Error(error);
      }

      return (response as { result?: unknown } | null | undefined)?.result ?? null;
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: unknown, type = 'unknown'): Promise<void> {
    const response = await this.platform.message.send({
      type: 'cacheOperation',
      operation: 'set',
      key: key,
      value: value,
      dataType: type
    });

    const error = (response as { error?: unknown } | null | undefined)?.error;
    if (typeof error === 'string' && error) {
      throw new Error(error);
    }
  }

  async clear(): Promise<void> {
    const response = await this.platform.message.send({
      type: 'cacheOperation',
      operation: 'clear'
    });

    const error = (response as { error?: unknown } | null | undefined)?.error;
    if (typeof error === 'string' && error) {
      throw new Error(error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const response = await this.platform.message.send({
        type: 'cacheOperation',
        operation: 'delete',
        key: key
      });

      const error = (response as { error?: unknown } | null | undefined)?.error;
      if (typeof error === 'string' && error) {
        throw new Error(error);
      }

      return Boolean((response as { success?: unknown } | null | undefined)?.success);
    } catch (error) {
      return false;
    }
  }

  async getStats(): Promise<CacheStats | SimpleCacheStats | null> {
    try {
      const response = await this.platform.message.send({
        type: 'cacheOperation',
        operation: 'getStats'
      });

      const error = (response as { error?: unknown } | null | undefined)?.error;
      if (typeof error === 'string' && error) {
        throw new Error(error);
      }

      return ((response as { result?: unknown } | null | undefined)?.result as CacheStats | SimpleCacheStats | undefined) || null;
    } catch (error) {
      return null;
    }
  }

  // No need for initDB since background handles it
  async initDB(): Promise<void> {
    return Promise.resolve();
  }

  // Alias for ensureDB - required by ICacheManager interface in renderer.ts
  async ensureDB(): Promise<unknown> {
    return Promise.resolve(undefined);
  }

  async calculateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async generateKey(content: string, type: string, themeConfig: RendererThemeConfig | null = null, outputFormat?: string): Promise<string> {
    let keyContent = content;
    
    // Include theme config in cache key if provided
    if (themeConfig && themeConfig.fontFamily && themeConfig.fontSize) {
      keyContent = `${content}_font:${themeConfig.fontFamily}_size:${themeConfig.fontSize}`;
    }
    
    // Include output format in cache key if provided
    if (outputFormat) {
      keyContent = `${keyContent}_format:${outputFormat}`;
    }
    
    const hash = await this.calculateHash(keyContent);
    return `${hash}_${type}`;
  }
}
