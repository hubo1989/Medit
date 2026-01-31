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
 * Detect image MIME type from base64 data using magic bytes
 * @param base64Data - Base64 encoded image data
 * @returns Detected MIME type or null if not recognized
 */
function detectImageMimeType(base64Data: string): string | null {
  // Decode first few bytes to check magic numbers
  try {
    const binaryString = atob(base64Data.slice(0, 16));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return 'image/png';
    }
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return 'image/jpeg';
    }
    // GIF: 47 49 46 38
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return 'image/gif';
    }
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return 'image/webp';
    }
    // BMP: 42 4D
    if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
      return 'image/bmp';
    }
  } catch {
    // Ignore decode errors
  }
  return null;
}

/**
 * Fix data:application/octet-stream URLs by detecting actual image type
 * @param url - Data URL to fix
 * @returns Fixed URL with correct MIME type, or original if not fixable
 */
function fixOctetStreamDataUrl(url: string): string {
  const match = url.match(/^data:application\/octet-stream;base64,(.+)$/i);
  if (!match) {
    return url;
  }

  const base64Data = match[1];
  const detectedMime = detectImageMimeType(base64Data);
  
  if (detectedMime) {
    return `data:${detectedMime};base64,${base64Data}`;
  }
  
  return url;
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
    
    const baseUri = doc?.baseUrl;
    const needsUriRewrite = doc?.needsUriRewrite;

    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') {
        return;
      }

      const src = node.properties?.src;
      if (typeof src !== 'string' || !src) {
        return;
      }

      // Fix data:application/octet-stream URLs (always apply)
      if (src.toLowerCase().startsWith('data:application/octet-stream;base64,')) {
        node.properties = node.properties || {};
        node.properties.src = fixOctetStreamDataUrl(src);
        return;
      }

      // Only rewrite relative URLs if URI rewrite is needed
      if (!needsUriRewrite || !baseUri) {
        return;
      }

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
