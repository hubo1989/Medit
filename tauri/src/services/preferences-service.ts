/**
 * PreferencesService - Unified service for managing user preferences
 * Provides type-safe settings with localStorage persistence and event notifications
 */

export type PreferenceValue = string | number | boolean | object | null;

export interface PreferenceDefinition<T extends PreferenceValue = PreferenceValue> {
  /** Default value for the preference */
  defaultValue: T;
  /** Validator function to validate values */
  validate?: (value: unknown) => boolean;
  /** Transform function to normalize values */
  transform?: (value: unknown) => T;
}

export type PreferenceDefinitions = Record<string, PreferenceDefinition>;

export type PreferenceChangeCallback<T extends PreferenceValue = PreferenceValue> = (
  key: string,
  newValue: T,
  oldValue: T
) => void;

export interface PreferencesServiceConfig {
  /** Storage key prefix for localStorage */
  storageKeyPrefix?: string;
  /** Preference definitions with defaults and validation */
  definitions?: PreferenceDefinitions;
}

const DEFAULT_STORAGE_KEY_PREFIX = 'medit:pref:';

export class PreferencesService {
  private _storageKeyPrefix: string;
  private _definitions: PreferenceDefinitions;
  private _listeners: Map<string, Set<PreferenceChangeCallback>> = new Map();
  private _globalListeners: Set<PreferenceChangeCallback> = new Set();
  private _cache: Map<string, PreferenceValue> = new Map();

  constructor(config: PreferencesServiceConfig = {}) {
    this._storageKeyPrefix = config.storageKeyPrefix ?? DEFAULT_STORAGE_KEY_PREFIX;
    this._definitions = config.definitions ?? {};
    this._preloadCache();
  }

  /**
   * Get a preference value with type safety
   * Returns default value if not set or invalid
   */
  get<T extends PreferenceValue>(key: string): T {
    const definition = this._definitions[key];
    const defaultValue = (definition?.defaultValue ?? null) as T;

    // Check cache first
    if (this._cache.has(key)) {
      return this._cache.get(key) as T;
    }

    // Load from storage
    const value = this._loadFromStorage(key);
    if (value !== undefined) {
      this._cache.set(key, value);
      return value as T;
    }

    return defaultValue;
  }

  /**
   * Set a preference value
   * Triggers change events if value actually changes
   */
  set<T extends PreferenceValue>(key: string, value: T): boolean {
    const definition = this._definitions[key];
    const oldValue = this.get<T>(key);

    // Validate if validator exists
    if (definition?.validate && !definition.validate(value)) {
      console.warn(`[PreferencesService] Validation failed for "${key}":`, value);
      return false;
    }

    // Transform if transformer exists
    const finalValue = definition?.transform ? (definition.transform(value) as T) : value;

    // Skip if value hasn't changed
    if (JSON.stringify(oldValue) === JSON.stringify(finalValue)) {
      return true;
    }

    // Update cache and storage
    this._cache.set(key, finalValue);
    this._saveToStorage(key, finalValue);

    // Notify listeners
    this._notifyListeners(key, finalValue, oldValue);

    return true;
  }

  /**
   * Reset a preference to its default value
   */
  reset(key: string): boolean {
    const definition = this._definitions[key];
    if (!definition) {
      console.warn(`[PreferencesService] No definition found for "${key}"`);
      return false;
    }

    return this.set(key, definition.defaultValue);
  }

  /**
   * Reset all preferences to their default values
   */
  resetAll(): void {
    for (const key of Object.keys(this._definitions)) {
      this.reset(key);
    }
  }

  /**
   * Check if a preference exists (has been set or has default)
   */
  has(key: string): boolean {
    return this._cache.has(key) || this._definitions[key] !== undefined;
  }

  /**
   * Remove a preference value
   */
  remove(key: string): boolean {
    const oldValue = this.get(key);

    this._cache.delete(key);
    this._removeFromStorage(key);

    // Notify with null as new value
    this._notifyListeners(key, null, oldValue);

    return true;
  }

  /**
   * Subscribe to changes for a specific preference key
   * Returns unsubscribe function
   */
  onChange<T extends PreferenceValue>(
    key: string,
    callback: PreferenceChangeCallback<T>
  ): () => void {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }

