// Async Task types
export type TaskStatus = 'ready' | 'fetching' | 'error' | 'completed';

export interface AsyncTask {
  id: string;
  callback: (data: any) => Promise<any>;
  data: Record<string, any>;
  type: string;
  status: TaskStatus;
  error: Error | null;
  setReady: () => void;
  setError: (error: Error) => void;
}

// Plugin types
export interface IPlugin {
  type: string;
  match(node: any): boolean;
  transform(node: any, context: any): string;
  render?(data: any): Promise<string>;
}

// Renderer types
export interface IRenderer {
  type: string;
  match(node: any): boolean;
  render(node: any, options?: any): Promise<string>;
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
