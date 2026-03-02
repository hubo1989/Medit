import type { PlatformAPI, PlatformBridgeAPI } from './platform';

declare global {
  var platform: PlatformAPI | undefined;
  var bridge: PlatformBridgeAPI | undefined;
}

// Chrome API types extension (keep minimal and avoid `any`)
declare namespace chrome.runtime {
  interface MessageSender {
    url?: string;
    tab?: {
      id?: number;
      url?: string;
      title?: string;
    };
    [key: string]: unknown;
  }
}

export {};
