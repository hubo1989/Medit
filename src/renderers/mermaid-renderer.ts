/**
 * Mermaid Renderer
 * 
 * Renders Mermaid diagrams to PNG images using direct DOM capture
 */
import { BaseRenderer } from './base-renderer';
import mermaid from 'mermaid';
import type { RendererThemeConfig, RenderResult } from '../types/index';

export class MermaidRenderer extends BaseRenderer {
  constructor() {
    super('mermaid');
  }

  /**
   * Initialize Mermaid with theme configuration
   * @param themeConfig - Theme configuration
   */
  async initialize(themeConfig: RendererThemeConfig | null = null): Promise<void> {
    // Initialize Mermaid with theme configuration
    this.applyThemeConfig(themeConfig);
    this._initialized = true;
  }

  /**
   * Apply theme configuration to Mermaid
   * This is called on every render to ensure font follows theme changes
   * @param themeConfig - Theme configuration
   */
  applyThemeConfig(themeConfig: RendererThemeConfig | null = null): void {
    // Use theme font or fallback to default
    const fontFamily = themeConfig?.fontFamily || "'SimSun', 'Times New Roman', Times, serif";

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      themeVariables: {
        fontFamily: fontFamily,
        background: 'transparent'
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }

  /**
   * Preprocess Mermaid code to convert \n to <br> for line breaks
   * @param code - Mermaid diagram code
   * @returns Preprocessed code with \n replaced by <br>
   */
  private preprocessCode(code: string): string {
    // Globally replace literal \n with <br> for line breaks in labels
    // This is safe because actual newlines are real line breaks, not \n literals
    return code.replace(/\\n/g, '<br>');
  }

  /**
   * Render Mermaid diagram to PNG
   * @param code - Mermaid diagram code
   * @param themeConfig - Theme configuration
   * @returns Render result with base64, width, height, format
   */
  async render(code: string, themeConfig: RendererThemeConfig | null): Promise<RenderResult> {
    // Ensure renderer is initialized
    if (!this._initialized) {
      await this.initialize(themeConfig);
    }

    // Validate input
    this.validateInput(code);

    // Preprocess code to convert \n to <br> in quoted strings
    code = this.preprocessCode(code);

    // Apply theme configuration before each render
    this.applyThemeConfig(themeConfig);

    // Render Mermaid diagram to DOM
    const container = this.createContainer();
    container.style.cssText = 'position: absolute; left: -9999px; top: -9999px; display: inline-block; background: transparent; padding: 0; margin: 0;';

    // Use unique ID with timestamp + random string to support parallel rendering
    const diagramId = 'mermaid-diagram-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const { svg } = await mermaid.render(diagramId, code);

    // Validate SVG content
    if (!svg || svg.length < 100) {
      throw new Error('Generated SVG is too small or empty');
    }

    if (!svg.includes('<svg') || !svg.includes('</svg>')) {
      throw new Error('Generated content is not valid SVG');
    }

    // Insert SVG into container
    container.innerHTML = svg;

    // Add padding to prevent text clipping
    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('SVG element not found in rendered content');
    }

    // Give layout engine time to process
    container.offsetHeight;
    svgElement.getBoundingClientRect();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Wait for fonts to load
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Force another reflow
    container.offsetHeight;
    svgElement.getBoundingClientRect();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Get SVG dimensions from viewBox or attributes (not getBoundingClientRect which may be affected by CSS)
    const viewBox = svgElement.getAttribute('viewBox');
    let captureWidth: number, captureHeight: number;

    if (viewBox) {
      const parts = viewBox.split(/\s+/);
      captureWidth = Math.ceil(parseFloat(parts[2]));
      captureHeight = Math.ceil(parseFloat(parts[3]));
    } else {
      captureWidth = Math.ceil(parseFloat(svgElement.getAttribute('width') || '800'));
      captureHeight = Math.ceil(parseFloat(svgElement.getAttribute('height') || '600'));
    }

    // Get font family from theme config
    const fontFamily = themeConfig?.fontFamily || "'SimSun', 'Times New Roman', Times, serif";

    // Calculate scale for PNG dimensions
    const scale = this.calculateCanvasScale(themeConfig);

    // Render SVG to canvas as PNG
    const canvas = await this.renderSvgToCanvas(svg, captureWidth * scale, captureHeight * scale, fontFamily);

    const pngDataUrl = canvas.toDataURL('image/png', 1.0);
    const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');

    // Cleanup container
    this.removeContainer(container);

    return {
      base64: base64Data,
      width: canvas.width,
      height: canvas.height,
      format: 'png'
    };
  }
}
