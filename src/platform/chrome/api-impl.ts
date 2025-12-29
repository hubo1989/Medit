/**
 * Chrome Platform API Implementation
 * 
 * Implements the platform interface for Chrome Extension environment.
 */

import {
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
  RenderResult
} from '../../types/index';

import type { RenderHost } from '../../renderers/host/render-host';
import { OffscreenRenderHost } from './hosts/offscreen-render-host';

import { ServiceChannel } from '../../messaging/channels/service-channel';
import { ChromeRuntimeTransport } from '../../messaging/transports/chrome-runtime-transport';
import { CacheService, StorageService, FileService } from '../../services';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Message handler function type
 */
type MessageHandler = (
  message: unknown,
  sender: chrome.runtime.MessageSender
) => void | Promise<unknown>;

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

// ============================================================================
// Service Channel (Content Script ↔ Background)
// ============================================================================

const serviceChannel = new ServiceChannel(new ChromeRuntimeTransport(), {
  source: 'chrome-content',
  timeoutMs: 300000,
});

// Unified services (same as Mobile/VSCode)
const cacheService = new CacheService(serviceChannel);
const storageService = new StorageService(serviceChannel);
const fileService = new FileService(serviceChannel, { forceChunkedUpload: true }); // Chrome needs chunked upload

// ============================================================================
// Chrome Resource Service
// ============================================================================

export class ChromeResourceService {
  getURL(path: string): string {
    return chrome.runtime.getURL(path);
  }

  /**
   * Fetch asset content
   * @param path - Asset path relative to extension root
   * @returns Asset content as string
   */
  async fetch(path: string): Promise<string> {
    const url = this.getURL(path);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.text();
  }
}

// ============================================================================
// Chrome Message Service
// ============================================================================

export class ChromeMessageService {
  private requestCounter = 0;

  private createRequestId(): string {
    this.requestCounter += 1;
    return `${Date.now()}-${this.requestCounter}`;
  }

  send(message: unknown, timeout: number = 300000): Promise<ResponseEnvelopeLike> {
    return new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        reject(new Error('Message timeout after 5 minutes'));
      }, timeout);

      chrome.runtime.sendMessage(message, (response: unknown) => {
        clearTimeout(timeoutTimer);

        if (chrome.runtime.lastError) {
          reject(new Error(`Runtime error: ${chrome.runtime.lastError.message}`));
          return;
        }

        if (response === undefined) {
          reject(new Error('No response received from background script'));
          return;
        }

        // Envelope-only: background must respond with ResponseEnvelope.
        if (isResponseEnvelopeLike(response)) {
          resolve(response);
          return;
        }

        reject(new Error('Unexpected response type (expected ResponseEnvelope)'));
      });
    });
  }

  /**
   * Preferred: send a unified RequestEnvelope.
   */
  sendEnvelope(type: string, payload: unknown, timeout: number = 300000, source = 'chrome-platform'): Promise<ResponseEnvelopeLike> {
    return this.send(
      {
        id: this.createRequestId(),
        type,
        payload,
        timestamp: Date.now(),
        source,
      },
      timeout
    );
  }

  addListener(handler: (message: unknown) => void): void {
    chrome.runtime.onMessage.addListener((message) => {
      // Event-only listener: envelope RPC is handled via send/sendEnvelope.
      handler(message);
      return false;
    });
  }
}

// ============================================================================
// Chrome Renderer Service
// Uses offscreen document for rendering diagrams (mermaid, vega, etc.)
// ============================================================================

export class ChromeRendererService extends BaseRendererService {
  private messageService: ChromeMessageService;
  private offscreenHost: RenderHost | null = null;
  private themeDirty = false;
  private cache: CacheService;

  constructor(messageService: ChromeMessageService, cacheService: CacheService) {
    super();
    this.messageService = messageService;
    this.cache = cacheService;
  }

  async init(): Promise<void> {
    // Renderer initialization handled by background/offscreen
  }

  private getHost(): RenderHost {
    if (!this.offscreenHost) {
      this.offscreenHost = new OffscreenRenderHost(this.messageService, 'chrome-renderer');
    }
    return this.offscreenHost;
  }

  private async applyThemeIfNeeded(host: RenderHost): Promise<void> {
    if (!this.themeConfig) {
      return;
    }
    if (!this.themeDirty) {
      return;
    }
    await host.send('SET_THEME_CONFIG', { config: this.themeConfig }, 300000);
    this.themeDirty = false;
  }

  async setThemeConfig(config: RendererThemeConfig): Promise<void> {
    this.themeConfig = config;
    this.themeDirty = true;
    const host = this.getHost();
    await this.applyThemeIfNeeded(host);
  }

