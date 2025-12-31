// Markdown Viewer Main - Firefox Extension Entry Point
// Uses shared viewer logic from Chrome with Firefox-specific renderer (Background Page DOM)

import { platform } from './index';
import { startViewer, createPluginRenderer } from '../../../chrome/src/webview/viewer-main';

// Create plugin renderer using platform.renderer (Firefox uses Background Page rendering)
const pluginRenderer = createPluginRenderer((type, content) => platform.renderer.render(type, content));

// Start the viewer with Firefox-specific configuration
startViewer({
  platform,
  pluginRenderer,
  themeConfigRenderer: platform.renderer,
});
