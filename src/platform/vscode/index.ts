/**
 * VSCode Platform Entry Point
 * 
 * This module initializes and exports the platform API instance for VS Code webview.
 */

import { vscodePlatform, VSCodePlatformAPI } from './api-impl';
import type { PlatformAPI } from '../../types/index';

// Extend globalThis type
declare global {
  var platform: PlatformAPI;
}

// Set global platform instance
globalThis.platform = vscodePlatform as unknown as PlatformAPI;

// Export for explicit imports
export default vscodePlatform;
export { vscodePlatform as platform };
export { VSCodePlatformAPI };
