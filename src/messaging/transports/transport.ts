/**
 * Transport Interface
 *
 * A transport is responsible for sending/receiving raw messages across an
 * execution boundary (runtime messaging, postMessage, Flutter JS channel, etc.).
 */

export type Unsubscribe = () => void;

export type TransportMeta = {
  /**
   * Optional responder that replies to the sender using the underlying transport
   * primitives (e.g. chrome.runtime.sendResponse).
   */
  respond?: (message: unknown) => void;

  /**
   * Transport-specific metadata (sender, MessageEvent, etc.).
   */
  raw?: unknown;
};

export interface MessageTransport {
  /**
   * Send a raw message.
   *
   * Some transports (e.g. chrome.runtime.sendMessage) can return an immediate
   * response via callback. In that case, return the response so the channel can
   * resolve the pending request without waiting for a separate inbound message.
   */
  send(message: unknown): Promise<unknown> | unknown | void;

  /**
   * Subscribe to raw incoming messages.
   */
  onMessage(handler: (message: unknown, meta?: TransportMeta) => void): Unsubscribe;

  /**
   * Optional cleanup.
   */
  close?(): void;
}
