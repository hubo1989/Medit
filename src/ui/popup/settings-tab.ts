/**
 * Settings Tab Manager
 * Manages settings panel functionality including themes and cache settings
 */

import Localization, { DEFAULT_SETTING_LOCALE } from '../../utils/localization';
import { translate, applyI18nText, getUiLocale } from './i18n-helpers';

/**
 * Theme info from registry
 */
interface ThemeRegistryInfo {
  id: string;
  file: string;
  category: string;
  featured?: boolean;
}

/**
 * Theme definition loaded from preset file
 */
interface ThemeDefinition {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  category: string;
  featured: boolean;
}

/**
 * Theme category info
 */
interface ThemeCategoryInfo {
  name: string;
  name_en: string;
  order?: number;
}

/**
 * Theme registry structure
 */
interface ThemeRegistry {
  categories: Record<string, ThemeCategoryInfo>;
  themes: ThemeRegistryInfo[];
}

/**
 * User settings structure
 */
interface Settings {
  maxCacheItems: number;
  preferredLocale: string;
}

/**
 * Settings tab manager options
 */
interface SettingsTabManagerOptions {
  showMessage: (message: string, type: 'success' | 'error' | 'info') => void;
  showConfirm: (title: string, message: string) => Promise<boolean>;
  onReloadCacheData?: () => void;
}

/**
 * Settings tab manager interface
 */
export interface SettingsTabManager {
  loadSettings: () => Promise<void>;
  loadSettingsUI: () => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
  getSettings: () => Settings;
  loadThemes: () => Promise<void>;
}

/**
 * Create a settings tab manager
 * @param options - Configuration options
 * @returns Settings tab manager instance
 */
