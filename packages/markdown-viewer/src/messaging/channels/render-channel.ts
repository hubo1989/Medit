/**
 * RenderChannel
 *
 * Channel dedicated to render-worker communication.
 */

import { BaseMessageChannel, type ChannelOptions } from '../base-channel';
import type { MessageTransport } from '../transports/transport';

export class RenderChannel extends BaseMessageChannel {
  constructor(transport: MessageTransport, options: ChannelOptions = {}) {
    super(transport, options);
  }
}
