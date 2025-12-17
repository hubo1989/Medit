/**
 * Mobile Platform API Implementation
 * 
 * Runs in WebView context, communicates with the host app (Flutter) via JavaScript channel.
 */

import {
  BaseCacheService,
  BaseI18nService,
  BaseRendererService,
  DEFAULT_SETTING_LOCALE,
  FALLBACK_LOCALE
} from '../shared/index';

import type {
  LocaleMessages
} from '../shared/index';

import type {
  RendererThemeConfig,
  RenderResult,
  RenderOptions,
  CacheStats,
  SimpleCacheStats
} from '../../types/index';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Pending request entry
 */
interface PendingRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

/**
 * Message from host
 */
interface HostMessage {
  _responseId?: number;
  error?: string;
  result?: unknown;
  type?: string;
  [key: string]: unknown;
}

/**
 * Message to host
 */
interface OutgoingMessage {
  _requestId?: number;
  type: string;
  payload?: unknown;
}

/**
 * Message listener callback
 */
type MessageListener = (data: HostMessage) => void;

/**
 * Download options
 */
interface DownloadOptions {
  mimeType?: string;
  [key: string]: unknown;
}

/**
 * Render request context for cancellation
 */
interface QueueContext {
  cancelled: boolean;
  id: number;
}

/**
 * Render pending request with context
 */
interface RenderPendingRequest<T = unknown> extends PendingRequest<T> {
  context?: QueueContext;
}

/**
 * Window extensions for mobile platform
 */
declare global {
  interface Window {
    MarkdownViewer?: {
      postMessage: (message: string) => void;
    };
    __receiveMessageFromHost?: (payload: unknown) => void;
    __renderFrameReady?: boolean;
    __renderFrameReadyCallbacks?: Array<() => void>;
    __renderFramePendingRequests?: Map<number, RenderPendingRequest>;
    __mobilePlatformCache?: MobileCacheService;
  }
}

// ============================================================================
// Message Bridge
// ============================================================================

/**
 * Message bridge for Host ↔ WebView communication.
 *
 * Flutter integration notes:
 * - JS -> Flutter: use JavascriptChannel name `MarkdownViewer`, call `MarkdownViewer.postMessage(JSON.stringify(...))`.
 * - Flutter -> JS: execute JS `window.__receiveMessageFromHost(<json or object>)`.
 */
class MessageBridge {
  private pendingRequests: Map<number, PendingRequest>;
  private requestId: number;
  private listeners: MessageListener[];

  constructor() {
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.listeners = [];
    this._setupMessageHandler();
  }

  private _setupMessageHandler(): void {
    const handleIncoming = (data: unknown): void => {
      if (!data) return;

      let parsed: HostMessage;
      
      // Allow string payloads (JSON)
      if (typeof data === 'string') {
        try {
          parsed = JSON.parse(data);
        } catch {
          return;
        }
      } else if (typeof data === 'object' && data !== null) {
        parsed = data as HostMessage;
      } else {
        return;
      }

      // Handle response to pending request
      if (parsed._responseId !== undefined) {
        const pending = this.pendingRequests.get(parsed._responseId);
        if (pending) {
          this.pendingRequests.delete(parsed._responseId);
          if (parsed.error) {
            pending.reject(new Error(parsed.error));
          } else {
            pending.resolve(parsed.result);
          }
        }
        return;
      }

      // Handle incoming message from host
      for (const listener of this.listeners) {
        try {
          listener(parsed);
        } catch (e) {
          console.error('Message listener error:', e);
        }
      }
    };

    // Optional: support window.postMessage-based delivery (e.g. debugging)
    window.addEventListener('message', (event) => handleIncoming(event.data));

    // Primary: Flutter calls this via `runJavaScript`
    window.__receiveMessageFromHost = (payload: unknown): void => {
      handleIncoming(payload);
    };
  }

