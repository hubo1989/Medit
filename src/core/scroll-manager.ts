// Scroll Position Manager
// Handles saving and restoring scroll positions using line numbers

import type { PlatformAPI, ResponseEnvelope } from '../types/index';
import { getLineForScrollPosition, scrollToLine } from './line-based-scroll';

interface ScrollManager {
  cancelScrollRestore(): void;
  restoreScrollPosition(scrollLine: number): void;
  getSavedScrollLine(): Promise<number>;
  getCurrentScrollLine(): number;
}

/**
 * Creates a scroll manager for handling scroll position persistence.
 * Uses line numbers instead of pixel positions for stability during
 * streaming/async rendering.
 * 
 * @param platform - Platform API for messaging
 * @param getCurrentDocumentUrl - Function to get current document URL
 * @returns Scroll manager instance
 */
export function createScrollManager(platform: PlatformAPI, getCurrentDocumentUrl: () => string): ScrollManager {
  // Flag to stop scroll position restoration when user interacts
  let stopScrollRestore = false;

  let requestCounter = 0;
  const createRequestId = (): string => {
    requestCounter += 1;
    return `${Date.now()}-${requestCounter}`;
  };

  const sendScrollOperation = async (payload: Record<string, unknown>): Promise<unknown> => {
    const response = await platform.message.send({
      id: createRequestId(),
      type: 'SCROLL_OPERATION',
      payload,
      timestamp: Date.now(),
      source: 'content-scroll',
    });

    if (!response || typeof response !== 'object') {
      throw new Error('No response received from background script');
    }

    const env = response as ResponseEnvelope;
    if (env.ok) {
      return env.data;
    }

    throw new Error(env.error?.message || 'Scroll operation failed');
  };

  /**
   * Get current scroll position as line number
   */
  function getCurrentScrollLine(): number {
    return getLineForScrollPosition({ useWindowScroll: true }) ?? 0;
  }

  /**
   * Stop the automatic scroll position restoration
   */
  function cancelScrollRestore(): void {
    stopScrollRestore = true;
  }

  /**
   * Restore scroll position after rendering using line number
   * @param scrollLine - The saved line number to restore
   */
  function restoreScrollPosition(scrollLine: number): void {
    // Reset flag for new restoration
    stopScrollRestore = false;

    if (scrollLine <= 0) {
      // For line 0, just scroll to top immediately
      window.scrollTo(0, 0);
      platform.message
        .send({
          id: createRequestId(),
          type: 'SCROLL_OPERATION',
          payload: {
            operation: 'clear',
            url: getCurrentDocumentUrl(),
          },
          timestamp: Date.now(),
          source: 'content-scroll',
        })
        .catch(() => {}); // Ignore errors
      return;
    }

    // Clear saved position
    platform.message
      .send({
        id: createRequestId(),
        type: 'SCROLL_OPERATION',
        payload: {
          operation: 'clear',
          url: getCurrentDocumentUrl(),
        },
        timestamp: Date.now(),
        source: 'content-scroll',
      })
      .catch(() => {}); // Ignore errors

    // Debounced scroll adjustment
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    const adjustmentTimeout = 5000; // Stop adjusting after 5 seconds
    const startTime = Date.now();

    // Listen for user scroll to stop restoration
    const onUserScroll = (): void => {
      stopScrollRestore = true;
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('keydown', onUserKeydown);
      window.removeEventListener('touchmove', onUserScroll);
    };

    const onUserKeydown = (e: KeyboardEvent): void => {
      // Stop on navigation keys
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        onUserScroll();
      }
    };

    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('keydown', onUserKeydown);
    window.addEventListener('touchmove', onUserScroll, { passive: true });

    const adjustScroll = (): void => {
      if (stopScrollRestore || Date.now() - startTime > adjustmentTimeout) {
        // Cleanup listeners when stopping
        window.removeEventListener('wheel', onUserScroll);
        window.removeEventListener('keydown', onUserKeydown);
        window.removeEventListener('touchmove', onUserScroll);
        return;
      }

      // Cancel previous timer if exists
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      // Schedule scroll after 100ms of no changes
      scrollTimer = setTimeout(() => {
        if (!stopScrollRestore) {
          // Use line-based scrolling
          scrollToLine(scrollLine, { useWindowScroll: true });
        }
      }, 100);
    };

    // Trigger initial scroll
    adjustScroll();

    // Monitor images loading
    const images = document.querySelectorAll('#markdown-content img');
    images.forEach(img => {
      if (!(img as HTMLImageElement).complete) {
        img.addEventListener('load', adjustScroll, { once: true });
        img.addEventListener('error', adjustScroll, { once: true });
      }
    });

    // Monitor async placeholders being replaced
    const observer = new MutationObserver(() => {
      adjustScroll();
    });

    const contentElement = document.getElementById('markdown-content');
    if (contentElement) {
      observer.observe(contentElement, {
        childList: true,
        subtree: true
      });
    }

    // Stop observing after timeout
    setTimeout(() => {
      observer.disconnect();
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('keydown', onUserKeydown);
      window.removeEventListener('touchmove', onUserScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    }, adjustmentTimeout);
  }

  /**
   * Get saved scroll line from background script
   * @returns Saved scroll line number
   */
  async function getSavedScrollLine(): Promise<number> {
    const currentScrollLine = getCurrentScrollLine();

    // Get saved scroll line from background script
    try {
      const data = await sendScrollOperation({
        operation: 'get',
        url: getCurrentDocumentUrl(),
      });

      if (typeof data === 'number' && currentScrollLine === 0) {
        return data;
      }
    } catch (e) {
      // Failed to get saved position, use default
    }

    return currentScrollLine;
  }

  return {
    cancelScrollRestore,
    restoreScrollPosition,
    getSavedScrollLine,
    getCurrentScrollLine
  };
}
