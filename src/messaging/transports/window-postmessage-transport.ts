/**
 * WindowPostMessageTransport
 *
 * Raw transport for window.postMessage-based messaging (e.g. parent ↔ iframe).
 */

import type { MessageTransport, TransportMeta, Unsubscribe } from './transport';

export type WindowPostMessageTransportOptions = {
  targetOrigin?: string;
  acceptOrigin?: string | ((origin: string) => boolean);
  acceptSource?: MessageEventSource | null | ((source: MessageEventSource | null) => boolean);
};

export class WindowPostMessageTransport implements MessageTransport {
  private readonly targetWindow: Window;
  private readonly targetOrigin: string;
  private readonly acceptOrigin?: string | ((origin: string) => boolean);
  private readonly acceptSource?:
    | MessageEventSource
    | null
    | ((source: MessageEventSource | null) => boolean);

  constructor(targetWindow: Window, options: WindowPostMessageTransportOptions = {}) {
    this.targetWindow = targetWindow;
    this.targetOrigin = options.targetOrigin ?? '*';
    this.acceptOrigin = options.acceptOrigin;
    this.acceptSource = options.acceptSource;
  }

  send(message: unknown): void {
    this.targetWindow.postMessage(message, this.targetOrigin);
  }

  onMessage(handler: (message: unknown, meta?: TransportMeta) => void): Unsubscribe {
    const listener = (event: MessageEvent) => {
      if (this.acceptOrigin) {
        const ok =
          typeof this.acceptOrigin === 'function'
            ? this.acceptOrigin(event.origin)
            : event.origin === this.acceptOrigin;
        if (!ok) return;
      }

      if (this.acceptSource) {
        const ok =
          typeof this.acceptSource === 'function'
            ? this.acceptSource(event.source)
            : event.source === this.acceptSource;
        if (!ok) return;
      }

      const meta: TransportMeta = {
        raw: event,
        respond: (message: unknown) => {
          try {
            const source = event.source;
            if (source && typeof (source as Window).postMessage === 'function') {
              (source as Window).postMessage(message, event.origin || '*');
              return;
            }
          } catch {
            // Ignore and fallback.
          }
          this.targetWindow.postMessage(message, this.targetOrigin);
        },
      };
      handler(event.data, meta);
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }
}
