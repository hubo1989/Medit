// Markdown Viewer Main - Firefox Extension Entry Point
// Uses shared viewer logic from Chrome with Firefox-specific renderer (Background Page DOM)

import { platform } from './index';
import { startViewer } from '../../../chrome/src/webview/viewer-main';
import { createPluginRenderer } from '../../../src/core/viewer/viewer-host';

// Create plugin renderer using shared utility from viewer-host
const pluginRenderer = createPluginRenderer(platform);

// Start the viewer with Firefox-specific configuration
startViewer({
  platform,
  pluginRenderer,
  themeConfigRenderer: platform.renderer,
});
