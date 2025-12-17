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

/**
 * Render message to send to offscreen document
 */
interface RenderMessage {
  action?: string;
  type?: string;
  renderType?: string;
  input?: string | object;
  themeConfig?: RendererThemeConfig | null;
  extraParams?: RenderOptions;
  config?: RendererThemeConfig;
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
    
    try {
      await this._sendMessage({
        type: 'setThemeConfig',
        config: themeConfig
      });
    } catch (error) {
      console.error('Failed to set theme config:', error);
    }
  }

  /**
   * Send message to offscreen document via background script
   */
  async _sendMessage(message: RenderMessage): Promise<RenderResult> {
    try {
      const platform = getPlatform();
      if (!platform) {
        throw new Error('Platform not available');
      }
      return (await platform.message.send(message as Record<string, unknown>)) as RenderResult;
    } catch (error) {
      throw error;
    }
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

    // Send unified message
    const message: RenderMessage = {
      action: 'RENDER_DIAGRAM',
      renderType,
      input,
      themeConfig: this.themeConfig,
      extraParams
    };
    const response = await this._sendMessage(message);

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
