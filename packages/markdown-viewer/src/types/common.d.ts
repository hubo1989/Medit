// Async Task types
export type TaskStatus = 'ready' | 'fetching' | 'error' | 'completed';

export interface AsyncTask {
  id: string;
  callback: (data: unknown) => Promise<unknown>;
  data: Record<string, unknown>;
  type: string;
  status: TaskStatus;
  error: Error | null;
  setReady: () => void;
  setError: (error: Error) => void;
}

// Plugin types
export interface IPlugin {
  type: string;
  match(node: unknown): boolean;
  transform(node: unknown, context: unknown): string;
  render?(data: unknown): Promise<string>;
}

// Renderer types
export interface IRenderer {
  type: string;
  match(node: unknown): boolean;
  render(node: unknown, options?: unknown): Promise<string>;
}

// Cache entry types
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  size?: number;
}

// File state types
export interface FileState {
  url: string;
  title: string;
  rendered: boolean;
  currentTheme: string;
  currentLocale: string;
}
