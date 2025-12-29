/**
 * Unified Cache Service
 * 
 * Application-layer cache service that uses ServiceChannel for communication.
 * Platform-agnostic - works with any transport (Chrome, Mobile, VSCode).
 */

import type { ServiceChannel } from '../messaging/channels/service-channel';
import type { RendererThemeConfig } from '../types/render';
import type { SimpleCacheStats } from '../types/cache';

// ============================================================================
// Types
// ============================================================================

export interface CacheOperationPayload {
  operation: 'get' | 'set' | 'delete' | 'clear' | 'getStats';
  key?: string;
  value?: unknown;
  dataType?: string;
  size?: number;
  limit?: number;
}

export interface CacheSetResult {
  success: boolean;
}

// ============================================================================
// Cache Service
// ============================================================================

/**
 * Unified cache service using ServiceChannel for backend communication.
 * The actual storage is handled by the platform's backend (Background Script,
 * Flutter host, or VSCode Extension Host).
 */
export class CacheService {
  private channel: ServiceChannel;

  constructor(channel: ServiceChannel) {
    this.channel = channel;
  }

  /**
   * Initialize cache service
   */
  async init(): Promise<void> {
    // Initialization handled by backend
  }

  /**
   * Calculate SHA-256 hash of text
   */
  async calculateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate cache key from content, type, and optional theme config
   */
  async generateKey(
    content: string,
    type: string,
    themeConfig: RendererThemeConfig | null = null
  ): Promise<string> {
    let keyContent = content;
    
    if (themeConfig && themeConfig.fontFamily && themeConfig.fontSize) {
      keyContent = `${content}_font:${themeConfig.fontFamily}_size:${themeConfig.fontSize}`;
    }
    
    const hash = await this.calculateHash(keyContent);
    return `${hash}_${type}`;
  }

  /**
   * Estimate byte size of data
   */
  estimateSize(data: unknown): number {
    return new Blob([typeof data === 'string' ? data : JSON.stringify(data)]).size;
  }

  /**
   * Get cached item
   */
  async get(key: string): Promise<unknown> {
    try {
      const result = await this.channel.send('CACHE_OPERATION', {
        operation: 'get',
        key,
      } as CacheOperationPayload);
      return result ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Set cached item
   */
  async set(key: string, value: unknown, type: string = 'unknown'): Promise<boolean> {
    try {
      const result = await this.channel.send('CACHE_OPERATION', {
        operation: 'set',
        key,
        value,
        dataType: type,
        size: this.estimateSize(value),
      } as CacheOperationPayload);

      // Handle various response formats
      if (result && typeof result === 'object') {
        const resultObj = result as CacheSetResult;
        return resultObj.success !== false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete cached item
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.channel.send('CACHE_OPERATION', {
        operation: 'delete',
        key,
      } as CacheOperationPayload);

      if (result && typeof result === 'object') {
        const resultObj = result as CacheSetResult;
        return resultObj.success !== false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      const result = await this.channel.send('CACHE_OPERATION', {
        operation: 'clear',
      } as CacheOperationPayload);

      if (result && typeof result === 'object') {
        const resultObj = result as CacheSetResult;
        return resultObj.success !== false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(limit?: number): Promise<SimpleCacheStats | null> {
    try {
      const result = await this.channel.send('CACHE_OPERATION', {
        operation: 'getStats',
        limit,
      } as CacheOperationPayload);

      return (result as SimpleCacheStats) || null;
    } catch {
      return null;
    }
  }
}
