/**
 * HTML Plugin
 * 
 * Handles HTML code block processing in content script and DOCX export
 */
import { BasePlugin } from './base-plugin';
import { sanitizeAndCheck } from '../utils/html-sanitizer';

/**
 * AST node interface for HTML plugin
 */
interface AstNode {
  type: string;
  value?: string;
}

export class HtmlPlugin extends BasePlugin {
  constructor() {
    super('html');
  }

  /**
   * Get AST node selectors for remark visit
   * @returns Array with 'html' node type
   */
  get nodeSelector(): string[] {
    return ['html'];
  }

  /**
   * Extract content from HTML node
   * @param node - AST node
   * @returns Extracted content or null
   */
  extractContent(node: AstNode): string | null {
    // Only process 'html' type nodes
    if (node.type !== 'html') {
      return null;
    }

    const htmlContent = node.value?.trim() || '';
    if (!htmlContent) {
      return null;
    }

    // Sanitize HTML and check if it has meaningful content
    // This removes comments, scripts, dangerous elements, and simple line breaks
    const { hasContent } = sanitizeAndCheck(htmlContent);
    if (!hasContent) {
      return null;
    }

    return htmlContent;
  }
}
