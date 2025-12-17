/**
 * ServiceChannel
 *
 * Channel for platform services (storage, cache, resource, file, etc.).
 */

import { BaseMessageChannel, type ChannelOptions } from '../base-channel';
import type { MessageTransport } from '../transports/transport';

export class ServiceChannel extends BaseMessageChannel {
  constructor(transport: MessageTransport, options: ChannelOptions = {}) {
    super(transport, options);
  }
}
