/**
 * SVG Renderer
 * 
 * Renders SVG code blocks to PNG images
 */
import { BaseRenderer } from './base-renderer';
import type { RendererThemeConfig, RenderResult } from '../types/index';

export class SvgRenderer extends BaseRenderer {
  constructor() {
    super('svg');
  }

  /**
   * Validate SVG input
   */
  validateInput(input: string): boolean {
    if (!input || typeof input !== 'string') {
      throw new Error('SVG input must be a non-empty string');
    }
    if (!input.includes('<svg')) {
      throw new Error('Invalid SVG: missing <svg> tag');
    }
    return true;
  }

  /**
   * Render SVG content to PNG
   * @param svg - SVG content
   * @param themeConfig - Theme configuration
   * @returns Render result with base64, width, height, format
   */
  async render(svg: string, themeConfig: RendererThemeConfig | null): Promise<RenderResult> {
    // Validate input
    this.validateInput(svg);

    // Parse SVG to get dimensions
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (!svgEl) {
      throw new Error('No SVG element found in input');
    }

    // Get SVG dimensions from viewBox or attributes
    const viewBox = svgEl.getAttribute('viewBox');
    let captureWidth: number, captureHeight: number;

    if (viewBox) {
      const parts = viewBox.split(/\s+/);
      captureWidth = Math.ceil(parseFloat(parts[2]));
      captureHeight = Math.ceil(parseFloat(parts[3]));
    } else {
      captureWidth = Math.ceil(parseFloat(svgEl.getAttribute('width') || '800'));
      captureHeight = Math.ceil(parseFloat(svgEl.getAttribute('height') || '600'));
    }

    // Calculate scale for PNG dimensions
    const scale = this.calculateCanvasScale(themeConfig);

    // Render SVG to canvas as PNG
    const canvas = await this.renderSvgToCanvas(svg, captureWidth * scale, captureHeight * scale);

    const pngDataUrl = canvas.toDataURL('image/png', 1.0);
    const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');

    return {
      base64: base64Data,
      width: canvas.width,
      height: canvas.height,
      format: 'png'
    };
  }
}
