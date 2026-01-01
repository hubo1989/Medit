/**
 * Rehype plugin to rewrite relative image paths to absolute URIs.
 * 
 * This plugin is primarily used in VS Code webview context where relative
 * image paths need to be converted to vscode-webview-resource: URIs.
 * 
 * The base URI is obtained from DocumentService.
 */

import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { DocumentService } from '../types/platform';

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
 * Get DocumentService from platform
 */
function getDocumentService(): DocumentService | undefined {
  return (globalThis.platform as { document?: DocumentService } | undefined)?.document;
}

/**
 * Rehype plugin to rewrite image src attributes
 */
export default function rehypeImageUri() {
  return (tree: Root) => {
    // Get DocumentService
    const doc = getDocumentService();
    
    // Skip if DocumentService is not available or doesn't need URI rewrite
    if (!doc?.needsUriRewrite) {
      return;
    }

    const baseUri = doc.baseUrl;

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
