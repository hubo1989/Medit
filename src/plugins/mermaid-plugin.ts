/**
 * Mermaid Plugin
 * 
 * Handles Mermaid diagram processing in content script and DOCX export
 */
import { BasePlugin } from './base-plugin';

export class MermaidPlugin extends BasePlugin {
  constructor() {
    super('mermaid');
  }
}
