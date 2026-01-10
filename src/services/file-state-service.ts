/**
 * Unified File State Service
 *
 * Provides consistent file state API (scroll position, TOC visibility, etc.)
 * across platforms using ServiceChannel.
 * 
 * Backend handlers:
 * - Chrome: chrome/src/host/background.ts → handleFileStateOperationEnvelope
 * - Firefox: firefox/src/host/background.ts → handleFileStateOperationEnvelope
 * - Mobile: Flutter main.dart → _handleFileStateOperation
 */

import type { ServiceChannel } from '../messaging/channels/service-channel';
import type { FileState } from '../types/core';

export class FileStateService {
  constructor(private channel: ServiceChannel) {}

  /**
   * Get file state for a URL
   * @param url - Document URL (without hash)
   */
  async get(url: string): Promise<FileState> {
    const result = await this.channel.send('FILE_STATE_OPERATION', {
      operation: 'get',
      url,
    });
    
    if (result && typeof result === 'object') {
      return result as FileState;
    }
    return {};
  }

  /**
   * Save file state (fire and forget)
   * @param url - Document URL (without hash)
   * @param state - State to save (will be merged with existing state)
   */
  set(url: string, state: FileState): void {
    // Use post() for fire-and-forget (no response needed)
    this.channel.post('FILE_STATE_OPERATION', {
      operation: 'set',
      url,
      state,
    });
  }

  /**
   * Clear file state for a URL
   * @param url - Document URL (without hash)
   */
  async clear(url: string): Promise<void> {
    await this.channel.send('FILE_STATE_OPERATION', {
      operation: 'clear',
      url,
    });
  }
}
