// Mobile Iframe Render Worker Adapter
// Bridges iframe postMessage with shared render-worker-core

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
 * Message from parent window
 */
interface ParentMessage {
  type?: string;
  requestId?: string;
  renderType?: string;
  input?: string;
  themeConfig?: RendererThemeConfig;
  extraParams?: Record<string, unknown>;
  config?: RendererThemeConfig;
}

/**
 * Response message to parent
 */
interface ResponseMessage {
  type: string;
  requestId?: string;
  result?: unknown;
  error?: string;
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
      }, '*');
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Send message to parent window
 */
function sendToParent(message: ResponseMessage): void {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
    } else {
      console.warn('[RenderWorker] No parent window');
    }
  } catch (e) {
    console.error('[RenderWorker] postMessage failed:', e);
  }
}

/**
 * Send response to parent
 */
function sendResponse(requestId: string | undefined, result: unknown = null, error: string | null = null): void {
  const response: ResponseMessage = {
    type: MessageTypes.RESPONSE,
    requestId
  };
  
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  
  sendToParent(response);
}

/**
 * Handle incoming messages from parent
 */
window.addEventListener('message', async (event: MessageEvent<ParentMessage>) => {
  const message = event.data;
  if (!message || typeof message !== 'object') return;

  const { type, requestId } = message;

  // Handle theme config update
  if (type === MessageTypes.SET_THEME_CONFIG || type === 'SET_THEME_CONFIG') {
    if (message.config) {
      setThemeConfig(message.config);
    }
    sendResponse(requestId, { success: true });
    return;
  }

  // Handle render request
  if (type === MessageTypes.RENDER_DIAGRAM || type === 'RENDER_DIAGRAM') {
    try {
      const request: RenderRequest = {
        renderType: message.renderType || '',
        input: message.input || '',
        themeConfig: message.themeConfig,
        extraParams: message.extraParams
      };
      const result = await handleRender(request);
      sendResponse(requestId, result);
    } catch (error) {
      console.error('[RenderWorker] Render error:', error);
      sendResponse(requestId, null, (error as Error).message);
    }
    return;
  }

  // Handle ping (check if ready)
  if (type === MessageTypes.PING || type === 'PING') {
    sendResponse(requestId, { ready: isReady });
    return;
  }
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
      sendToParent({ type: 'RENDER_FRAME_READY' });
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
