// Markdown Viewer Main - Chrome Extension Entry Point
// Uses shared viewer logic with Chrome-specific renderer (Offscreen API)

import ExtensionRenderer from '../../../src/utils/renderer';
import { platform } from './index';
import { BackgroundCacheManagerProxy } from '../../../src/core/cache-proxy';
import { startViewer, createPluginRenderer } from './viewer-main';

// Extend Window interface for Chrome-specific globals
declare global {
  interface Window {
    extensionRenderer: ExtensionRenderer;
  }
}

// Initialize cache manager with platform
const cacheManager = new BackgroundCacheManagerProxy(platform);

// Initialize renderer with background cache proxy (Chrome uses Offscreen API)
const renderer = new ExtensionRenderer(cacheManager);

// Store renderer for plugins and debugging
window.extensionRenderer = renderer;

// Create plugin renderer from ExtensionRenderer
const pluginRenderer = createPluginRenderer((type, content) => renderer.render(type, content));

// Start the viewer with Chrome-specific configuration
startViewer({
  platform,
  pluginRenderer,
  themeConfigRenderer: renderer,
});
