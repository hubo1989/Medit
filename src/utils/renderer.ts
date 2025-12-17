/**
 * Chrome Extension Renderer Manager using Offscreen API
 */

import ExtensionCacheManager from './cache-manager';
import { uploadInChunks, abortUpload } from './upload-manager';
import type {
  CacheStats,
  SimpleCacheStats,
  PlatformAPI,
  RenderOptions,
  RenderResult,
  RendererCacheManager,
  RendererThemeConfig,
} from '../types/index';

type ResponseEnvelopeLike = {
  type: 'RESPONSE';
  requestId: string;
  ok: boolean;
  data?: unknown;
  error?: { message?: string };
};

function isResponseEnvelopeLike(message: unknown): message is ResponseEnvelopeLike {
  if (!message || typeof message !== 'object') return false;
  const obj = message as Record<string, unknown>;
  return obj.type === 'RESPONSE' && typeof obj.requestId === 'string' && typeof obj.ok === 'boolean';
}

/**
 * Get platform instance from global scope
 * Platform is set by each platform's index.js before using shared modules
 */
function getPlatform(): PlatformAPI | undefined {
  return globalThis.platform;
}

class ExtensionRenderer {
  private cache: RendererCacheManager;
  private offscreenCreated: boolean = false;
  private initPromise: Promise<void> | null = null;
  private themeConfig: RendererThemeConfig | null = null;
  private requestCounter = 0;

  constructor(cacheManager: RendererCacheManager | null = null) {
    // Use provided cache manager or create a new one
    this.cache = cacheManager || new ExtensionCacheManager();
    this.offscreenCreated = false;
    this.initPromise = null;
    this.themeConfig = null; // Store current theme config for cache key generation
  }

  /**
   * Initialize the renderer
   */
  async init(): Promise<void> {
    try {
      // Ensure cache is properly initialized
      await this.cache.ensureDB();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set theme configuration for rendering
   * @param themeConfig - Theme configuration object
   */
  async setThemeConfig(themeConfig: RendererThemeConfig): Promise<void> {
    // Store theme config for cache key generation
    this.themeConfig = themeConfig;

    await this._sendEnvelope('SET_THEME_CONFIG', { config: themeConfig });
  }

  private createRequestId(): string {
    this.requestCounter += 1;
    return `${Date.now()}-${this.requestCounter}`;
  }

  /**
   * Send a unified RequestEnvelope to background.
   */
  private async _sendEnvelope(type: string, payload: unknown): Promise<unknown> {
    const platform = getPlatform();
    if (!platform) {
      throw new Error('Platform not available');
    }

    const response = await platform.message.send({
      id: this.createRequestId(),
      type,
      payload,
      timestamp: Date.now(),
      source: 'content-renderer',
    });

    if (isResponseEnvelopeLike(response)) {
      if (response.ok) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Request failed');
    }

    throw new Error('Unexpected response shape (expected ResponseEnvelope)');
  }

  /**
   * Unified diagram rendering method
   * @param renderType - Type of diagram (mermaid, vega, etc.)
   * @param input - Input data for rendering
   * @param extraParams - Additional parameters (including outputFormat: 'svg' | 'png')
   * @param cacheType - Cache type identifier
   * @returns Render result with base64/svg, width, height, format
   */
  async _renderDiagram(
    renderType: string,
    input: string | object,
    extraParams: RenderOptions = {},
    cacheType: string
  ): Promise<RenderResult> {
    // Generate cache key (include outputFormat)
    const inputString = typeof input === 'string' ? input : JSON.stringify(input);
    const contentKey = inputString + JSON.stringify(extraParams);
    const outputFormat = extraParams.outputFormat || 'png';
    const cacheKey = await this.cache.generateKey(contentKey, cacheType, this.themeConfig, outputFormat);

    // Check cache first
    const cached = (await this.cache.get(cacheKey)) as RenderResult | null;
    if (cached) {
      return cached;
    }

    const response = (await this._sendEnvelope('RENDER_DIAGRAM', {
      renderType,
      input,
      themeConfig: this.themeConfig,
      extraParams,
    })) as RenderResult;

    if (response.error) {
      throw new Error(response.error);
    }

    // Cache the complete response (base64 + dimensions)
    try {
      await this.cache.set(cacheKey, response, cacheType);
    } catch (error) {
      // Ignore cache errors
    }

    return response;
  }

  /**
   * Unified render method
   * @param type - Renderer type (mermaid, vega, vega-lite, html, svg, etc.)
   * @param input - Input data for rendering
   * @param extraParams - Additional parameters (including outputFormat: 'svg' | 'png')
   * @returns Render result with base64/svg, width, height, format
   */
  async render(type: string, input: string | object, extraParams: RenderOptions = {}): Promise<RenderResult> {
    // Generate cache type identifier based on output format
    const outputFormat = extraParams.outputFormat || 'png';
    const formatSuffix = outputFormat.toUpperCase();
    const cacheType = `${type.toUpperCase()}_${formatSuffix}`;
    
    return this._renderDiagram(type, input, extraParams, cacheType);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats | SimpleCacheStats | null> {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Cleanup offscreen document
   */
  async cleanup(): Promise<void> {
    try {
      if (this.offscreenCreated) {
        this.offscreenCreated = false;
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

export default ExtensionRenderer;
export { uploadInChunks, abortUpload };
