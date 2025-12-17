/**
 * Messaging public exports
 */

export { BaseMessageChannel } from './base-channel';
export { ServiceChannel } from './channels/service-channel';
export { RenderChannel } from './channels/render-channel';

export { ChromeRuntimeTransport } from './transports/chrome-runtime-transport';
export { FlutterJsChannelTransport } from './transports/flutter-jschannel-transport';
export { WindowPostMessageTransport } from './transports/window-postmessage-transport';
export { InProcessTransport } from './transports/in-process-transport';

export { createChannels } from './channel-factory';
export type { CreateChannelsOptions, ChromeRenderMode } from './channel-factory';
