/**
 * Infographic Plugin
 * 
 * Handles AntV Infographic syntax processing in content script and DOCX export
 */
import { BasePlugin } from './base-plugin';

export class InfographicPlugin extends BasePlugin {
  constructor() {
    super('infographic');
  }
}
