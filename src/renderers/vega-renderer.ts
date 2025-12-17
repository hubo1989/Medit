/**
 * Vega/Vega-Lite Renderer using BaseRenderer architecture
 * Handles both Vega and Vega-Lite specifications
 */
import { BaseRenderer } from './base-renderer';
import embed from 'vega-embed';
import { expressionInterpreter } from 'vega-interpreter';
import type { RendererThemeConfig, RenderResult } from '../types/index';

/**
 * Extra parameters for rendering
 */
interface ExtraParams {
  outputFormat?: 'svg' | 'png';
  [key: string]: unknown;
}

/**
 * Vega/Vega-Lite specification encoding channel
 */
interface EncodingChannel {
  sort?: unknown;
  [key: string]: unknown;
}

/**
 * Vega/Vega-Lite specification encoding
 */
interface VegaEncoding {
  [channel: string]: EncodingChannel;
}

/**
 * Vega/Vega-Lite specification
 */
interface VegaSpec {
  encoding?: VegaEncoding;
  layer?: VegaSpec[];
  hconcat?: VegaSpec[];
  vconcat?: VegaSpec[];
  concat?: VegaSpec[];
  facet?: {
    encoding?: VegaEncoding;
  };
  spec?: VegaSpec;
  repeat?: unknown;
  [key: string]: unknown;
}

export class VegaRenderer extends BaseRenderer {
  private mode: 'vega' | 'vega-lite';

  constructor(mode: 'vega' | 'vega-lite' = 'vega-lite') {
    super(mode); // Type is either 'vega' or 'vega-lite'
    this.mode = mode;
  }

  /**
   * Validate Vega/Vega-Lite specification
   */
  validateInput(spec: unknown): boolean {
    if (!spec) {
      throw new Error(`Empty ${this.mode} specification provided`);
    }
    return true;
  }

  /**
   * Preprocess input - parse JSON string if needed
   */
  preprocessInput(spec: string | VegaSpec, extraParams: ExtraParams): VegaSpec {
    // Parse spec if it's a string
    let vegaSpec: VegaSpec;
    if (typeof spec === 'string') {
      try {
        vegaSpec = JSON.parse(spec);
      } catch (e) {
        throw new Error(`Invalid JSON in ${this.mode} specification: ${(e as Error).message}`);
      }
    } else {
      vegaSpec = spec;
    }

    // Validate spec structure
    if (!vegaSpec || typeof vegaSpec !== 'object') {
      throw new Error(`Invalid ${this.mode} specification: must be an object`);
    }

    // Disable auto-sorting for vega-lite specs (recursively handle all views)
    if (this.mode === 'vega-lite') {
      this.disableAutoSortRecursive(vegaSpec);
    }

    return vegaSpec;
  }

  /**
   * Recursively disable automatic sorting in vega-lite specs
   * Handles: single views, layers, concat, facet, repeat
   */
  disableAutoSortRecursive(spec: VegaSpec): void {
    if (!spec || typeof spec !== 'object') {
      return;
    }

    // Handle encoding in current spec
    if (spec.encoding) {
      this.disableAutoSort(spec.encoding);
    }

    // Handle layer compositions
    if (Array.isArray(spec.layer)) {
      spec.layer.forEach(layerSpec => this.disableAutoSortRecursive(layerSpec));
    }

    // Handle concat compositions (hconcat, vconcat, concat)
    (['hconcat', 'vconcat', 'concat'] as const).forEach(concatType => {
      const concatArray = spec[concatType];
      if (Array.isArray(concatArray)) {
        concatArray.forEach(subSpec => this.disableAutoSortRecursive(subSpec));
      }
    });

    // Handle facet compositions
    if (spec.facet) {
      // Facet can have encoding
      if (spec.facet.encoding) {
        this.disableAutoSort(spec.facet.encoding);
      }
      // Nested spec in facet
      if (spec.spec) {
        this.disableAutoSortRecursive(spec.spec);
      }
    }

    // Handle repeat compositions
    if (spec.repeat) {
      if (spec.spec) {
        this.disableAutoSortRecursive(spec.spec);
      }
    }
  }