  async render(type: string, content: string | object): Promise<RenderResult> {
    // Generate cache key
    const inputString = typeof content === 'string' ? content : JSON.stringify(content);
    const contentKey = inputString;
    const cacheType = `${type.toUpperCase()}_PNG`;
    const cacheKey = await this.cache.generateKey(contentKey, cacheType, this.themeConfig);

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as RenderResult;
    }

    const host = this.getHost();
    await this.applyThemeIfNeeded(host);

    const result = await host.send<RenderResult>(
      'RENDER_DIAGRAM',
      {
        renderType: type,
        input: content,
        themeConfig: this.themeConfig,
      },
      300000
    );

    // Cache the result asynchronously (don't wait)
    this.cache.set(cacheKey, result, cacheType).catch(() => {});

    return result;
  }

  cancelPending(): void {
    // Chrome renderer uses offscreen document which handles its own lifecycle
    // No cancellation needed at this level
  }

  getQueueContext(): { cancelled: boolean; id: number } {
    // Chrome doesn't use queue context - offscreen document handles serialization
    return { cancelled: false, id: 0 };
  }

  async ensureIframe(): Promise<void> {
    // Chrome uses offscreen document instead of iframe
    // Just ensure the host is ready
    this.getHost();
  }

  async cleanup(): Promise<void> {
    // Offscreen document cleanup handled by Chrome runtime
    this.offscreenHost = null;
  }
}

// ============================================================================
// Chrome I18n Service
// Extends BaseI18nService for common message lookup logic
// ============================================================================

export class ChromeI18nService extends BaseI18nService {
  private storageService: StorageService;
  private resourceService: ChromeResourceService;

  constructor(storageService: StorageService, resourceService: ChromeResourceService) {
    super();
    this.storageService = storageService;
    this.resourceService = resourceService;
  }

  async init(): Promise<void> {
    try {
      await this.ensureFallbackMessages();
      const result = await this.storageService.get(['markdownViewerSettings']);
      const settings = (result.markdownViewerSettings || {}) as Record<string, unknown>;
      const preferredLocale = (settings.preferredLocale as string) || DEFAULT_SETTING_LOCALE;
      
      if (preferredLocale !== DEFAULT_SETTING_LOCALE) {
        await this.loadLocale(preferredLocale);
      }
      this.locale = preferredLocale;
    } catch (error) {
      console.warn('[I18n] init failed:', error);
    } finally {
      this.ready = Boolean(this.messages || this.fallbackMessages);
    }
  }

  async loadLocale(locale: string): Promise<void> {
    try {
      this.messages = await this.fetchLocaleData(locale);
      this.ready = Boolean(this.messages || this.fallbackMessages);
    } catch (error) {
      console.warn('[I18n] Failed to load locale', locale, error);
      this.messages = null;
      this.ready = Boolean(this.fallbackMessages);
    }
  }

  async fetchLocaleData(locale: string): Promise<LocaleMessages | null> {
    try {
      const url = this.resourceService.getURL(`_locales/${locale}/messages.json`);
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('[I18n] fetchLocaleData failed for', locale, error);
      return null;
    }
  }

  translate(key: string, substitutions?: string | string[]): string {
    if (!key) return '';

    // Try user-selected messages first (using base class logic)
    const value = this.lookupMessage(this.messages, key, substitutions);
    if (value !== null) return value;

    // Try fallback messages
    const fallbackValue = this.lookupMessage(this.fallbackMessages, key, substitutions);
    if (fallbackValue !== null) return fallbackValue;

    // Use Chrome's built-in i18n as last resort
    if (chrome?.i18n?.getMessage) {
      return chrome.i18n.getMessage(key, substitutions) || '';
    }

    return '';
  }

  getUILanguage(): string {
    if (chrome?.i18n?.getUILanguage) {
      return chrome.i18n.getUILanguage();
    }
    return navigator.language || 'en';
  }
}

// ============================================================================
// Chrome Platform API
// ============================================================================

export class ChromePlatformAPI {
  public readonly platform = 'chrome' as const;
  
  // Services
  public readonly storage: StorageService;
  public readonly file: FileService;
  public readonly resource: ChromeResourceService;
  public readonly message: ChromeMessageService;
  public readonly cache: CacheService;
  public readonly renderer: ChromeRendererService;
  public readonly i18n: ChromeI18nService;

  constructor() {
    // Initialize services
    this.storage = storageService; // Use unified storage service
    this.file = fileService;       // Use unified file service (with chunked upload)
    this.resource = new ChromeResourceService();
    this.message = new ChromeMessageService();
    this.cache = cacheService; // Use unified cache service
    this.renderer = new ChromeRendererService(this.message, this.cache);
    this.i18n = new ChromeI18nService(this.storage, this.resource);
  }

  async init(): Promise<void> {
    await this.cache.init();
    await this.i18n.init();
  }
}

// ============================================================================
// Export
// ============================================================================

export const chromePlatform = new ChromePlatformAPI();

export { DEFAULT_SETTING_LOCALE };
