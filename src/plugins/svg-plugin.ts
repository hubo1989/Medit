/**
 * SVG Plugin
 * 
 * Handles SVG code blocks and SVG image files in content script and DOCX export
 */
import { BasePlugin } from './base-plugin';
import type { PlatformBridgeAPI } from '../types/index';

type ResponseEnvelopeLike = {
  type: 'RESPONSE';
  requestId: string;
  ok: boolean;
  data?: unknown;
  error?: { message?: string };
};

function isResponseEnvelopeLike(message: unknown): message is ResponseEnvelopeLike {
  if (!message || typeof message !== 'object') return false;
  const obj = message as Record<string, unknown>;
  return obj.type === 'RESPONSE' && typeof obj.requestId === 'string' && typeof obj.ok === 'boolean';
}

/**
 * AST node interface for SVG plugin
 */
interface AstNode {
  type: string;
  lang?: string;
  value?: string;
  url?: string;
}

export class SvgPlugin extends BasePlugin {
  private _currentNodeType: string | null = null;

  constructor() {
    super('svg');
    this._currentNodeType = null; // Track current node type being processed
  }

  /**
   * Extract content from AST node
   * Handles both SVG code blocks and SVG image files
   * @param node - AST node
   * @returns SVG content or URL, or null if not applicable
   */
  extractContent(node: AstNode): string | null {
    // Store node type for isInline() to use
    this._currentNodeType = node.type;

    // Handle SVG code blocks: ```svg ... ```
    if (node.type === 'code' && node.lang === 'svg') {
      return node.value || null;
    }

    // Handle SVG image files: ![](*.svg)
    if (node.type === 'image') {
      const url = node.url || '';
      const isSvg = url.toLowerCase().endsWith('.svg') || 
                    url.toLowerCase().includes('image/svg+xml');
      if (isSvg) {
        return url; // Return URL for later fetching
      }
    }

    return null;
  }

  /**
   * SVG uses inline rendering for images, block for code blocks
   * @returns True for inline rendering (images), false for block (code blocks)
   */
  isInline(): boolean {
    return this._currentNodeType === 'image';
  }

  /**
   * Check if content is a URL (for image nodes)
   * @param content - Extracted content
   * @returns True if content is a URL
   */
  isUrl(content: string): boolean {
    return content.startsWith('http://') || 
           content.startsWith('https://') ||
           content.startsWith('file://') ||
           content.startsWith('data:') ||
           content.includes('/') || // Relative paths
           content.includes('\\'); // Windows paths
  }

  /**
   * Fetch SVG content from URL
   * @param url - URL to fetch (http://, https://, file://, or data:)
   * @returns SVG content
   */
  async fetchContent(url: string): Promise<string> {
    // Handle data: URLs
    if (url.startsWith('data:image/svg+xml')) {
      const base64Match = url.match(/^data:image\/svg\+xml;base64,(.+)$/);
      if (base64Match) {
        return atob(base64Match[1]);
      }
      const urlMatch = url.match(/^data:image\/svg\+xml[;,](.+)$/);
      if (urlMatch) {
        return decodeURIComponent(urlMatch[1]);
      }
      throw new Error('Unsupported SVG data URL format');
    }

    // Handle http:// and https:// URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    }

    // Handle local file:// URLs or relative paths
    const createRequestId = (): string => {
      const maybeCrypto = globalThis.crypto as Crypto | undefined;
      if (maybeCrypto?.randomUUID) return maybeCrypto.randomUUID();
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    // First, try platform.message.send (works for Chrome extension and VS Code)
    const platform = globalThis.platform as { message?: { send?: (msg: Record<string, unknown>) => Promise<unknown> } } | undefined;
    if (platform?.message?.send) {
      // For VS Code, use the document base URI (file path) if available
      // For Chrome, use window.location.href
      const documentBaseUri = (globalThis as unknown as { __MARKDOWN_VIEWER_IMAGE_BASE_URI__?: string }).__MARKDOWN_VIEWER_IMAGE_BASE_URI__;
      let absoluteUrl: string;
      
      if (documentBaseUri) {
        // VS Code: documentBaseUri is like "https://file+.vscode-resource.../path/to/dir"
        // We need to extract the actual file path and resolve relative to it
        // Send the relative path directly, let host resolve it
        absoluteUrl = url;
      } else {
        // Chrome: resolve relative to current page URL
        const baseUrl = window.location.href;
        absoluteUrl = new URL(url, baseUrl).href;
      }
      
      const response = await platform.message.send({
        id: createRequestId(),
        type: 'READ_LOCAL_FILE',
        payload: { filePath: absoluteUrl },
        timestamp: Date.now(),
        source: 'svg-plugin',
      });

      if (!isResponseEnvelopeLike(response)) {
        throw new Error('Unexpected READ_LOCAL_FILE response shape');
      }
      
      if (!response.ok) {
        throw new Error(response.error?.message || 'READ_LOCAL_FILE failed');
      }
      
      const data = response.data as { content?: unknown } | undefined;
      return typeof data?.content === 'string' ? data.content : '';
    }

    // Fallback: try mobile bridge API
    const bridgeApi: PlatformBridgeAPI | undefined = globalThis.bridge as PlatformBridgeAPI | undefined;
    if (bridgeApi) {
      try {
        const result = await bridgeApi.sendRequest<{ content?: string }>('READ_RELATIVE_FILE', { path: url });
        // Flutter returns { content: string }
        if (result && typeof result === 'object' && result.content) {
          return result.content;
        }
        throw new Error('Invalid response from Flutter: ' + JSON.stringify(result));
      } catch (e) {
        console.error('[SVG Plugin] Failed to read file via Flutter:', e);
        throw new Error(`Cannot load SVG file: ${url} - ${(e as Error).message}`);
      }
    }

    throw new Error(`Cannot load local SVG file: ${url} - no platform messaging available`);
  }

  /**
   * Get AST node selector(s) for remark visit
   * SVG plugin handles both code blocks and image nodes
   * @returns Array of node types ['code', 'image']
   */
  get nodeSelector(): string[] {
    return ['code', 'image'];
  }
}
