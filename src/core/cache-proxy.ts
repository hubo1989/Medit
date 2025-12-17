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

  private requestCounter = 0;

  constructor(platform: PlatformAPI) {
    this.platform = platform;
  }

  private createRequestId(): string {
    this.requestCounter += 1;
    return `${Date.now()}-${this.requestCounter}`;
  }

  private async sendCacheOperation(payload: Record<string, unknown>): Promise<unknown> {
    const response = await this.platform.message.send({
      id: this.createRequestId(),
      type: 'CACHE_OPERATION',
      payload,
      timestamp: Date.now(),
      source: 'content-cache-proxy',
    });

    if (!response || typeof response !== 'object') {
      throw new Error('No response received from background script');
    }

    const ok = (response as { ok?: unknown }).ok;
    if (ok === true) {
      return (response as { data?: unknown }).data;
    }

    const errorMessage = (response as { error?: { message?: unknown } }).error?.message;
    throw new Error(typeof errorMessage === 'string' ? errorMessage : 'Unknown cache error');
  }

  async get(key: string): Promise<unknown> {
    try {
      return (await this.sendCacheOperation({
        operation: 'get',
        key,
      })) ?? null;
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: unknown, type = 'unknown'): Promise<void> {
    await this.sendCacheOperation({
      operation: 'set',
      key,
      value,
      dataType: type,
    });
  }

  async clear(): Promise<void> {
    await this.sendCacheOperation({
      operation: 'clear',
    });
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.sendCacheOperation({
        operation: 'delete',
        key,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getStats(): Promise<CacheStats | SimpleCacheStats | null> {
    try {
      return (await this.sendCacheOperation({
        operation: 'getStats',
      })) as CacheStats | SimpleCacheStats | null;
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
