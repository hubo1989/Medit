/**
 * Channel Factory
 *
 * Creates ServiceChannel and RenderChannel with swappable transports.
 */

import type { PlatformType } from '../types/platform';
import { ServiceChannel } from './channels/service-channel';
import { RenderChannel } from './channels/render-channel';
import { ChromeRuntimeTransport } from './transports/chrome-runtime-transport';
import { FlutterJsChannelTransport } from './transports/flutter-jschannel-transport';
import { WindowPostMessageTransport } from './transports/window-postmessage-transport';
import { InProcessTransport } from './transports/in-process-transport';

export type ChromeRenderMode = 'runtime' | 'iframe' | 'inpage';

export type CreateChannelsOptions = {
  debug?: boolean;
  timeoutMs?: number;

  /**
   * Chrome only: where to execute rendering.
   * - runtime: background/offscreen via chrome.runtime messaging (default)
   * - iframe: render iframe via postMessage (requires an iframe window handle)
    * - inpage: render inside main WebView/page (hidden container). Transport is in-process.
   */
  chromeRenderMode?: ChromeRenderMode;

  /**
   * When chromeRenderMode is 'iframe', provide iframe contentWindow.
   */
  chromeRenderIframeWindow?: Window;

  /**
   * When using postMessage, configure origin.
   */
  postMessageTargetOrigin?: string;
  postMessageAcceptOrigin?: string | ((origin: string) => boolean);

  /**
   * When using in-process transport, provide a shared bus to connect request/response parties.
   * If omitted, a new bus will be created (useful for tests).
   */
  inProcessBus?: EventTarget;
};

export function createChannels(platform: PlatformType, options: CreateChannelsOptions = {}): {
  service: ServiceChannel;
  render: RenderChannel;
} {
  const common = { debug: options.debug, timeoutMs: options.timeoutMs };

  if (platform === 'chrome') {
    const service = new ServiceChannel(new ChromeRuntimeTransport(), { ...common, source: 'chrome-service' });

    const mode = options.chromeRenderMode ?? 'runtime';
    if (mode === 'iframe') {
      if (!options.chromeRenderIframeWindow) {
        throw new Error('chromeRenderIframeWindow is required when chromeRenderMode=iframe');
      }
      const render = new RenderChannel(
        new WindowPostMessageTransport(options.chromeRenderIframeWindow, {
          targetOrigin: options.postMessageTargetOrigin ?? '*',
          acceptOrigin: options.postMessageAcceptOrigin,
        }),
        { ...common, source: 'chrome-render-iframe' }
      );
      return { service, render };
    }

    if (mode === 'inpage') {
      const render = new RenderChannel(new InProcessTransport(options.inProcessBus), {
        ...common,
        source: 'chrome-render-inpage',
      });
      return { service, render };
    }

    const render = new RenderChannel(new ChromeRuntimeTransport(), { ...common, source: 'chrome-render' });
    return { service, render };
  }

  // mobile
  const service = new ServiceChannel(new FlutterJsChannelTransport(), { ...common, source: 'mobile-service' });

  // RenderChannel is typically iframe-based on mobile.
  // The caller should provide iframe window; if not, create a host-only render channel as a safe default.
  if (options.chromeRenderIframeWindow) {
    const render = new RenderChannel(
      new WindowPostMessageTransport(options.chromeRenderIframeWindow, {
        targetOrigin: options.postMessageTargetOrigin ?? '*',
        acceptOrigin: options.postMessageAcceptOrigin,
      }),
      { ...common, source: 'mobile-render-iframe' }
    );
    return { service, render };
  }

  const render = new RenderChannel(new FlutterJsChannelTransport(), { ...common, source: 'mobile-render-host' });
  return { service, render };
}
