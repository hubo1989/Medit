/**
 * ThemeService - Manages application theme with system preference support
 * Handles 'light', 'dark', and 'auto' theme modes
 */

import { PreferencesService } from './preferences-service.js';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeServiceConfig {
  preferences: PreferencesService;
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

/**
 * Get system preferred color scheme
 */
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * ThemeService class for managing application themes
 */
export class ThemeService {
  private _preferences: PreferencesService;
  private _onThemeChange?: (theme: 'light' | 'dark') => void;
  private _currentTheme: 'light' | 'dark' = 'light';
  private _systemMediaQuery: MediaQueryList | null = null;
  private _unsubscribe: (() => void) | null = null;

  constructor(config: ThemeServiceConfig) {
    this._preferences = config.preferences;
    this._onThemeChange = config.onThemeChange;

    this._init();
  }

  /**
   * Initialize theme service
   */
  private _init(): void {
    // Register theme preference definition
    this._preferences.registerDefinition('general.theme', {
      defaultValue: 'auto' as ThemeMode,
      validate: (value): boolean => {
        return typeof value === 'string' && ['light', 'dark', 'auto'].includes(value);
      },
      transform: (value): ThemeMode => {
        const valid = ['light', 'dark', 'auto'];
        return valid.includes(value as string) ? (value as ThemeMode) : 'auto';
      },
    });

    // Setup system theme listener
    this._setupSystemThemeListener();

    // Apply initial theme
    this._applyTheme();

    // Subscribe to preference changes
    this._unsubscribe = this._preferences.onChange('general.theme', () => {
      this._applyTheme();
    });
  }

  /**
   * Setup listener for system color scheme changes
   */
  private _setupSystemThemeListener(): void {
    if (typeof window === 'undefined') return;

    this._systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Use addEventListener with 'change' event (modern API)
    this._systemMediaQuery.addEventListener('change', () => {
      const themeMode = this._preferences.get<ThemeMode>('general.theme');
      if (themeMode === 'auto') {
        this._applyTheme();
      }
    });
  }

  /**
   * Apply theme based on current preference
   */
  private _applyTheme(): void {
    const themeMode = this._preferences.get<ThemeMode>('general.theme');
    const effectiveTheme = themeMode === 'auto' ? getSystemTheme() : themeMode;

    if (this._currentTheme !== effectiveTheme) {
      this._currentTheme = effectiveTheme;
      this._updateDocumentTheme(effectiveTheme);
      this._onThemeChange?.(effectiveTheme);
    }
  }

  /**
   * Update document theme attribute
   */
  private _updateDocumentTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Get current effective theme (resolved from auto)
   */
  getCurrentTheme(): 'light' | 'dark' {
    return this._currentTheme;
  }

  /**
   * Get current theme mode (light/dark/auto)
   */
  getThemeMode(): ThemeMode {
    return this._preferences.get<ThemeMode>('general.theme');
  }

  /**
   * Set theme mode
   */
  setThemeMode(mode: ThemeMode): void {
    this._preferences.set('general.theme', mode);
  }

  /**
   * Toggle between light and dark (cycles through modes)
   */
  toggleTheme(): void {
    const current = this.getThemeMode();
    const modes: ThemeMode[] = ['light', 'dark', 'auto'];
    const nextIndex = (modes.indexOf(current) + 1) % modes.length;
    this.setThemeMode(modes[nextIndex]);
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }

    if (this._systemMediaQuery) {
      this._systemMediaQuery.removeEventListener('change', () => {
        // Cleanup handled by reference
      });
      this._systemMediaQuery = null;
    }
  }
}

export default ThemeService;
