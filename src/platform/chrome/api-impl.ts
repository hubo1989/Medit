/**
 * Chrome Platform API Implementation
 * 
 * Implements the platform interface for Chrome Extension environment.
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
 * Storage keys type
 */
type StorageKeys = string | string[] | Record<string, unknown>;

/**
 * Chrome download options
 */
interface DownloadOptions {
  saveAs?: boolean;
}

/**
 * Message handler function type
 */
type MessageHandler = (
  message: unknown,
  sender: chrome.runtime.MessageSender
) => void | Promise<unknown>;

/**
 * Cache operation message types
 */
interface CacheOperationMessage {
  type: 'cacheOperation';
  operation: 'get' | 'set' | 'clear' | 'getStats';
  key?: string;
  value?: unknown;
  dataType?: string;
}

/**
 * Theme config message
 */
interface ThemeConfigMessage {
  type: 'setThemeConfig';
  config: RendererThemeConfig;
}

/**
 * Render diagram message
 */
interface RenderDiagramMessage {
  action: 'RENDER_DIAGRAM';
  renderType: string;
  input: string | object;
  themeConfig: RendererThemeConfig | null;
  extraParams?: RenderOptions;
}

/**
 * Response with result
 */
interface MessageResponse<T = unknown> {
  result?: T;
  success?: boolean;
  error?: string;
}

// ============================================================================
// Chrome Storage Service
// ============================================================================

export class ChromeStorageService {
  async get(keys: StorageKeys): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result || {});
      });
    });
  }

  async set(data: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  }

  async remove(keys: string | string[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, () => {
        resolve();
      });
    });
  }
}

// ============================================================================
// Chrome File Service
// ============================================================================

export class ChromeFileService {
  async download(blob: Blob, filename: string, options: DownloadOptions = {}): Promise<void> {
    const url = URL.createObjectURL(blob);
    try {
      await chrome.downloads.download({
        url,
        filename,
        saveAs: options.saveAs !== false
      });
    } finally {
      // Delay revoke to ensure download starts
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

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
  send<T = unknown>(message: unknown, timeout: number = 300000): Promise<MessageResponse<T>> {
    return new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        reject(new Error('Message timeout after 5 minutes'));
      }, timeout);

      chrome.runtime.sendMessage(message, (response: MessageResponse<T> | undefined) => {
        clearTimeout(timeoutTimer);

        if (chrome.runtime.lastError) {
          reject(new Error(`Runtime error: ${chrome.runtime.lastError.message}`));
          return;
        }

        if (!response) {
          reject(new Error('No response received from background script'));
          return;
        }

        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        resolve(response);
      });
    });
  }

  addListener(handler: MessageHandler): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const result = handler(message, sender);
      if (result instanceof Promise) {
        result.then(sendResponse).catch((err: Error) => {
          sendResponse({ error: err.message });
        });
        return true; // Keep channel open for async response
      }
      return false;
    });
  }
}

// ============================================================================
// Chrome Cache Service (Proxy to Background)
// Extends BaseCacheService for common hash/key generation
// ============================================================================

export class ChromeCacheService extends BaseCacheService {
  private messageService: ChromeMessageService;

  constructor(messageService: ChromeMessageService) {
    super();
    this.messageService = messageService;
  }

  async init(): Promise<void> {
    // No initialization needed, background handles it
  }

  async ensureDB(): Promise<void> {
    // No initialization needed, background handles it
  }

  async get(key: string): Promise<unknown> {
    try {
      const response = await this.messageService.send<unknown>({
        type: 'cacheOperation',
        operation: 'get',
        key: key
      } as CacheOperationMessage);
      return response.result || null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, type: string = 'unknown'): Promise<boolean> {
    try {
      const response = await this.messageService.send({
        type: 'cacheOperation',
        operation: 'set',
        key: key,
        value: value,
        dataType: type
      } as CacheOperationMessage);
      return response.success || false;
    } catch {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      const response = await this.messageService.send({
        type: 'cacheOperation',
        operation: 'clear'
      } as CacheOperationMessage);
      return response.success || false;
    } catch {
      return false;
    }
  }

  async getStats(): Promise<CacheStats | SimpleCacheStats | null> {
    try {
      const response = await this.messageService.send({
        type: 'cacheOperation',
        operation: 'getStats'
      } as CacheOperationMessage);
      return (response.result as CacheStats | SimpleCacheStats) || null;
    } catch {
      return null;
    }
  }
}

// ============================================================================
// Chrome Renderer Service
// Extends BaseRendererService for common theme config handling
// ============================================================================

export class ChromeRendererService extends BaseRendererService {
  private messageService: ChromeMessageService;
  private cache: ChromeCacheService;

  constructor(messageService: ChromeMessageService, cacheService: ChromeCacheService) {
    super();
    this.messageService = messageService;
    this.cache = cacheService;
  }

  async init(): Promise<void> {
    // Renderer initialization handled by background/offscreen
  }

  async setThemeConfig(config: RendererThemeConfig): Promise<void> {
    this.themeConfig = config;
    try {
      await this.messageService.send({
        type: 'setThemeConfig',
        config: config
      } as ThemeConfigMessage);
    } catch (error) {
      console.error('Failed to set theme config:', error);
    }
  }

  async render(type: string, content: string | object, options: RenderOptions = {}): Promise<RenderResult> {
    // Generate cache key
    const inputString = typeof content === 'string' ? content : JSON.stringify(content);
    const contentKey = inputString + JSON.stringify(options);
    const cacheType = `${type.toUpperCase()}_PNG`;
    const cacheKey = await this.cache.generateKey(contentKey, cacheType, this.themeConfig);

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as RenderResult;
    }

    // Send render request to background
    const message: RenderDiagramMessage = {
      action: 'RENDER_DIAGRAM',
      renderType: type,
      input: content,
      themeConfig: this.themeConfig,
      extraParams: options
    };

    const response = await this.messageService.send<RenderResult>(message);

    if (response.error) {
      throw new Error(response.error);
    }

    // Cache the result asynchronously (don't wait)
    this.cache.set(cacheKey, response, cacheType).catch(() => {});

    return response as RenderResult;
  }
}

// ============================================================================
// Chrome I18n Service
// Extends BaseI18nService for common message lookup logic
// ============================================================================

export class ChromeI18nService extends BaseI18nService {
  private storageService: ChromeStorageService;
  private resourceService: ChromeResourceService;

  constructor(storageService: ChromeStorageService, resourceService: ChromeResourceService) {
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
  public readonly storage: ChromeStorageService;
  public readonly file: ChromeFileService;
  public readonly resource: ChromeResourceService;
  public readonly message: ChromeMessageService;
  public readonly cache: ChromeCacheService;
  public readonly renderer: ChromeRendererService;
  public readonly i18n: ChromeI18nService;

  constructor() {
    // Initialize services
    this.storage = new ChromeStorageService();
    this.file = new ChromeFileService();
    this.resource = new ChromeResourceService();
    this.message = new ChromeMessageService();
    this.cache = new ChromeCacheService(this.message);
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
