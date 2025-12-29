/**
 * VSCode Platform API Implementation
 * 
 * Implements the platform interface for VS Code Extension environment.
 * Runs in webview context, communicates with extension host via postMessage.
 */

import {
  BaseI18nService,
  BaseRendererService,
  DEFAULT_SETTING_LOCALE,
  FALLBACK_LOCALE
} from '../shared/index';

import type {
  LocaleMessages,
  QueueContext
} from '../shared/index';

import type {
  RendererThemeConfig,
  RenderResult
} from '../../types/index';

import type { PlatformBridgeAPI } from '../../types/index';

import { ServiceChannel } from '../../messaging/channels/service-channel';
import { VSCodeWebviewTransport } from '../../messaging/transports/vscode-webview-transport';
import { CacheService, StorageService, FileService } from '../../services';

// ============================================================================
// Service Channel (Extension Host ↔ Webview)
// ============================================================================

const transport = new VSCodeWebviewTransport();
const serviceChannel = new ServiceChannel(transport, {
  source: 'vscode-webview',
  timeoutMs: 30000,
});

// Unified cache service (same as Chrome/Mobile)
const cacheService = new CacheService(serviceChannel);

// Unified storage service (same as Chrome/Mobile)
const storageService = new StorageService(serviceChannel);

// Unified file service (same as Chrome/Mobile)
const fileService = new FileService(serviceChannel);

// Bridge compatibility layer (matches Mobile pattern)
const bridge: PlatformBridgeAPI = {
  sendRequest: async <T = unknown>(type: string, payload: unknown): Promise<T> => {
    return (await serviceChannel.send(type, payload)) as T;
  },
  postMessage: (type: string, payload: unknown): void => {
    serviceChannel.post(type, payload);
  },
  addListener: (handler: (message: unknown) => void): (() => void) => {
    return serviceChannel.onAny((message) => {
      handler(message);
    });
  },
};

// Declare acquireVsCodeApi for TypeScript
declare function acquireVsCodeApi(): VSCodeAPI;

// ============================================================================
// VSCode Resource Service
// ============================================================================

class VSCodeResourceService {
  private baseUri = '';

  setBaseUri(uri: string): void {
    this.baseUri = uri;
  }

  getURL(path: string): string {
    if (this.baseUri) {
      return `${this.baseUri}/${path}`;
    }
    return path;
  }

  async fetch(path: string): Promise<string> {
    // Request asset from extension host
    return bridge.sendRequest('FETCH_ASSET', { path });
  }
}

// ============================================================================
// VSCode Renderer Service (uses iframe like Mobile)
// ============================================================================

import type { RenderHost } from '../../renderers/host/render-host';
import { IframeRenderHost } from '../../renderers/host/iframe-render-host';

/**
 * Render request payload
 */
interface RenderRequestPayload {
  renderType: string;
  input: string | object;
  themeConfig: RendererThemeConfig | null;
}

/**
 * VSCode Renderer Service
 * Renders diagrams in a separate iframe to avoid blocking main thread
 * Same architecture as Mobile platform
 * 
 * Uses postMessage READY/ACK handshake with render frame.
 */
class VSCodeRendererService extends BaseRendererService {
  private host: RenderHost | null = null;
  private cache: CacheService;
  private resourceService: VSCodeResourceService;
  private requestQueue: Promise<void>;
  private queueContext: QueueContext;

  constructor(cache: CacheService, resourceService: VSCodeResourceService) {
    super();
    this.cache = cache;
    this.resourceService = resourceService;
    this.requestQueue = Promise.resolve();
    this.queueContext = { cancelled: false, id: 0 };
  }

  async init(): Promise<void> {
    // Get nonce from parent window (set by preview-panel.ts)
    const nonce = (window as unknown as { VSCODE_NONCE?: string }).VSCODE_NONCE;
    
    this.host = new IframeRenderHost({
      // Use fetchHtmlContent to load HTML and create srcdoc iframe
      // This avoids CSP script-src restrictions in VSCode webview
      fetchHtmlContent: async () => {
        const html = await this.resourceService.fetch('iframe-render.html');
        return html;
      },
      // Pass nonce to iframe so scripts can execute under parent's CSP
      nonce,
      source: 'vscode-parent',
    });
  }

  /**
   * Cancel all pending requests and create new queue context
   * Called when starting a new render to cancel previous requests
   */
  cancelPending(): void {
    this.queueContext.cancelled = true;
    this.queueContext = { cancelled: false, id: this.queueContext.id + 1 };
    this.requestQueue = Promise.resolve();
  }

  /**
   * Get current queue context for requests to reference
   */
  getQueueContext(): QueueContext {
    return this.queueContext;
  }

  /**
   * Wait for render iframe to be ready
   */
  async ensureIframe(): Promise<void> {
    if (this.host) {
      await this.host.ensureReady();
    }
  }

