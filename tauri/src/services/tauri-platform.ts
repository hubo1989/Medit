/**
 * Tauri Platform API Implementation
 * 
 * Simplified implementation for Tauri desktop application.
 * Uses direct library imports instead of complex render host architecture.
 */

import type { 
  PlatformAPI, 
  CacheService, 
  RendererService, 
  StorageService, 
  FileService, 
  FileStateService, 
  ResourceService, 
  I18nService, 
  MessageService,
  SimpleCacheStats,
  ISettingsService,
  SettingTypes,
  SettingKey,
  FileState,
  RendererThemeConfig,
  RenderResult,
  PluginRenderer,
  PluginRenderResult
} from '../types/shared.d.ts';
import { createLogger } from '../utils/logger.js';
import { CACHE_CONFIG, RENDER_CONFIG } from '../utils/config.js';

const logger = createLogger('TauriPlatform');

/**
 * Error thrown when a feature is not yet implemented
 */
export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`Feature not implemented: ${feature}`);
    this.name = 'NotImplementedError';
  }
}

// Simple translations for platform service
const translations: Record<string, Record<string, string>> = {
  en: {},
  zh: {}
};

// ============================================================================
// Tauri Settings Service
// ============================================================================

class TauriSettingsService implements ISettingsService {
  private storageKey = 'medit-settings';
  private listeners: Array<(key: SettingKey, value: unknown) => void> = [];
  
  private defaults: SettingTypes = {
    themeId: 'default',
    tableMergeEmpty: true,
    tableLayout: 'center' as const,
    frontmatterDisplay: 'hide' as const,
    preferredLocale: 'auto',
    docxHrDisplay: 'hide' as const,
    docxEmojiStyle: 'system' as const,
  };

  private getSettings(): SettingTypes {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return { ...this.defaults, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return { ...this.defaults };
  }

  async get<K extends SettingKey>(key: K): Promise<SettingTypes[K]> {
    const settings = this.getSettings();
    return settings[key];
  }

  async set<K extends SettingKey>(
    key: K,
    value: SettingTypes[K],
    _options?: { refresh?: boolean }
  ): Promise<void> {
    const settings = this.getSettings();
    settings[key] = value;
    localStorage.setItem(this.storageKey, JSON.stringify(settings));
    this.listeners.forEach(listener => listener(key, value));
  }

  async getAll(): Promise<SettingTypes> {
    return this.getSettings();
  }

  onChange(listener: (key: SettingKey, value: unknown) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }
}

// ============================================================================
// Tauri Cache Service (IndexedDB-based)
// ============================================================================

class TauriCacheService implements CacheService {
  private dbName = CACHE_CONFIG.dbName;
  private storeName = CACHE_CONFIG.storeName;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    // Prevent concurrent initialization
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => {
        const error = request.error;
        logger.error('Failed to open IndexedDB:', error?.message || 'Unknown error');
        this.initPromise = null;
        reject(new Error(`Failed to open cache database: ${error?.message || 'Unknown error'}`));
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        logger.debug('IndexedDB connection established');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
          logger.debug('Created object store:', this.storeName);
        }
      };
    });
    
    return this.initPromise;
  }

  async init(): Promise<void> {
    await this.getDB();
  }

  async calculateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async generateKey(content: string, type: string, themeConfig?: RendererThemeConfig | null): Promise<string> {
    let keyContent = content;
    if (themeConfig) {
      const fontFamily = themeConfig.fontFamily || '';
      const fontSize = themeConfig.fontSize || '';
      const diagramStyle = themeConfig.diagramStyle || 'normal';
      const background = themeConfig.background || '';
      // Include background in cache key to differentiate dark/light mode
      keyContent = `${content}_font:${fontFamily}_size:${fontSize}_style:${diagramStyle}_bg:${background}`;
    }
    const hash = await this.calculateHash(keyContent);
    return `${hash}_${type}`;
  }

  async get(key: string): Promise<unknown> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => {
          logger.warn('Failed to get cache item:', key);
          resolve(null);
        };
      });
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, _type?: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const request = store.put(value, key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          logger.warn('Failed to set cache item:', key);
          resolve(false);
        };
      });
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const request = store.clear();
        request.onsuccess = () => {
          logger.info('Cache cleared');
          resolve(true);
        };
        request.onerror = () => {
          logger.warn('Failed to clear cache');
          resolve(false);
        };
      });
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  async getStats(): Promise<SimpleCacheStats | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const countRequest = store.count();
        countRequest.onsuccess = () => {
          resolve({ 
            itemCount: countRequest.result, 
            maxItems: CACHE_CONFIG.maxItems,
            totalSize: 0,
            totalSizeMB: '0',
            items: []
          });
        };
        countRequest.onerror = () => {
          logger.warn('Failed to get cache stats');
          resolve(null);
        };
      });
    } catch (error) {
      logger.error('Cache getStats error:', error);
      return null;
    }
  }
}

