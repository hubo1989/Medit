// Mobile Iframe Render Worker Adapter
// Bridges iframe postMessage with shared render-worker-core

import { RenderChannel } from '../../messaging/channels/render-channel';
import { WindowPostMessageTransport } from '../../messaging/transports/window-postmessage-transport';

import {
  handleRender,
  setThemeConfig,
  initRenderEnvironment,
  MessageTypes,
  type RenderRequest
} from '../../renderers/render-worker-core';
import type { RendererThemeConfig } from '../../types/index';

// Signal ready state
let isReady = false;
let readyAcknowledged = false;
let readyInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Debug log message to parent window
 */
interface LogMessage {
  type: string;
  args?: string[];
}

/**
 * Send log to parent window for debugging
 */
function logToParent(...args: unknown[]): void {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'RENDER_FRAME_LOG',
        args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))
      } satisfies LogMessage, '*');
    }
  } catch (e) {
    // Ignore
  }
}

const renderChannel = new RenderChannel(
  new WindowPostMessageTransport(window.parent, {
    targetOrigin: '*',
    acceptSource: window.parent,
  }),
  {
    source: 'mobile-render-frame',
    timeoutMs: 60_000,
  }
);

renderChannel.handle('SET_THEME_CONFIG', (payload) => {
  const data = payload as { config?: RendererThemeConfig } | null;
  if (data?.config) {
    setThemeConfig(data.config);
  }
  return {};
});

renderChannel.handle('RENDER_DIAGRAM', async (payload) => {
  const data = payload as {
    renderType?: string;
    input?: string | object;
    themeConfig?: RendererThemeConfig;
    extraParams?: Record<string, unknown>;
  };

  const request: RenderRequest = {
    renderType: data.renderType || '',
    input: data.input || '',
    themeConfig: data.themeConfig,
    extraParams: data.extraParams,
  };

  return handleRender(request);
});

renderChannel.handle('PING', () => {
  return { ready: isReady };
});

/**
 * Ready acknowledgment message
 */
interface ReadyAckMessage {
  type?: string;
}

// Listen for acknowledgment from parent
window.addEventListener('message', (event: MessageEvent<ReadyAckMessage>) => {
  const message = event.data;
  if (message && (message.type === MessageTypes.READY_ACK || message.type === 'READY_ACK')) {
    readyAcknowledged = true;
    if (readyInterval) {
      clearInterval(readyInterval);
      readyInterval = null;
    }
  }
});

/**
 * Initialize render worker
 */
function initialize(): void {
  // Initialize render environment using shared core
  const canvas = document.getElementById('png-canvas') as HTMLCanvasElement | null;
  initRenderEnvironment({ canvas: canvas || undefined });

  isReady = true;

  // Keep sending ready signal until acknowledged
  // This handles the case where parent's listener isn't set up yet
  const sendReady = (): void => {
    if (!readyAcknowledged) {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'RENDER_FRAME_READY' }, '*');
        }
      } catch {
        // Ignore
      }
    }
  };
  
  sendReady();
  readyInterval = setInterval(sendReady, 100);
  
  // Stop after 10 seconds
  setTimeout(() => {
    if (readyInterval) {
      clearInterval(readyInterval);
      readyInterval = null;
    }
  }, 10000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