  /**
   * Send message to Flutter and wait for response
   */
  sendRequest<T = unknown>(type: string, payload: unknown = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${type}`));
        }
      }, 30000);

      this._postToHost({
        _requestId: id,
        type,
        payload
      });
    });
  }

  /**
   * Send message to Flutter without waiting for response
   */
  postMessage(type: string, payload: unknown = {}): void {
    this._postToHost({ type, payload });
  }

  private _postToHost(message: OutgoingMessage): void {
    const json = JSON.stringify(message);

    // Flutter WebView: JavascriptChannel
    if (window.MarkdownViewer && typeof window.MarkdownViewer.postMessage === 'function') {
      window.MarkdownViewer.postMessage(json);
      return;
    }

    // No-op fallback (host channel not available)
    console.warn('[Mobile] Host message channel not available');
  }

  /**
   * Add listener for messages from Flutter
   */
  addListener(callback: MessageListener): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }
}

const bridge = new MessageBridge();

// ============================================================================
// Mobile Storage Service
// ============================================================================

/**
 * Mobile Storage Service
 * Storage operations handled by host app (Flutter).
 */
class MobileStorageService {
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
// Mobile File Service
// ============================================================================

/**
 * Mobile File Service
 * File operations handled by host app (Flutter).
 */
class MobileFileService {
  /**
   * Download/share file - unified interface with Chrome
   * @param data - Blob or base64 string
   * @param filename - File name
   * @param options - Download options
   */
  async download(data: Blob | string, filename: string, options: DownloadOptions = {}): Promise<void> {
    let base64Data: string;
    let mimeType = options.mimeType || 'application/octet-stream';
    
    if (data instanceof Blob) {
      // Convert Blob to base64 for Flutter
      base64Data = await this._blobToBase64(data);
      mimeType = data.type || mimeType;
    } else {
      // Assume already base64
      base64Data = data;
    }
    
    bridge.postMessage('DOWNLOAD_FILE', {
      filename,
      data: base64Data,
      mimeType
    });
  }

  private async _blobToBase64(blob: Blob): Promise<string> {
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
// Mobile Resource Service
// ============================================================================

/**
 * Mobile Resource Service
 * Resources are bundled with the app
 */
class MobileResourceService {
  getURL(path: string): string {
    // In mobile WebView loaded via loadFlutterAsset, we need absolute asset URLs
    // Using relative paths from the loaded HTML should work
    return `./${path}`;
  }

  /**
   * Fetch asset content via Flutter bridge
   * WebView's native fetch doesn't work reliably with Flutter assets
   * @param path - Asset path relative to webview folder
   * @returns Asset content as string
   */
  async fetch(path: string): Promise<string> {
    return bridge.sendRequest('FETCH_ASSET', { path });
  }
}

// ============================================================================
// Mobile Message Service
// ============================================================================

/**
 * Mobile Message Service
 * Handles Host ↔ WebView communication
 */
class MobileMessageService {
  send<T = unknown>(message: unknown): Promise<T> {
    return bridge.sendRequest('MESSAGE', message);
  }

  addListener(callback: MessageListener): () => void {
    return bridge.addListener(callback);
  }
}

// ============================================================================
// Mobile Cache Service
// ============================================================================

/**
 * Cache entry stored in IndexedDB
 */
interface CacheEntry {
  key: string;
  value: unknown;
  type: string;
  timestamp: number;
}

/**
 * Mobile Cache Service
 * Uses IndexedDB directly in WebView
 * Extends BaseCacheService for common hash/key generation
 */
class MobileCacheService extends BaseCacheService {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null;

  constructor() {
    super();
    this.dbName = 'MarkdownViewerCache';
    this.storeName = 'cache';
    this.db = null;
  }

  async init(): Promise<void> {
    await this.ensureDB();
  }

  async ensureDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  async get(key: string): Promise<unknown> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve((request.result as CacheEntry)?.value || null);
    });
  }

  async set(key: string, value: unknown, type: string = 'unknown'): Promise<boolean> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const entry: CacheEntry = { key, value, type, timestamp: Date.now() };
      const request = store.put(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async delete(key: string): Promise<boolean> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async clear(): Promise<boolean> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async getStats(): Promise<CacheStats | null> {
    // Minimal stats implementation for mobile WebView
    return null;
  }
}

// ============================================================================
// Mobile Renderer Service
// ============================================================================

/**
 * Render request payload
 */
interface RenderRequestPayload {
  renderType: string;
  input: string | object;
  themeConfig: RendererThemeConfig | null;
  extraParams?: RenderOptions;
}

/**
 * Render response
 */
interface MobileRenderResult {
  base64?: string;
  svg?: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Mobile Renderer Service
 * Renders diagrams in a separate iframe to avoid blocking main thread
 * Similar to Chrome extension's offscreen document approach
 * Extends BaseRendererService for common theme config handling
 * 
 * Uses global state set up by inline script in index.html:
 * - window.__renderFrameReady
 * - window.__renderFrameReadyCallbacks
 * - window.__renderFramePendingRequests
 */
class MobileRendererService extends BaseRendererService {
  private iframe: HTMLIFrameElement | null;
  private requestId: number;
  private readyPromise: Promise<void> | null;
  private requestQueue: Promise<void>;
  private queueContext: QueueContext;

  constructor() {
    super();
    this.iframe = null;
    this.requestId = 0;
    this.readyPromise = null;
    this.requestQueue = Promise.resolve();
    this.queueContext = { cancelled: false, id: 0 };
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
   * Check if render frame is ready
   */
  get isReady(): boolean {
    return window.__renderFrameReady || false;
  }

  /**
   * Get pending requests map (shared with inline script)
   */
  get pendingRequests(): Map<number, RenderPendingRequest> {
    return window.__renderFramePendingRequests!;
  }

  /**
   * Wait for render iframe to be ready
   */
  async ensureIframe(): Promise<void> {
    if (!this.iframe) {
      this.iframe = document.getElementById('render-frame') as HTMLIFrameElement | null;
    }

    if (this.isReady) {
      return;
    }

    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = new Promise((resolve, reject) => {
      window.__renderFrameReadyCallbacks!.push(resolve);

      setTimeout(() => {
        if (!this.isReady) {
          console.error('[MobileRenderer] Render frame load timeout');
          reject(new Error('Render frame load timeout'));
        }
      }, 15000);
    });

    return this.readyPromise;
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
    return new Promise((resolve, reject) => {
      if (context.cancelled) {
        reject(new Error('Request cancelled'));
        return;
      }
      
      if (!this.iframe || !this.isReady) {
        reject(new Error('Render frame not ready'));
        return;
      }

      const id = ++this.requestId;
      
      const timeoutTimer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Render request timeout (${timeout/1000}s): ${type}`));
        }
      }, timeout);
      
      this.pendingRequests.set(id, { 
        resolve: (result: unknown) => {
          clearTimeout(timeoutTimer);
          resolve(result as T);
        }, 
        reject: (error: Error) => {
          clearTimeout(timeoutTimer);
          reject(error);
        },
        context
      });

      this.iframe.contentWindow!.postMessage({
        ...(payload as object),
        type,
        requestId: id
      }, '*');
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
    extraParams: RenderOptions = {},
    context: QueueContext | null = null
  ): Promise<MobileRenderResult> {
    const renderContext = context || this.queueContext;
    
    if (renderContext.cancelled) {
      throw new Error('Render cancelled');
    }
    
    const cache = window.__mobilePlatformCache;
    if (cache) {
      const inputString = typeof input === 'string' ? input : JSON.stringify(input);
      const contentKey = inputString + JSON.stringify(extraParams);
      const outputFormat = (extraParams.outputFormat as string) || 'png';
      const formatSuffix = outputFormat.toUpperCase();
      const cacheType = `${type.toUpperCase()}_${formatSuffix}`;
      const cacheKey = await cache.generateKey(contentKey, cacheType, this.themeConfig);

      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached as MobileRenderResult;
      }
      
      if (renderContext.cancelled) {
        throw new Error('Render cancelled');
      }

      await this.ensureIframe();
      const result = await this.sendRequest<MobileRenderResult>('RENDER_DIAGRAM', {
        renderType: type,
        input,
        themeConfig: this.themeConfig,
        extraParams
      } as RenderRequestPayload, 60000, renderContext);

      cache.set(cacheKey, result, cacheType).catch(() => {});

      return result;
    }

    if (renderContext.cancelled) {
      throw new Error('Render cancelled');
    }
    
    await this.ensureIframe();
    return this.sendRequest<MobileRenderResult>('RENDER_DIAGRAM', {
      renderType: type,
      input,
      themeConfig: this.themeConfig,
      extraParams
    } as RenderRequestPayload, 60000, renderContext);
  }

  async cleanup(): Promise<void> {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
      this.readyPromise = null;
    }
  }
}