// ============================================================================
// Tauri Renderer Service (simplified direct rendering)
// ============================================================================

const rendererLogger = createLogger('TauriRenderer');

class TauriRendererService implements RendererService {
  private themeConfig: RendererThemeConfig | null = null;
  private cache: TauriCacheService;
  private mermaid: typeof import('mermaid').default | null = null;

  constructor(cache: TauriCacheService) {
    this.cache = cache;
  }

  async init(): Promise<void> {
    // Initialize mermaid lazily
  }

  private async ensureMermaid(): Promise<typeof import('mermaid').default> {
    if (!this.mermaid) {
      const mermaidModule = await import('mermaid');
      this.mermaid = mermaidModule.default;
    }
    return this.mermaid;
  }

  /**
   * Apply theme configuration to mermaid before each render
   * This follows the main project's approach in MermaidRenderer.applyThemeConfig()
   */
  private applyMermaidTheme(mermaid: typeof import('mermaid').default): void {
    const isDark = this.isDarkMode();
    const isHandDrawn = this.themeConfig?.diagramStyle === 'handDrawn';
    const fontFamily = this.themeConfig?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      look: isHandDrawn ? 'handDrawn' : 'classic',
      theme: isDark ? 'dark' : 'default',
      themeVariables: {
        fontFamily: fontFamily,
        background: 'transparent'
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      }
    });
    rendererLogger.debug('Mermaid theme applied:', isDark ? 'dark' : 'default');
  }

  /**
   * Detect if dark mode based on theme config background color
   */
  private isDarkMode(): boolean {
    const bg = this.themeConfig?.background;
    if (!bg) {
      // Fallback to CSS media query
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    // Simple heuristic: dark if background is darker than threshold
    const hex = bg.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < RENDER_CONFIG.darkModeBrightnessThreshold;
  }

  setThemeConfig(config: RendererThemeConfig): void {
    const wasDark = this.themeConfig ? this.isDarkMode() : null;
    this.themeConfig = config;
    const isDark = this.isDarkMode();
    
    rendererLogger.debug('setThemeConfig:', {
      fontFamily: config.fontFamily,
      background: config.background,
      foreground: config.foreground,
      isDark
    });
    
    // Clear cache when theme changes (light <-> dark) to force re-render
    if (wasDark !== null && wasDark !== isDark) {
      this.cache.clear().catch(() => {});
      rendererLogger.info('Cache cleared due to theme change');
    }
  }

  getThemeConfig(): RendererThemeConfig | null {
    return this.themeConfig;
  }

  async render(type: string, content: string | object): Promise<RenderResult> {
    // Check cache first
    const cacheKey = await this.cache.generateKey(
      typeof content === 'string' ? content : JSON.stringify(content),
      `${type.toUpperCase()}_PNG`,
      this.themeConfig
    );
    
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      rendererLogger.debug('Cache hit for:', type);
      return cached as RenderResult;
    }

    let result: RenderResult;

    try {
      switch (type) {
        case 'mermaid':
          result = await this.renderMermaid(typeof content === 'string' ? content : JSON.stringify(content));
          break;
        case 'vega':
        case 'vega-lite':
          result = await this.renderVega(content as object);
          break;
        case 'dot':
        case 'graphviz':
          result = await this.renderDot(typeof content === 'string' ? content : JSON.stringify(content));
          break;
        default:
          // Return error for unsupported types
          result = {
            base64: '',
            width: RENDER_CONFIG.defaultWidth,
            height: 100,
            format: 'png',
            success: false,
            error: `Unsupported render type: ${type}`
          };
      }
    } catch (err) {
      rendererLogger.error('Render error:', err);
      result = {
        base64: '',
        width: RENDER_CONFIG.defaultWidth,
        height: 100,
        format: 'png',
        success: false,
        error: String(err)
      };
    }

    // Cache result only if successful
    if (result.success !== false) {
      await this.cache.set(cacheKey, result, `${type.toUpperCase()}_PNG`);
    }
    
    return result;
  }

  private async renderMermaid(code: string): Promise<RenderResult> {
    const mermaid = await this.ensureMermaid();
    
    // Apply theme configuration before each render (same as main project's MermaidRenderer)
    this.applyMermaidTheme(mermaid);
    
    const id = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    const { svg } = await mermaid.render(id, code);
    
    // Parse SVG dimensions from viewBox
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      throw new Error('Invalid SVG generated');
    }
    
    let width: number = RENDER_CONFIG.mermaidDefaultWidth;
    let height: number = RENDER_CONFIG.mermaidDefaultHeight;
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+/);
      width = Math.ceil(parseFloat(parts[2]) || RENDER_CONFIG.mermaidDefaultWidth);
      height = Math.ceil(parseFloat(parts[3]) || RENDER_CONFIG.mermaidDefaultHeight);
    }
    
    // Scale factor (same as main project)
    const scale = RENDER_CONFIG.scaleFactor;
    const canvasWidth = width * scale;
    const canvasHeight = height * scale;
    
    // Render SVG to canvas using base64 data URL (same approach as main project's BaseRenderer)
    const canvas = await this.renderSvgToCanvas(svg, canvasWidth, canvasHeight);
    
    // Convert canvas to PNG
    const pngDataUrl = canvas.toDataURL('image/png', 1.0);
    const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');
    
    rendererLogger.debug('Mermaid rendered to PNG:', { id, width: canvasWidth, height: canvasHeight });
    
    return {
      base64: base64Data,
      width: canvasWidth,
      height: canvasHeight,
      format: 'png'
    };
  }

  /**
   * Render SVG directly to canvas using base64 data URL
   * This follows the same approach as main project's BaseRenderer.renderSvgToCanvas()
   */
  private async renderSvgToCanvas(svgContent: string, width: number, height: number): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Use base64 data URL (same as main project) to avoid blob URL security issues
      const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
      img.src = `data:image/svg+xml;base64,${base64Svg}`;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load SVG into image for rendering'));
      };
    });
  }

  private async renderVega(_spec: object): Promise<RenderResult> {
    // Vega rendering not yet implemented - return error result
    rendererLogger.warn('Vega rendering not yet implemented in Tauri');
    return {
      base64: '',
      width: RENDER_CONFIG.defaultWidth,
      height: RENDER_CONFIG.defaultHeight,
      format: 'png',
      success: false,
      error: 'Vega rendering not yet implemented in Tauri platform'
    };
  }

  private async renderDot(_code: string): Promise<RenderResult> {
    // Graphviz rendering not yet implemented - return error result
    rendererLogger.warn('Graphviz rendering not yet implemented in Tauri');
    return {
      base64: '',
      width: RENDER_CONFIG.defaultWidth,
      height: RENDER_CONFIG.defaultHeight,
      format: 'png',
      success: false,
      error: 'Graphviz rendering not yet implemented in Tauri platform'
    };
  }
}

