/**
 * Vega-Lite Plugin using BasePlugin architecture
 */
import { BasePlugin } from './base-plugin';

/**
 * AST node interface
 */
interface AstNode {
  type: string;
  lang?: string;
  value?: string;
}

/**
 * Vega-Lite Plugin implementation
 */
export class VegaLitePlugin extends BasePlugin {
  constructor() {
    super('vega-lite');
  }
  
  /**
   * Override extractContent to support both 'vega-lite' and 'vegalite'
   */
  extractContent(node: AstNode): string | null {
    // Support both 'vega-lite' and 'vegalite' language identifiers
    if (node.type === 'code' && (node.lang === 'vega-lite' || node.lang === 'vegalite')) {
      return node.value || null;
    }
    return null;
  }
}
