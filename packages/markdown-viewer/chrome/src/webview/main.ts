// Markdown Viewer Main - Chrome Extension Entry Point
// Uses shared viewer logic with platform renderer

import { platform } from './index';
import { startViewer } from './viewer-main';
import { createPluginRenderer } from '../../../src/core/viewer/viewer-host';

// Create plugin renderer using shared utility from viewer-host
const pluginRenderer = createPluginRenderer(platform);

// Start the viewer with Chrome-specific configuration
startViewer({
  platform,
  pluginRenderer,
  themeConfigRenderer: platform.renderer,
});
