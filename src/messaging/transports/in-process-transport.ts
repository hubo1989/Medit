/**
 * InProcessTransport
 *
 * A raw transport that delivers messages within the same JS context.
 *
 * This is intended for future render modes where rendering happens in the main
 * WebView/page (e.g. using an off-screen container positioned at left/top -99999).
 */

import type { MessageTransport, TransportMeta, Unsubscribe } from './transport';

type MessageEventDetail = {
  message: unknown;
};

export class InProcessTransport implements MessageTransport {
  private readonly bus: EventTarget;

  constructor(bus?: EventTarget) {
    this.bus = bus ?? new EventTarget();
  }

  send(message: unknown): void {
    const event = new CustomEvent<MessageEventDetail>('messaging:inprocess', {
      detail: { message },
    });
    this.bus.dispatchEvent(event);
  }

  onMessage(handler: (message: unknown, meta?: TransportMeta) => void): Unsubscribe {
    const listener = (event: Event): void => {
      const custom = event as CustomEvent<MessageEventDetail>;
      handler(custom.detail?.message, { raw: event });
    };

    this.bus.addEventListener('messaging:inprocess', listener);
    return () => this.bus.removeEventListener('messaging:inprocess', listener);
  }
}