// ============================================================================
// Tauri Storage Service
// ============================================================================

class TauriStorageService implements StorageService {
  async get(keys: string[]): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      }
    }
    return result;
  }

  async set(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  async remove(keys: string[]): Promise<void> {
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }
}

// ============================================================================
// Tauri File Service
// ============================================================================

class TauriFileService implements FileService {
  async download(blob: Blob | string, filename: string, _options?: { saveAs?: boolean }): Promise<void> {
    const url = typeof blob === 'string' ? blob : URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof blob !== 'string') {
      URL.revokeObjectURL(url);
    }
  }
}

// ============================================================================
// Tauri File State Service
// ============================================================================

class TauriFileStateService implements FileStateService {
  private storageKey = 'medit-file-states';

  private getStates(): Record<string, FileState> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  async get(url: string): Promise<FileState> {
    const states = this.getStates();
    return states[url] ?? { scrollLine: 0 };
  }

  set(url: string, state: FileState): void {
    const states = this.getStates();
    states[url] = state;
    localStorage.setItem(this.storageKey, JSON.stringify(states));
  }

  async clear(url: string): Promise<void> {
    const states = this.getStates();
    delete states[url];
    localStorage.setItem(this.storageKey, JSON.stringify(states));
  }
}

// ============================================================================
// Tauri Resource Service
// ============================================================================

