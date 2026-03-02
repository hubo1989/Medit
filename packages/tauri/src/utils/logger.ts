/**
 * Logger utility with environment variable control
 * 
 * Usage:
 * - Set VITE_LOG_LEVEL=debug|info|warn|error in .env to control log level
 * - Set VITE_DEBUG=true to enable debug mode
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

/**
 * Get log level from environment
 * In Tauri with Vite, we check import.meta.env for Vite environment variables
 */
function getLogLevel(): LogLevel {
  // Try to access import.meta.env safely (Vite injects this at build time)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env;
  
  const envLevel = env?.VITE_LOG_LEVEL as string | undefined;
  const isDebug = env?.VITE_DEBUG === 'true' || env?.DEV === true;
  
  if (envLevel && envLevel in LOG_LEVEL_PRIORITY) {
    return envLevel as LogLevel;
  }
  
  // In development mode, default to debug
  if (isDebug) {
    return 'debug';
  }
  
  // In production, default to warn (only show warnings and errors)
  return 'warn';
}

const currentLogLevel = getLogLevel();

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
}

/**
 * Logger instance with prefix support
 */
export class Logger {
  private prefix: string;
  
  constructor(prefix: string) {
    this.prefix = `[${prefix}]`;
  }
  
  debug(...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.log(this.prefix, ...args);
    }
  }
  
  info(...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(this.prefix, ...args);
    }
  }
  
  warn(...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(this.prefix, ...args);
    }
  }
  
  error(...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(this.prefix, ...args);
    }
  }
  
  /**
   * Log with success indicator (for important milestones)
   */
  success(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.log(this.prefix, '✓', message, ...args);
    }
  }
  
  /**
   * Log with warning indicator (for fallbacks)
   */
  fallback(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(this.prefix, '⚠', message, ...args);
    }
  }
  
  /**
   * Log with error indicator (for failures)
   */
  failure(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(this.prefix, '✗', message, ...args);
    }
  }
}

/**
 * Create a logger instance with a prefix
 */
export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return shouldLog('debug');
}

/**
 * Get current log level
 */
export function getCurrentLogLevel(): LogLevel {
  return currentLogLevel;
}