// ============================================================================
// Mobile I18n Service
// ============================================================================

/**
 * Mobile I18n Service
 * Loads locale data from bundled JSON files
 * Extends BaseI18nService for common message lookup logic
 */
class MobileI18nService extends BaseI18nService {
  constructor() {
    super();
  }

  async init(): Promise<void> {
    try {
      await this.ensureFallbackMessages();
      // For mobile, we use system locale by default
      this.ready = Boolean(this.messages || this.fallbackMessages);
    } catch (error) {
      console.warn('[I18n] init failed:', error);
      this.ready = Boolean(this.fallbackMessages);
    }
  }

  async loadLocale(locale: string): Promise<void> {
    try {
      this.messages = await this.fetchLocaleData(locale);
      this.locale = locale;
      this.ready = Boolean(this.messages || this.fallbackMessages);
    } catch (e) {
      console.warn('Failed to load locale:', locale, e);
      this.messages = null;
      this.ready = Boolean(this.fallbackMessages);
    }
  }

  async fetchLocaleData(locale: string): Promise<LocaleMessages | null> {
    try {
      const response = await fetch(`./_locales/${locale}/messages.json`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.warn('[I18n] fetchLocaleData failed for', locale, error);
      return null;
    }
  }

  getUILanguage(): string {
    return navigator.language || 'en';
  }
}

// ============================================================================
// Mobile Platform API
// ============================================================================

/**
 * Mobile Platform API
 * Implements PlatformAPI interface for mobile WebView environment
 */
class MobilePlatformAPI {
  public readonly platform = 'mobile' as const;
  
