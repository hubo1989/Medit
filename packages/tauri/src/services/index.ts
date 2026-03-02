export {
  PreferencesService,
  type PreferenceValue,
  type PreferenceDefinition,
  type PreferenceDefinitions,
  type PreferenceChangeCallback,
  type PreferencesServiceConfig,
} from './preferences-service.js';

export {
  ThemeService,
  type ThemeMode,
  type ThemeServiceConfig,
} from './theme-service.js';

export {
  SyncScrollService,
  type SyncScrollServiceConfig,
} from './sync-scroll-service.js';

export {
  TabManager,
  default as TabManagerDefault,
} from './tab-manager.js';
export type {
  TabState,
  TabManagerConfig,
  PersistedTabState,
  TabChangeListener,
  CloseResult,
  CreateTabOptions,
  TabChangeEvent,
  TabChangeEventType,
  PersistedTabManagerState,
} from '../types/tab.js';
