/**
 * VSCode Platform API Implementation
 * 
 * Implements the platform interface for VS Code Extension environment.
 * Runs in webview context, communicates with extension host via postMessage.
 */

import {
  BaseCacheService,
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
  RenderResult,
  CacheStats,
  SimpleCacheStats
} from '../../types/index';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * VS Code API interface (available in webview)
 */
interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

/**
 * Message from extension host
 */
interface ExtensionMessage {
  type: string;
  requestId?: string;
  payload?: unknown;
  error?: string;
}

/**
 * Pending request entry
 */
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// ============================================================================
// VSCode Webview Bridge
// ============================================================================

/**
 * Bridge for communication between webview and extension host
 */
class VSCodeBridge {
  private vscode: VSCodeAPI | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private requestCounter = 0;
  private messageHandlers: ((message: ExtensionMessage) => void)[] = [];

  constructor() {
    this.initVSCodeAPI();
    this.setupMessageListener();
  }

  private initVSCodeAPI(): void {
    // acquireVsCodeApi is injected by VS Code into webview
    if (typeof acquireVsCodeApi !== 'undefined') {
      this.vscode = acquireVsCodeApi();
    }
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      const message = event.data as ExtensionMessage;
      
      // Handle response to pending request
      if (message.requestId && this.pendingRequests.has(message.requestId)) {
        const pending = this.pendingRequests.get(message.requestId)!;
        this.pendingRequests.delete(message.requestId);
        clearTimeout(pending.timeout);
        
        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.payload);
        }
        return;
      }

      // Notify registered handlers
      for (const handler of this.messageHandlers) {
        handler(message);
      }
    });
  }

  private createRequestId(): string {
    this.requestCounter += 1;
    return `vscode-${Date.now()}-${this.requestCounter}`;
  }

  /**
   * Send request and wait for response
   */
  sendRequest<T = unknown>(type: string, payload?: unknown, timeoutMs = 30000): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.vscode) {
        reject(new Error('VS Code API not available'));
        return;
      }

      const requestId = this.createRequestId();
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${type}`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout
      });

      this.vscode.postMessage({
        type,
        requestId,
        payload
      });
    });
  }

  /**
   * Send message without waiting for response
   */
  postMessage(type: string, payload?: unknown): void {
    if (this.vscode) {
      this.vscode.postMessage({ type, payload });
    }
  }

  /**
   * Add message handler
   */
  addHandler(handler: (message: ExtensionMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index >= 0) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Get/set webview state
   */
  getState(): unknown {
    return this.vscode?.getState();
  }

  setState(state: unknown): void {
    this.vscode?.setState(state);
  }
}

// Global bridge instance
const bridge = new VSCodeBridge();

// Declare acquireVsCodeApi for TypeScript
declare function acquireVsCodeApi(): VSCodeAPI;

// ============================================================================
// VSCode Storage Service
// ============================================================================

class VSCodeStorageService {
  async get(keys: string | string[]): Promise<Record<string, unknown>> {
    return bridge.sendRequest('STORAGE_GET', { keys });
  }

  async set(items: Record<string, unknown>): Promise<void> {
    return bridge.sendRequest('STORAGE_SET', { items });
  }

  async remove(keys: string | string[]): Promise<void> {
    return bridge.sendRequest('STORAGE_REMOVE', { keys });
  }
}

// ============================================================================
// VSCode File Service
// ============================================================================

class VSCodeFileService {
  async download(data: Blob | string, filename: string, options: { mimeType?: string } = {}): Promise<void> {
    let base64Data: string;
    let mimeType = options.mimeType || 'application/octet-stream';

    if (data instanceof Blob) {
      base64Data = await this.blobToBase64(data);
      mimeType = data.type || mimeType;
    } else {
      base64Data = data;
    }

    return bridge.sendRequest('DOWNLOAD_FILE', {
      filename,
      data: base64Data,
      mimeType
    });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

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
// VSCode Cache Service
// ============================================================================

/**
 * VSCode Cache Service
 * Proxies cache operations to extension host via postMessage.
 * Extension host uses file system (globalStorageUri) for persistent storage.
 */
class VSCodeCacheService extends BaseCacheService {
  async init(): Promise<void> {
    // Initialization handled by extension host
  }

  async ensureDB(): Promise<void> {
    // No database needed in webview - extension host handles storage
  }

  async get(key: string): Promise<unknown> {
    try {
      return await bridge.sendRequest('CACHE_GET', { key });
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, type?: string): Promise<boolean> {
    try {
      return await bridge.sendRequest<boolean>('CACHE_SET', { key, value, type });
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return await bridge.sendRequest<boolean>('CACHE_DELETE', { key });
    } catch {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      return await bridge.sendRequest<boolean>('CACHE_CLEAR', {});
    } catch {
      return false;
    }
  }

  async getStats(): Promise<SimpleCacheStats> {
    try {
      const stats = await bridge.sendRequest<SimpleCacheStats>('CACHE_STATS', {});
      return stats ?? {
        itemCount: 0,
        maxItems: 500,
        totalSize: 0,
        totalSizeMB: '0 MB',
        items: []
      };
    } catch {
      return {
        itemCount: 0,
        maxItems: 500,
        totalSize: 0,
        totalSizeMB: '0 MB',
        items: []
      };
    }
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
  private cache: VSCodeCacheService;
  private resourceService: VSCodeResourceService;
  private requestQueue: Promise<void>;
  private queueContext: QueueContext;

  constructor(cacheService: VSCodeCacheService, resourceService: VSCodeResourceService) {
    super();
    this.cache = cacheService;
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
  public readonly storage: VSCodeStorageService;
  public readonly file: VSCodeFileService;
  public readonly resource: VSCodeResourceService;
  public readonly cache: VSCodeCacheService;
  public readonly renderer: VSCodeRendererService;
  public readonly i18n: VSCodeI18nService;

  constructor() {
    this.storage = new VSCodeStorageService();
    this.file = new VSCodeFileService();
    this.resource = new VSCodeResourceService();
    this.cache = new VSCodeCacheService();
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
export { DEFAULT_SETTING_LOCALE };