  /**
   * Send message to iframe and wait for response
   * Requests are serialized: wait for previous request to complete before sending next
   * Each request has its own timeout
   */
  sendRequest<T = unknown>(
    type: string,
    payload: unknown = {},
    timeout: number = 60000,
    context: QueueContext | null = null
  ): Promise<T> {
    const requestContext = context || this.queueContext;
    
    if (requestContext.cancelled) {
      return Promise.reject(new Error('Request cancelled'));
    }
    
    const request = this.requestQueue.then(() => {
      if (requestContext.cancelled) {
        return Promise.reject(new Error('Request cancelled'));
      }
      return this._doSendRequest<T>(type, payload, timeout, requestContext);
    });
    
    this.requestQueue = request.catch(() => {}) as Promise<void>;
    
    return request;
  }
  
  /**
   * Actually send the request and wait for response
   */
  private _doSendRequest<T>(
    type: string,
    payload: unknown,
    timeout: number,
    context: QueueContext
  ): Promise<T> {
    if (context.cancelled) {
      return Promise.reject(new Error('Request cancelled'));
    }

    if (!this.host) {
      return Promise.reject(new Error('Renderer not initialized'));
    }

    return this.host.send<T>(type, payload, timeout).then((data) => {
      if (context.cancelled) {
        throw new Error('Request cancelled');
      }
      return data as T;
    });
  }

  // Keep for compatibility, but not used with iframe approach
  registerRenderer(_type: string, _renderer: unknown): void {
    // No-op: renderers are loaded inside iframe
  }

  /**
   * Set theme configuration for rendering
   */
  async setThemeConfig(config: RendererThemeConfig): Promise<void> {
    this.themeConfig = config;
    await this.ensureIframe();
    await this.sendRequest('SET_THEME_CONFIG', { config });
  }

  /**
   * Render content using the iframe renderer
   */
  async render(
    type: string,
    input: string | object,
    context: QueueContext | null = null
  ): Promise<RenderResult> {
    const renderContext = context || this.queueContext;
    
    if (renderContext.cancelled) {
      throw new Error('Render cancelled');
    }
    
    // Generate cache key
    const inputString = typeof input === 'string' ? input : JSON.stringify(input);
    const cacheType = `${type.toUpperCase()}_PNG`;
    const cacheKey = await this.cache.generateKey(inputString, cacheType, this.themeConfig);

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as RenderResult;
    }
    
    if (renderContext.cancelled) {
      throw new Error('Render cancelled');
    }

    await this.ensureIframe();
    const result = await this.sendRequest<RenderResult>('RENDER_DIAGRAM', {
      renderType: type,
      input,
      themeConfig: this.themeConfig
    } as RenderRequestPayload, 60000, renderContext);

    // Cache the result
    this.cache.set(cacheKey, result, cacheType).catch(() => {});

    return result;
  }

  async cleanup(): Promise<void> {
    await this.host?.cleanup?.();
  }
}

// ============================================================================
// VSCode I18n Service
// ============================================================================

class VSCodeI18nService extends BaseI18nService {
  private resourceService: VSCodeResourceService;

  constructor(resourceService: VSCodeResourceService) {
    super();
    this.resourceService = resourceService;
  }

  async init(): Promise<void> {
    try {
      await this.ensureFallbackMessages();
      this.ready = Boolean(this.fallbackMessages);
    } catch (error) {
      console.warn('[I18n] init failed:', error);
      this.ready = false;
    }
  }

  async loadLocale(locale: string): Promise<void> {
    try {
      this.messages = await this.fetchLocaleData(locale);
      this.ready = Boolean(this.messages || this.fallbackMessages);
    } catch (error) {
      console.warn('[I18n] Failed to load locale', locale, error);
      this.messages = null;
    }
  }

  async fetchLocaleData(locale: string): Promise<LocaleMessages | null> {
    try {
      const content = await this.resourceService.fetch(`_locales/${locale}/messages.json`);
      return JSON.parse(content);
    } catch (error) {
      console.warn('[I18n] fetchLocaleData failed for', locale, error);
      return null;
    }
  }

  getUILanguage(): string {
    // Get from VS Code's locale setting
    return navigator.language || 'en';
  }
}

// ============================================================================
// VSCode Platform API
// ============================================================================

export class VSCodePlatformAPI {
  public readonly platform = 'vscode' as const;

  // Services
  public readonly storage: StorageService;
  public readonly file: FileService;
  public readonly resource: VSCodeResourceService;
  public readonly cache: CacheService;
  public readonly renderer: VSCodeRendererService;
  public readonly i18n: VSCodeI18nService;

  constructor() {
    this.storage = storageService; // Use unified storage service
    this.file = fileService;       // Use unified file service
    this.resource = new VSCodeResourceService();
    this.cache = cacheService; // Use unified cache service
    this.renderer = new VSCodeRendererService(this.cache, this.resource);
    this.i18n = new VSCodeI18nService(this.resource);
  }

  async init(): Promise<void> {
    await this.cache.init();
    await this.i18n.init();
    await this.renderer.init();
  }

  /**
   * Set the base URI for resources (called from extension host)
   */
  setResourceBaseUri(uri: string): void {
    this.resource.setBaseUri(uri);
  }
}

// ============================================================================
// Export
// ============================================================================

export const vscodePlatform = new VSCodePlatformAPI();
export { vscodePlatform as platform };
export { bridge as vscodeBridge };
export { transport as vscodeTransport };
export { serviceChannel as vscodeServiceChannel };
export { DEFAULT_SETTING_LOCALE };
