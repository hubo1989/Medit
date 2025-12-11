/**
 * SVG Renderer
 * 
 * Renders SVG code blocks to PNG images
 */
import { BaseRenderer } from './base-renderer.js';

export class SvgRenderer extends BaseRenderer {
  constructor() {
    super('svg');
  }

  /**
   * Validate SVG input
   */
  validateInput(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('SVG input must be a non-empty string');
    }
    if (!input.includes('<svg')) {
      throw new Error('Invalid SVG: missing <svg> tag');
    }
    return true;
  }

  /**
   * Override render to convert SVG to PNG using direct canvas rendering
   * @param {string} svg - SVG content
   * @param {object} themeConfig - Theme configuration
   * @param {object} extraParams - Extra parameters
   * @returns {Promise<{base64: string, width: number, height: number}>}
   */
  async render(svg, themeConfig, extraParams = {}) {
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
    let captureWidth, captureHeight;

    if (viewBox) {
      const parts = viewBox.split(/\s+/);
      captureWidth = Math.ceil(parseFloat(parts[2]));
      captureHeight = Math.ceil(parseFloat(parts[3]));
    } else {
      captureWidth = Math.ceil(parseFloat(svgEl.getAttribute('width')) || 800);
      captureHeight = Math.ceil(parseFloat(svgEl.getAttribute('height')) || 600);
    }

    // Calculate scale
    const scale = this.calculateCanvasScale(themeConfig);

    // Render SVG directly to canvas
    const canvas = await this.renderSvgToCanvas(svg, captureWidth * scale, captureHeight * scale);

    const pngDataUrl = canvas.toDataURL('image/png', 1.0);
    const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');

    return {
      base64: base64Data,
      width: canvas.width,
      height: canvas.height
    };
  }
}