class TauriResourceService implements ResourceService {
  async fetch(path: string): Promise<string> {
    const response = await fetch(path);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body}`);
    }
    return response.text();
  }

  getURL(path: string): string {
    return path;
  }
}

// ============================================================================
// Tauri I18n Service
// ============================================================================

class TauriI18nService implements I18nService {
  private locale: string;

  constructor() {
    this.locale = navigator.language || 'en';
  }

  translate(key: string, substitutions?: string | string[]): string {
    const lang = this.locale.startsWith('zh') ? 'zh' : 'en';
    const dict = translations[lang as keyof typeof translations] || translations.en;
    let text = (dict as Record<string, string>)[key] || key;
    
    if (substitutions) {
      const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
      subs.forEach((sub, i) => {
        text = text.replace(new RegExp(`\\$${i + 1}`, 'g'), sub);
      });
    }
    
    return text;
  }

  getUILanguage(): string {
    return this.locale;
  }

  async setLocale(locale: string): Promise<void> {
    this.locale = locale;
  }
}

// ============================================================================
// Tauri Message Service
// ============================================================================

class TauriMessageService implements MessageService {
  private listeners: Array<(message: unknown) => void> = [];

  async send(_message: Record<string, unknown>): Promise<unknown> {
    return undefined;
  }

  addListener(handler: (message: unknown) => void): void {
    this.listeners.push(handler);
  }
}

// ============================================================================
// Create Tauri Platform API
// ============================================================================

export function createTauriPlatform(): PlatformAPI {
  const cache = new TauriCacheService();
  const renderer = new TauriRendererService(cache);

  return {
    platform: 'tauri' as PlatformAPI['platform'],
    cache,
    renderer,
    storage: new TauriStorageService(),
    file: new TauriFileService(),
    fileState: new TauriFileStateService(),
    resource: new TauriResourceService(),
    i18n: new TauriI18nService(),
    message: new TauriMessageService(),
    settings: new TauriSettingsService(),
  };
}

/**
 * Create a PluginRenderer from a PlatformAPI
 * This wraps the platform's renderer service to provide the PluginRenderer interface
 */
export function createPluginRenderer(platform: PlatformAPI): PluginRenderer {
  return {
    async render(type: string, content: string | object): Promise<PluginRenderResult | null> {
      const result = await platform.renderer.render(type, content);
      if (result.success === false) {
        return {
          base64: '',
          width: result.width,
          height: result.height,
          format: result.format,
          error: result.error,
        };
      }
      return {
        base64: result.base64,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    },
  };
}
