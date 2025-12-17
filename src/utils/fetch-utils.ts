// Fetch utilities for cross-platform resource loading
// Uses platform.resource.fetch for asset loading

import type { PlatformAPI } from '../types/index';

/**
 * Get platform instance from global scope
 */
function getPlatform(): PlatformAPI | undefined {
  return globalThis.platform;
}

/**
 * Fetch JSON from asset path
 * @param path - Asset path (can be URL or relative path)
 * @returns Parsed JSON
 */
export async function fetchJSON<T = unknown>(path: string): Promise<T> {
  const text = await fetchText(path);
  return JSON.parse(text) as T;
}

/**
 * Fetch text content from asset path
 * @param path - Asset path (can be URL or relative path)
 * @returns Text content
 */
export async function fetchText(path: string): Promise<string> {
  const platform = getPlatform();
  
  // Use platform's fetch if available
  if (platform?.resource?.fetch) {
    // Convert URL back to path if needed (e.g., chrome-extension://xxx/path -> path)
    const assetPath = extractAssetPath(path);
    return platform.resource.fetch(assetPath);
  }
  
  // Fallback to native fetch
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.text();
}

/**
 * Extract asset path from URL
 * Handles chrome-extension:// URLs and relative paths
 */
function extractAssetPath(urlOrPath: string): string {
  // If it's a relative path starting with ./, strip it
  if (urlOrPath.startsWith('./')) {
    return urlOrPath.slice(2);
  }
  
  // If it's a chrome-extension:// URL, extract the path
  if (urlOrPath.startsWith('chrome-extension://')) {
    const url = new URL(urlOrPath);
    return url.pathname.slice(1); // Remove leading /
  }
  
  // Otherwise return as-is
  return urlOrPath;
}