  // Services
  public readonly storage: MobileStorageService;
  public readonly file: MobileFileService;
  public readonly resource: MobileResourceService;
  public readonly message: MobileMessageService;
  public readonly cache: MobileCacheService;
  public readonly renderer: MobileRendererService;
  public readonly i18n: MobileI18nService;
  
  // Internal bridge reference (for advanced usage)
  public readonly _bridge: MessageBridge;

  constructor() {
    // Initialize services
    this.storage = new MobileStorageService();
    this.file = new MobileFileService();
    this.resource = new MobileResourceService();
    this.message = new MobileMessageService();
    this.cache = new MobileCacheService();
    this.renderer = new MobileRendererService();
    this.i18n = new MobileI18nService();
    
    // Internal bridge reference
    this._bridge = bridge;

    // Expose cache globally for renderer to use
    window.__mobilePlatformCache = this.cache;
  }

  /**
   * Initialize all platform services
   */
  async init(): Promise<void> {
    await this.cache.init();
    await this.i18n.init();
  }

  /**
   * Notify host app that WebView is ready
   */
  notifyReady(): void {
    bridge.postMessage('WEBVIEW_READY');
  }

  /**
   * Request file download (triggers system share sheet)
   * @deprecated Use platform.file.download() instead
   */
  downloadFile(filename: string, data: string, mimeType: string): void {
    bridge.postMessage('DOWNLOAD_FILE', {
      filename,
      data, // base64 encoded
      mimeType
    });
  }
}

// ============================================================================
// Export
// ============================================================================

export const platform = new MobilePlatformAPI();

export {
  bridge,
  MobileStorageService,
  MobileFileService,
  MobileResourceService,
  MobileMessageService,
  MobileCacheService,
  MobileRendererService,
  MobileI18nService,
  MobilePlatformAPI,
  DEFAULT_SETTING_LOCALE
};