    const listeners = this._listeners.get(key)!;
    listeners.add(callback as PreferenceChangeCallback);

    return () => {
      listeners.delete(callback as PreferenceChangeCallback);
      if (listeners.size === 0) {
        this._listeners.delete(key);
      }
    };
  }

  /**
   * Subscribe to all preference changes
   * Returns unsubscribe function
   */
  onAnyChange(callback: PreferenceChangeCallback): () => void {
    this._globalListeners.add(callback);

    return () => {
      this._globalListeners.delete(callback);
    };
  }

  /**
   * Get all preference keys
   */
  getKeys(): string[] {
    const keys = new Set<string>();

    // Add defined keys
    for (const key of Object.keys(this._definitions)) {
      keys.add(key);
    }

    // Add cached keys
    for (const key of this._cache.keys()) {
      keys.add(key);
    }

    // Add keys from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey?.startsWith(this._storageKeyPrefix)) {
          keys.add(storageKey.slice(this._storageKeyPrefix.length));
        }
      }
    }

    return Array.from(keys);
  }

  /**
   * Get all preferences as an object
   */
  getAll(): Record<string, PreferenceValue> {
    const result: Record<string, PreferenceValue> = {};
    const keys = this.getKeys();

    for (const key of keys) {
      result[key] = this.get(key);
    }

    return result;
  }

  /**
   * Register a new preference definition
   */
  registerDefinition<T extends PreferenceValue>(key: string, definition: PreferenceDefinition<T>): void {
    this._definitions[key] = definition;

    // If no value is set, initialize with default
    if (!this._cache.has(key) && !this._loadFromStorage(key)) {
      this._cache.set(key, definition.defaultValue);
    }
  }

  /**
   * Update multiple preferences at once
   */
  setMultiple(values: Record<string, PreferenceValue>): void {
    for (const [key, value] of Object.entries(values)) {
      this.set(key, value);
    }
  }

  /**
   * Clear all preferences
   */
  clear(): void {
    const keys = this.getKeys();

    for (const key of keys) {
      this.remove(key);
    }

    this._cache.clear();
  }

  /**
   * Dispose the service and cleanup
   */
  dispose(): void {
    this._listeners.clear();
    this._globalListeners.clear();
    this._cache.clear();
  }

  /**
   * Preload all preferences from storage into cache
   */
  private _preloadCache(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey?.startsWith(this._storageKeyPrefix)) {
          const key = storageKey.slice(this._storageKeyPrefix.length);
          const value = this._loadFromStorage(key);
          if (value !== undefined) {
            this._cache.set(key, value);
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Load a preference value from localStorage
   */
  private _loadFromStorage(key: string): PreferenceValue | undefined {
    if (typeof window === 'undefined' || !window.localStorage) {
      return undefined;
    }

    try {
      const storageKey = this._getStorageKey(key);
      const stored = localStorage.getItem(storageKey);

      if (stored === null) {
        return undefined;
      }

      return JSON.parse(stored) as PreferenceValue;
    } catch {
      // Ignore parse/storage errors
      return undefined;
    }
  }

  /**
   * Save a preference value to localStorage
   */
  private _saveToStorage(key: string, value: PreferenceValue): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const storageKey = this._getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }

  /**
   * Remove a preference value from localStorage
   */
  private _removeFromStorage(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const storageKey = this._getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Get the full storage key for a preference
   */
  private _getStorageKey(key: string): string {
    return `${this._storageKeyPrefix}${key}`;
  }

  /**
   * Notify listeners of a preference change
   */
  private _notifyListeners<T extends PreferenceValue>(
    key: string,
    newValue: T,
    oldValue: T
  ): void {
    // Notify key-specific listeners
    const keyListeners = this._listeners.get(key);
    if (keyListeners) {
      for (const callback of keyListeners) {
        try {
          callback(key, newValue, oldValue);
        } catch (error) {
          console.error(`[PreferencesService] Error in listener for "${key}":`, error);
        }
      }
    }

    // Notify global listeners
    for (const callback of this._globalListeners) {
      try {
        callback(key, newValue, oldValue);
      } catch (error) {
        console.error('[PreferencesService] Error in global listener:', error);
      }
    }
  }
}

export default PreferencesService;
