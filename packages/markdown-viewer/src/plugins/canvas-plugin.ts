/**
 * JSON Canvas Plugin
 * 
 * Handles JSON Canvas processing in content script and DOCX export
 */
import { BasePlugin } from './base-plugin';

export class JsonCanvasPlugin extends BasePlugin {
  constructor() {
    super('canvas');
  }
}
