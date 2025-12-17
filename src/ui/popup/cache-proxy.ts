/**
 * Background cache proxy for popup
 * Communicates with content scripts through background script
 */

import { translate } from './i18n-helpers';
import { toSimpleCacheStats } from '../../utils/popup-cache-stats';
import type { SimpleCacheStats } from '../../types/cache';

/**
 * Clear cache result
 */
interface ClearResult {
  success: boolean;
  error?: string;
}

/**
 * Proxy class for cache operations via background script
 * Note: Popup cannot access IndexedDB directly due to security restrictions
 */
export class BackgroundCacheProxy {
  private maxItems: number | null;

  constructor() {
    // Don't hardcode maxItems, get it from actual stats
    this.maxItems = null;
  }

  /**
   * Get cache statistics from background script
   * @returns Cache stats object
   */
  async getStats(): Promise<SimpleCacheStats> {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getCacheStats'
      }) as unknown;

      if (response && typeof response === 'object' && 'error' in (response as Record<string, unknown>)) {
        throw new Error(String((response as { error?: unknown }).error || 'Unknown error'));
      }

      if (!response) {
        return {
          itemCount: 0,
          maxItems: 1000,
          totalSize: 0,
          totalSizeMB: '0.00',
          items: []
        };
      }

      const normalized = toSimpleCacheStats(response, this.maxItems || 1000);
      this.maxItems = normalized.maxItems;
      return normalized;
    } catch (error) {
      console.error('Failed to get cache stats via background:', error);
      return {
        itemCount: 0,
        maxItems: this.maxItems || 1000,
        totalSize: 0,
        totalSizeMB: '0.00',
        items: [],
        message: translate('cache_error_message')
      };
    }
  }

  /**
   * Clear all cache via background script
   * @returns Clear result
   */
  async clear(): Promise<ClearResult> {
    try {
      return await chrome.runtime.sendMessage({
        action: 'clearCache'
      }) as ClearResult;
    } catch (error) {
      console.error('Failed to clear cache via background:', error);
      throw error;
    }
  }
}
