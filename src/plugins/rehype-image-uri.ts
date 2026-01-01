/**
 * Rehype plugin to rewrite relative image paths to absolute URIs.
 * 
 * This plugin is primarily used in VS Code webview context where relative
 * image paths need to be converted to vscode-webview-resource: URIs.
 * 
 * The base URI is obtained from a global variable set by the platform.
 */

import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

// Global variable for document base URI (set by VS Code webview)
declare global {
  var __MARKDOWN_VIEWER_IMAGE_BASE_URI__: string | undefined;
}

/**
 * Check if a URL is relative (not absolute)
 */
function isRelativeUrl(url: string): boolean {
  // Skip absolute URLs
  if (url.startsWith('http://') || 
      url.startsWith('https://') || 
      url.startsWith('data:') || 
      url.startsWith('blob:') ||
      url.startsWith('file:') ||
      url.includes('vscode-webview-resource:') ||
      url.includes('vscode-resource:')) {
    return false;
  }
  return true;
}

/**
 * Normalize relative path
 */
function normalizePath(path: string): string {
  // Remove leading ./
  if (path.startsWith('./')) {
    return path.slice(2);
  }
  return path;
}

/**
 * Rehype plugin to rewrite image src attributes
 */
export default function rehypeImageUri() {
  return (tree: Root) => {
    // Get base URI from global variable
    const baseUri = globalThis.__MARKDOWN_VIEWER_IMAGE_BASE_URI__;
    
    // Skip if no base URI is set (not in VS Code context)
    if (!baseUri) {
      return;
    }

    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') {
        return;
      }

      const src = node.properties?.src;
      if (typeof src !== 'string' || !src) {
        return;
      }

      // Only rewrite relative URLs
      if (!isRelativeUrl(src)) {
        return;
      }

      // Convert relative path to absolute URI
      const normalizedSrc = normalizePath(src);
      const newSrc = `${baseUri}/${normalizedSrc}`;
      
      node.properties = node.properties || {};
      node.properties.src = newSrc;
    });
  };
}