export function createSettingsTabManager({
  showMessage,
  showConfirm,
  onReloadCacheData
}: SettingsTabManagerOptions): SettingsTabManager {
  let settings: Settings = {
    maxCacheItems: 1000,
    preferredLocale: DEFAULT_SETTING_LOCALE
  };
  let currentTheme = 'default';
  let themes: ThemeDefinition[] = [];
  let registry: ThemeRegistry | null = null;

  /**
   * Load settings from storage
   */
  async function loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['markdownViewerSettings']);
      if (result.markdownViewerSettings) {
        settings = { ...settings, ...result.markdownViewerSettings };
      }

      // Load selected theme
      const themeResult = await chrome.storage.local.get(['selectedTheme']);
      currentTheme = (themeResult.selectedTheme as string) || 'default';
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Load settings into UI elements
   */
  function loadSettingsUI(): void {
    // Max cache items
    const maxCacheItemsEl = document.getElementById('max-cache-items') as HTMLInputElement | null;
    if (maxCacheItemsEl) {
      maxCacheItemsEl.value = String(settings.maxCacheItems);
    }

    // Locale selector
    const localeSelect = document.getElementById('interface-language') as HTMLSelectElement | null;
    if (localeSelect) {
      localeSelect.value = settings.preferredLocale || DEFAULT_SETTING_LOCALE;

      // Add change listener for immediate language change (only once)
      if (!localeSelect.dataset.listenerAdded) {
        localeSelect.dataset.listenerAdded = 'true';
        localeSelect.addEventListener('change', async (event) => {
          const target = event.target as HTMLSelectElement;
          const newLocale = target.value;
          try {
            settings.preferredLocale = newLocale;
            await chrome.storage.local.set({
              markdownViewerSettings: settings
            });

            await Localization.setPreferredLocale(newLocale);
            chrome.runtime.sendMessage({ type: 'localeChanged', locale: newLocale }).catch(() => { });
            applyI18nText();

            // Reload themes to update names
            loadThemes();

            showMessage(translate('settings_language_changed'), 'success');
          } catch (error) {
            console.error('Failed to change language:', error);
            showMessage(translate('settings_save_failed'), 'error');
          }
        });
      }
    }

    // Load themes
    loadThemes();
  }

  /**
   * Load available themes from registry
   */
  async function loadThemes(): Promise<void> {
    try {
      // Load theme registry
      const registryResponse = await fetch(chrome.runtime.getURL('themes/registry.json'));
      registry = await registryResponse.json();

      // Load all theme metadata
      const themePromises = registry!.themes.map(async (themeInfo) => {
        try {
          const response = await fetch(chrome.runtime.getURL(`themes/presets/${themeInfo.file}`));
          const theme = await response.json();

          return {
            id: theme.id,
            name: theme.name,
            name_en: theme.name_en,
            description: theme.description,
            description_en: theme.description_en,
            category: themeInfo.category,
            featured: themeInfo.featured || false
          } as ThemeDefinition;
        } catch (error) {
          console.error(`Failed to load theme ${themeInfo.id}:`, error);
          return null;
        }
      });

      themes = (await Promise.all(themePromises)).filter((t): t is ThemeDefinition => t !== null);

      // Populate theme selector with categories
      const themeSelector = document.getElementById('theme-selector') as HTMLSelectElement | null;
      if (themeSelector) {
        themeSelector.innerHTML = '';

        // Get current locale to determine which name to use
        const locale = getUiLocale();
        const useEnglish = !locale.startsWith('zh');

        // Group themes by category
        const themesByCategory: Record<string, ThemeDefinition[]> = {};
        themes.forEach(theme => {
          if (!themesByCategory[theme.category]) {
            themesByCategory[theme.category] = [];
          }
          themesByCategory[theme.category].push(theme);
        });

        // Sort categories by their order property
        const sortedCategoryIds = Object.keys(registry!.categories)
          .sort((a, b) => (registry!.categories[a].order || 0) - (registry!.categories[b].order || 0));

        // Add themes grouped by category (in sorted order)
        sortedCategoryIds.forEach(categoryId => {
          const categoryInfo = registry!.categories[categoryId];
          if (!categoryInfo) return;

          const categoryThemes = themesByCategory[categoryId];
          if (!categoryThemes || categoryThemes.length === 0) return;

          const categoryGroup = document.createElement('optgroup');
          categoryGroup.label = useEnglish ? categoryInfo.name_en : categoryInfo.name;

          categoryThemes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = useEnglish ? theme.name_en : theme.name;

            if (theme.id === currentTheme) {
              option.selected = true;
            }

            categoryGroup.appendChild(option);
          });

          themeSelector.appendChild(categoryGroup);
        });

        // Update description
        updateThemeDescription(currentTheme);

        // Add change listener
        themeSelector.addEventListener('change', (event) => {
          const target = event.target as HTMLSelectElement;
          switchTheme(target.value);
        });
      }
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
  }

  /**
   * Update theme description display
   * @param themeId - Theme ID
   */
  function updateThemeDescription(themeId: string): void {
    const theme = themes.find(t => t.id === themeId);
    const descEl = document.getElementById('theme-description');

    if (descEl && theme) {
      const locale = getUiLocale();
      const useEnglish = !locale.startsWith('zh');
      descEl.textContent = useEnglish ? theme.description_en : theme.description;
    }
  }

  /**
   * Switch to a different theme
   * @param themeId - Theme ID to switch to
   */
  async function switchTheme(themeId: string): Promise<void> {
    try {
      // Save theme selection (use local storage to match theme-manager)
      await chrome.storage.local.set({ selectedTheme: themeId });
      currentTheme = themeId;

      // Update description
      updateThemeDescription(themeId);

      // Notify all tabs to reload theme
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'themeChanged',
            themeId: themeId
          }).catch(() => {
            // Ignore errors for non-markdown tabs
          });
        }
      });

      showMessage(translate('settings_theme_changed'), 'success');
    } catch (error) {
      console.error('Failed to switch theme:', error);
      showMessage('Failed to switch theme', 'error');
    }
  }

  /**
   * Save settings to storage
   */
  async function saveSettings(): Promise<void> {
    try {
      const maxCacheItemsEl = document.getElementById('max-cache-items') as HTMLInputElement | null;
      const maxCacheItems = parseInt(maxCacheItemsEl?.value || '1000', 10);

      if (Number.isNaN(maxCacheItems) || maxCacheItems < 100 || maxCacheItems > 5000) {
        showMessage(
          translate('settings_invalid_max_cache', ['100', '5000']),
          'error'
        );
        return;
      }

      settings.maxCacheItems = maxCacheItems;

      await chrome.storage.local.set({
        markdownViewerSettings: settings
      });

      if (onReloadCacheData) {
        onReloadCacheData();
      }

      // No need to update cacheManager.maxItems here
      // Background script will update it via storage.onChanged listener

      showMessage(translate('settings_save_success'), 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showMessage(translate('settings_save_failed'), 'error');
    }
  }

  /**
   * Reset settings to defaults
   */
  async function resetSettings(): Promise<void> {
    const confirmMessage = translate('settings_reset_confirm');
    const confirmed = await showConfirm(translate('settings_reset_btn'), confirmMessage);

    if (!confirmed) {
      return;
    }

    try {
      settings = {
        maxCacheItems: 1000,
        preferredLocale: DEFAULT_SETTING_LOCALE
      };

      await chrome.storage.local.set({
        markdownViewerSettings: settings
      });

      await Localization.setPreferredLocale(DEFAULT_SETTING_LOCALE);
      chrome.runtime.sendMessage({ type: 'localeChanged', locale: DEFAULT_SETTING_LOCALE }).catch(() => { });
      applyI18nText();

      if (onReloadCacheData) {
        onReloadCacheData();
      }

      loadSettingsUI();
      showMessage(translate('settings_reset_success'), 'success');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showMessage(translate('settings_reset_failed'), 'error');
    }
  }

  /**
   * Get current settings
   * @returns Current settings
   */
  function getSettings(): Settings {
    return { ...settings };
  }

  return {
    loadSettings,
    loadSettingsUI,
    saveSettings,
    resetSettings,
    getSettings,
    loadThemes
  };
}