  /**
   * Disable automatic sorting in encoding channels
   */
  disableAutoSort(encoding: VegaEncoding): void {
    if (!encoding || typeof encoding !== 'object') {
      return;
    }

    // Iterate through all encoding channels (x, y, color, size, row, column, etc.)
    for (const channel in encoding) {
      const channelDef = encoding[channel];
      
      if (channelDef && typeof channelDef === 'object' && !Array.isArray(channelDef)) {
        // Only set sort to null if it's not explicitly defined
        if (!Object.prototype.hasOwnProperty.call(channelDef, 'sort')) {
          channelDef.sort = null;
        }
      }
    }
  }

  /**
   * Override render to support both SVG and PNG output
   * @param vegaSpec - Vega/Vega-Lite specification
   * @param themeConfig - Theme configuration
   * @param extraParams - Extra parameters
   * @returns Render result with base64/svg, width, height, format
   */
  async render(vegaSpec: string | VegaSpec, themeConfig: RendererThemeConfig | null, extraParams: ExtraParams = {}): Promise<RenderResult> {
    const outputFormat = extraParams.outputFormat || 'png';
    
    // Ensure renderer is initialized
    if (!this._initialized) {
      await this.initialize(themeConfig);
    }
    
    // Validate input
    this.validateInput(vegaSpec);
    
    // Preprocess input
    const processedSpec = this.preprocessInput(vegaSpec, extraParams);
    
    // Get font family from theme config
    const fontFamily = themeConfig?.fontFamily || "'SimSun', 'Times New Roman', Times, serif";
    
    // Create container for this render
    const container = this.createContainer();
    container.style.cssText = 'position: absolute; left: -9999px; top: -9999px; display: inline-block; background: transparent; padding: 0; margin: 0;';

    // Choose renderer based on output format
    const rendererType = outputFormat === 'svg' ? 'svg' : 'canvas';
    
    // Prepare embed options
    const embedOptions = {
      mode: this.mode as 'vega' | 'vega-lite',
      actions: false, // Hide action links
      renderer: rendererType as 'svg' | 'canvas',
      ast: true, // Use AST mode to avoid eval
      expr: expressionInterpreter, // Use expression interpreter instead of eval
      config: {
        background: null as string | null, // Transparent background
        font: fontFamily,
        view: {
          stroke: null as string | null // Remove border
        },
        axis: {
          labelFontSize: 11,
          titleFontSize: 12
        },
        legend: {
          labelFontSize: 11,
          titleFontSize: 12
        },
        // Let Vega-Lite use its default step-based sizing for better automatic layout
        mark: {
          tooltip: true
        }
      }
    };

    // Render the spec using vega-embed
    const result = await embed(container, processedSpec, embedOptions);
    
    // Calculate scale (same as PNG for consistent dimensions)
    const scale = this.calculateCanvasScale(themeConfig);

    // If SVG format requested, return SVG string
    if (outputFormat === 'svg') {
      const svgString = await result.view.toSVG();
      
      // Get dimensions from SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      const width = parseInt(svgElement.getAttribute('width') || '800');
      const height = parseInt(svgElement.getAttribute('height') || '600');
      
      // Cleanup container
      this.removeContainer(container);
      
      // Return scaled dimensions (same as PNG for consistent display)
      return {
        svg: svgString,
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        format: 'svg'
      };
    }
    
    // PNG format: render to canvas
    
    // Get Canvas directly from the view object
    // toCanvas() returns a Promise<HTMLCanvasElement>
    const sourceCanvas = await result.view.toCanvas(scale);

    // Validate canvas
    if (!sourceCanvas || sourceCanvas.width === 0 || sourceCanvas.height === 0) {
      throw new Error('Generated canvas is empty or invalid');
    }

    // Convert canvas to PNG data URL
    const pngDataUrl = sourceCanvas.toDataURL('image/png', 1.0);
    const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');

    // Cleanup container
    this.removeContainer(container);

    return {
      base64: base64Data,
      width: sourceCanvas.width,
      height: sourceCanvas.height,
      format: 'png'
    };
  }
}
