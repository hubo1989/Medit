/**
 * JSON Canvas Renderer Tests
 * 
 * Tests for the JSON Canvas to SVG rendering functionality.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import JSONCanvas from '@trbn/jsoncanvas';
import { JsonCanvasRenderer } from '../src/renderers/canvas-renderer.ts';

// Create renderer instance for testing
const renderer = new JsonCanvasRenderer();

// Helper to extract SVG content via private method
function generateSvg(canvasData: object): string {
  const code = JSON.stringify(canvasData);
  const canvas = JSONCanvas.fromString(code);
  return (renderer as any)['generateSvg'](canvas, 'sans-serif');
}

describe('JsonCanvasRenderer', () => {
  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const r = new JsonCanvasRenderer();
      await r.initialize();
      assert.ok(true, 'Renderer should initialize without error');
    });

    it('should have correct renderer type', () => {
      assert.strictEqual(renderer.type, 'canvas');
    });
  });

  describe('node rendering', () => {
    it('should render text node', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'text', text: 'Hello', x: 0, y: 0, width: 100, height: 60 }
        ],
        edges: []
      });
      
      assert.ok(svg.includes('<rect'), 'Should contain rect element');
      assert.ok(svg.includes('Hello'), 'Should contain text content');
      assert.ok(svg.includes('rx="8"'), 'Should have rounded corners');
    });

    it('should render file node', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'file', file: 'document.pdf', x: 0, y: 0, width: 100, height: 60 }
        ],
        edges: []
      });
      
      assert.ok(svg.includes('<rect'), 'Should contain rect element');
      assert.ok(svg.includes('document.pdf'), 'Should contain file name');
    });

    it('should render link node', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'link', url: 'https://example.com', x: 0, y: 0, width: 100, height: 60 }
        ],
        edges: []
      });
      
      assert.ok(svg.includes('<rect'), 'Should contain rect element');
      assert.ok(svg.includes('example.com'), 'Should contain URL');
    });

    it('should render group node', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'group', label: 'My Group', x: 0, y: 0, width: 200, height: 150 }
        ],
        edges: []
      });
      
      assert.ok(svg.includes('<rect'), 'Should contain rect element');
      assert.ok(svg.includes('My Group'), 'Should contain group label');
    });

    it('should render multiple nodes', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'n2', type: 'text', text: 'B', x: 200, y: 0, width: 100, height: 60 },
          { id: 'n3', type: 'text', text: 'C', x: 400, y: 0, width: 100, height: 60 }
        ],
        edges: []
      });
      
      assert.ok(svg.includes('>A<'), 'Should contain node A');
      assert.ok(svg.includes('>B<'), 'Should contain node B');
      assert.ok(svg.includes('>C<'), 'Should contain node C');
    });
  });

  describe('node colors', () => {
    it('should apply color preset 1 (red)', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'text', text: 'Red', x: 0, y: 0, width: 100, height: 60, color: '1' }
        ],
        edges: []
      });
      
      assert.ok(svg.includes('stroke="#e76f6f"'), 'Should have red stroke color');
    });

    it('should apply color preset 6 (purple)', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'text', text: 'Purple', x: 0, y: 0, width: 100, height: 60, color: '6' }
        ],
        edges: []
      });
      
      assert.ok(svg.includes('stroke="#9f8fcc"'), 'Should have purple stroke color');
    });

    it('should apply hex color', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'text', text: 'Custom', x: 0, y: 0, width: 100, height: 60, color: '#ff5500' }
        ],
        edges: []
      });
      
      assert.ok(svg.includes('stroke="#ff5500"'), 'Should have custom hex stroke color');
    });
  });

  describe('edge rendering', () => {
    it('should render edge with default arrow (toEnd)', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'a', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'b', type: 'text', text: 'B', x: 200, y: 0, width: 100, height: 60 }
        ],
        edges: [
          { id: 'e1', fromNode: 'a', fromSide: 'right', toNode: 'b', toSide: 'left' }
        ]
      });
      
      assert.ok(svg.includes('<path'), 'Should contain path element');
      assert.ok(svg.includes('marker-end="url(#arrow-e1)"'), 'Should have end arrow marker');
    });

    it('should render edge without arrows (toEnd: none)', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'a', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'b', type: 'text', text: 'B', x: 200, y: 0, width: 100, height: 60 }
        ],
        edges: [
          { id: 'e1', fromNode: 'a', fromSide: 'right', toNode: 'b', toSide: 'left', toEnd: 'none' }
        ]
      });
      
      assert.ok(svg.includes('<path'), 'Should contain path element');
      assert.ok(!svg.includes('marker-end'), 'Should not have end arrow marker');
    });

    it('should render bidirectional edge (fromEnd: arrow, toEnd: arrow)', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'a', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'b', type: 'text', text: 'B', x: 200, y: 0, width: 100, height: 60 }
        ],
        edges: [
          { id: 'e1', fromNode: 'a', fromSide: 'right', toNode: 'b', toSide: 'left', fromEnd: 'arrow', toEnd: 'arrow' }
        ]
      });
      
      assert.ok(svg.includes('marker-end="url(#arrow-e1)"'), 'Should have end arrow marker');
      assert.ok(svg.includes('marker-start="url(#arrow-e1-start)"'), 'Should have start arrow marker');
    });

    it('should render edge label', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'a', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'b', type: 'text', text: 'B', x: 200, y: 0, width: 100, height: 60 }
        ],
        edges: [
          { id: 'e1', fromNode: 'a', fromSide: 'right', toNode: 'b', toSide: 'left', label: 'connects' }
        ]
      });
      
      assert.ok(svg.includes('>connects<'), 'Should contain edge label');
    });

    it('should render colored edge', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'a', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'b', type: 'text', text: 'B', x: 200, y: 0, width: 100, height: 60 }
        ],
        edges: [
          { id: 'e1', fromNode: 'a', fromSide: 'right', toNode: 'b', toSide: 'left', color: '1' }
        ]
      });
      
      assert.ok(svg.includes('stroke="#e76f6f"'), 'Should have red stroke on path');
    });
  });

  describe('arrow markers', () => {
    it('should define end arrow marker with correct refX (not overlapping node)', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'a', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'b', type: 'text', text: 'B', x: 200, y: 0, width: 100, height: 60 }
        ],
        edges: [
          { id: 'e1', fromNode: 'a', fromSide: 'right', toNode: 'b', toSide: 'left' }
        ]
      });
      
      // End arrow: refX=ARROW_WIDTH means tip at endpoint
      assert.ok(svg.includes('id="arrow-e1"'), 'Should have arrow marker defined');
      assert.ok(svg.includes('refX="7"'), 'End arrow should have refX=7');
      assert.ok(svg.includes('points="0 0, 7 3, 0 6"'), 'End arrow should point right');
    });

    it('should define start arrow marker pointing toward start node', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'a', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'b', type: 'text', text: 'B', x: 200, y: 0, width: 100, height: 60 }
        ],
        edges: [
          { id: 'e1', fromNode: 'a', fromSide: 'right', toNode: 'b', toSide: 'left', fromEnd: 'arrow' }
        ]
      });
      
      // Start arrow: refX=0 and reversed points means tip points back toward start node
      assert.ok(svg.includes('id="arrow-e1-start"'), 'Should have start arrow marker defined');
      assert.ok(svg.includes('refX="0"'), 'Start arrow should have refX=0');
      assert.ok(svg.includes('points="7 0, 0 3, 7 6"'), 'Start arrow should point left (toward start)');
    });
  });

  describe('edge connection sides', () => {
    it('should connect from right side', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'a', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'b', type: 'text', text: 'B', x: 200, y: 0, width: 100, height: 60 }
        ],
        edges: [
          { id: 'e1', fromNode: 'a', fromSide: 'right', toNode: 'b', toSide: 'left' }
        ]
      });
      
      // Path should start at x=140 (0+100+40 offset) and connect to x=240 (200+40 offset)
      assert.ok(svg.includes('M140,'), 'Path should start from right side of node A');
    });

    it('should connect from bottom to top', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'a', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'b', type: 'text', text: 'B', x: 0, y: 150, width: 100, height: 60 }
        ],
        edges: [
          { id: 'e1', fromNode: 'a', fromSide: 'bottom', toNode: 'b', toSide: 'top' }
        ]
      });
      
      assert.ok(svg.includes('<path'), 'Should render vertical edge');
    });
  });

  describe('SVG structure', () => {
    it('should have valid SVG structure', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'text', text: 'Test', x: 0, y: 0, width: 100, height: 60 }
        ],
        edges: []
      });
      
      assert.ok(svg.startsWith('<svg'), 'Should start with svg tag');
      assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'), 'Should have SVG namespace');
      assert.ok(svg.includes('viewBox='), 'Should have viewBox');
      assert.ok(svg.endsWith('</svg>'), 'Should end with closing svg tag');
    });

    it('should include defs section for markers', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'a', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'b', type: 'text', text: 'B', x: 200, y: 0, width: 100, height: 60 }
        ],
        edges: [
          { id: 'e1', fromNode: 'a', fromSide: 'right', toNode: 'b', toSide: 'left' }
        ]
      });
      
      assert.ok(svg.includes('<defs>'), 'Should have defs section');
      assert.ok(svg.includes('</defs>'), 'Should close defs section');
      assert.ok(svg.includes('<marker'), 'Should contain marker definitions');
    });

    it('should have white background', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'text', text: 'Test', x: 0, y: 0, width: 100, height: 60 }
        ],
        edges: []
      });
      
      assert.ok(svg.includes('fill="white"'), 'Should have white background rect');
    });
  });

  describe('bounds calculation', () => {
    it('should calculate correct canvas dimensions', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'text', text: 'A', x: 0, y: 0, width: 100, height: 60 },
          { id: 'n2', type: 'text', text: 'B', x: 200, y: 100, width: 100, height: 60 }
        ],
        edges: []
      });
      
      // Expected: maxX=300, maxY=160, + padding*2 = 380 x 240
      assert.ok(svg.includes('width="380"'), 'Should have correct width');
      assert.ok(svg.includes('height="240"'), 'Should have correct height');
    });

    it('should handle negative coordinates', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'text', text: 'A', x: -50, y: -30, width: 100, height: 60 }
        ],
        edges: []
      });
      
      // Should still render correctly with offset
      assert.ok(svg.includes('<svg'), 'Should render SVG');
      assert.ok(svg.includes('<rect'), 'Should contain node rect');
    });
  });

  describe('text escaping', () => {
    it('should escape special XML characters in text', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'text', text: '<script>alert("xss")</script>', x: 0, y: 0, width: 200, height: 60 }
        ],
        edges: []
      });
      
      assert.ok(!svg.includes('<script>'), 'Should escape < character');
      assert.ok(svg.includes('&lt;script&gt;'), 'Should contain escaped text');
    });

    it('should escape ampersand', () => {
      const svg = generateSvg({
        nodes: [
          { id: 'n1', type: 'text', text: 'A & B', x: 0, y: 0, width: 100, height: 60 }
        ],
        edges: []
      });
      
      assert.ok(svg.includes('A &amp; B'), 'Should escape ampersand');
    });
  });

  describe('empty canvas', () => {
    it('should handle empty nodes array', () => {
      const svg = generateSvg({
        nodes: [],
        edges: []
      });
      
      assert.ok(svg.includes('<svg'), 'Should still render SVG');
    });
  });
});
