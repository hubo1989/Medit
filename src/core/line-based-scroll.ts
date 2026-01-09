/**
 * Line-Based Scroll Manager
 * 
 * Scroll synchronization based on block IDs and source line numbers.
 * Uses MarkdownDocument for line mapping, DOM only for pixel calculations.
 */

/**
 * Interface for document line mapping (provided by MarkdownDocument)
 */
export interface LineMapper {
  /** Convert blockId + progress to source line number */
  getLineFromBlockId(blockId: string, progress: number): number | null;
  /** Convert source line to blockId + progress */
  getBlockPositionFromLine(line: number): { blockId: string; progress: number } | null;
}

/**
 * Options for scroll operations
 */
export interface ScrollOptions {
  /** Content container element */
  container: HTMLElement;
  /** Whether using window scroll (true for Chrome) or container scroll (false for VSCode) */
  useWindowScroll?: boolean;
  /** Scroll behavior */
  behavior?: ScrollBehavior;
}

/**
 * Find the block element at current scroll position
 * @returns blockId and progress (0-1) within that block
 */
export function getBlockAtScrollPosition(options: ScrollOptions): { blockId: string; progress: number } | null {
  const { container, useWindowScroll = true } = options;
  
  // Get all block elements
  const blocks = container.querySelectorAll<HTMLElement>('[data-block-id]');
  if (blocks.length === 0) return null;
  
  // Get current scroll position
  let scrollTop: number;
  let viewportTop: number;
  
  if (useWindowScroll) {
    scrollTop = window.scrollY || window.pageYOffset || 0;
    viewportTop = 0;
  } else {
    scrollTop = container.scrollTop;
    viewportTop = container.getBoundingClientRect().top;
  }
  
  // Find the block containing current scroll position
  let targetBlock: HTMLElement | null = null;
  
  for (const block of blocks) {
    const rect = block.getBoundingClientRect();
    const blockTop = useWindowScroll 
      ? rect.top + scrollTop 
      : rect.top - viewportTop + scrollTop;
    
    if (blockTop > scrollTop) {
      break;
    }
    targetBlock = block;
  }
  
  if (!targetBlock) {
    targetBlock = blocks[0] as HTMLElement;
  }
  
  const blockId = targetBlock.getAttribute('data-block-id');
  if (!blockId) return null;
  
  // Calculate progress within block
  const rect = targetBlock.getBoundingClientRect();
  const blockTop = useWindowScroll 
    ? rect.top + scrollTop 
    : rect.top - viewportTop + scrollTop;
  const blockHeight = rect.height;
  
  const pixelOffset = scrollTop - blockTop;
  const progress = blockHeight > 0 ? Math.max(0, Math.min(1, pixelOffset / blockHeight)) : 0;
  
  return { blockId, progress };
}

/**
 * Scroll to a specific block with progress
 * @returns true if scroll was performed
 */
export function scrollToBlock(
  blockId: string, 
  progress: number, 
  options: ScrollOptions
): boolean {
  const { container, useWindowScroll = true, behavior = 'auto' } = options;
  
  // Find the block element
  const block = container.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
  if (!block) return false;
  
  // Get current scroll context
  let currentScroll: number;
  let viewportTop: number;
  
  if (useWindowScroll) {
    currentScroll = window.scrollY || window.pageYOffset || 0;
    viewportTop = 0;
  } else {
    currentScroll = container.scrollTop;
    viewportTop = container.getBoundingClientRect().top;
  }
  
  // Calculate target scroll position
  const rect = block.getBoundingClientRect();
  const blockTop = useWindowScroll 
    ? rect.top + currentScroll 
    : rect.top - viewportTop + currentScroll;
  const blockHeight = rect.height;
  
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const scrollTo = blockTop + clampedProgress * blockHeight;
  
  // Perform scroll
  if (useWindowScroll) {
    window.scrollTo({ top: Math.max(0, scrollTo), behavior });
  } else {
    container.scrollTo({ top: Math.max(0, scrollTo), behavior });
  }
  
  return true;
}

/**
 * Get current scroll position as source line number
 * Returns null if no blocks in DOM or lineMapper unavailable
 */
export function getLineForScrollPosition(
  lineMapper: LineMapper | null | undefined,
  options: ScrollOptions
): number | null {
  if (!lineMapper) return null;
  
  const pos = getBlockAtScrollPosition(options);
  if (!pos) return null;
  
  return lineMapper.getLineFromBlockId(pos.blockId, pos.progress);
}

/**
 * Scroll to reveal a specific source line
 * @returns true if scroll was performed
 */
export function scrollToLine(
  line: number, 
  lineMapper: LineMapper | null | undefined,
  options: ScrollOptions
): boolean {
  const { container, useWindowScroll = true, behavior = 'auto' } = options;
  
  // Special case: line <= 0 means scroll to top
  if (line <= 0) {
    if (useWindowScroll) {
      window.scrollTo({ top: 0, behavior });
    } else {
      container.scrollTo({ top: 0, behavior });
    }
    return true;
  }
  
  // If no lineMapper, can't scroll to line
  if (!lineMapper) return false;
  
  const pos = lineMapper.getBlockPositionFromLine(line);
  if (!pos) return false;
  
  return scrollToBlock(pos.blockId, pos.progress, options);
}

/**
 * Scroll state constants
 * @see line-based-scroll.md for state machine design
 */
export type ScrollStateType = 'INITIAL' | 'RESTORING' | 'TRACKING' | 'LOCKED';

export const ScrollState: Record<ScrollStateType, ScrollStateType> = {
  /** Initial state - waiting for setTargetLine */
  INITIAL: 'INITIAL',
  /** Restoring state - waiting for DOM to be tall enough to jump */
  RESTORING: 'RESTORING',
  /** Tracking state - responding to user scroll, updating targetLine */
  TRACKING: 'TRACKING',
  /** Locked state - during programmatic scroll */
  LOCKED: 'LOCKED',
};

/**
 * Scroll sync controller interface
 */
export interface ScrollSyncController {
  /** Set target line from source (e.g., editor or restore) */
  setTargetLine(line: number): void;
  /** Get current scroll position as line number */
  getCurrentLine(): number | null;
  /** Notify that streaming has completed */
  onStreamingComplete(): void;
  /** Reset to initial state (call when document changes) */
  reset(): void;
  /** Get current state (for testing/debugging) */
  getState(): ScrollStateType;
  /** Start the controller */
  start(): void;
  /** Stop and cleanup */
  dispose(): void;
}

/**
 * Options for scroll sync controller
 */
export interface ScrollSyncControllerOptions {
  /** Content container element */
  container: HTMLElement;
  /** Line mapper getter (called each time to get latest document state) */
  getLineMapper: () => LineMapper;
  /** Whether using window scroll (true for Chrome) or container scroll (false for VSCode) */
  useWindowScroll?: boolean;
  /** Callback when user scrolls (for reverse sync) */
  onUserScroll?: (line: number) => void;
  /** Debounce time for user scroll callback (ms) */
  userScrollDebounceMs?: number;
  /** Lock duration after programmatic scroll (ms) */
  lockDurationMs?: number;
}

/**
 * Create a scroll sync controller
 * 
 * State machine:
 * - INITIAL: waiting for setTargetLine
 * - RESTORING: waiting for DOM to be tall enough
 * - TRACKING: tracking user scroll
 * - LOCKED: during programmatic scroll
 * 
 * @see line-based-scroll.md for detailed design
 */
export function createScrollSyncController(options: ScrollSyncControllerOptions): ScrollSyncController {
  const {
    container,
    getLineMapper,
    useWindowScroll = false,
    onUserScroll,
    userScrollDebounceMs = 50,
    lockDurationMs = 100,
  } = options;

  // State variables
  let state: ScrollStateType = ScrollState.INITIAL;
  let targetLine: number = 0;
  let lastContentHeight = 0;
  let lockTimer: ReturnType<typeof setTimeout> | null = null;
  let userScrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let disposed = false;

  const scrollOptions: ScrollOptions = {
    container,
    useWindowScroll,
  };

  const getScrollTarget = (): HTMLElement | Window => {
    return useWindowScroll ? window : container;
  };

  /**
   * Get scroll position for target line
   * Returns null if block doesn't exist or not yet laid out (height = 0)
   */
  const getScrollPositionForLine = (line: number): number | null => {
    if (line <= 0) return 0;
    
    const lineMapper = getLineMapper();
    if (!lineMapper) return null;
    
    const pos = lineMapper.getBlockPositionFromLine(line);
    if (!pos) return null;
    
    const block = container.querySelector<HTMLElement>(`[data-block-id="${pos.blockId}"]`);
    if (!block) return null;
    
    const rect = block.getBoundingClientRect();
    
    // Block exists but not yet laid out (height = 0)
    // This can happen when DOM element is added but layout hasn't completed
    if (rect.height <= 0) return null;
    
    let currentScroll: number;
    let viewportTop: number;
    
    if (useWindowScroll) {
      currentScroll = window.scrollY || window.pageYOffset || 0;
      viewportTop = 0;
    } else {
      currentScroll = container.scrollTop;
      viewportTop = container.getBoundingClientRect().top;
    }
    
    const blockTop = useWindowScroll 
      ? rect.top + currentScroll 
      : rect.top - viewportTop + currentScroll;
    const blockHeight = rect.height;
    
    return blockTop + pos.progress * blockHeight;
  };

  /**
   * Get viewport height
   */
  const getViewportHeight = (): number => {
    return useWindowScroll ? window.innerHeight : container.clientHeight;
  };

  /**
   * Check if we can scroll to target position
   * Condition: target block exists (position can be calculated)
   * Browser will clamp scroll position to valid range automatically
   */
  const canScrollToTarget = (): boolean => {
    const targetPos = getScrollPositionForLine(targetLine);
    return targetPos !== null;
  };

  /**
   * Perform scroll to target line
   */
  const doScroll = (line: number): void => {
    scrollToLine(line, getLineMapper(), scrollOptions);
  };

  /**
   * Enter LOCKED state with timer
   */
  const enterLocked = (): void => {
    state = ScrollState.LOCKED;
    if (lockTimer) clearTimeout(lockTimer);
    lockTimer = setTimeout(() => {
      if (!disposed && state === ScrollState.LOCKED) {
        state = ScrollState.TRACKING;
      }
    }, lockDurationMs);
  };

  /**
   * Update targetLine from current scroll position
   */
  const updateTargetLineFromScroll = (): void => {
    const currentLine = getLineForScrollPosition(getLineMapper(), scrollOptions);
    if (currentLine !== null && !isNaN(currentLine)) {
      targetLine = currentLine;
    }
  };

  /**
   * Report user scroll position (debounced)
   */
  const reportUserScroll = (): void => {
    if (!onUserScroll) return;
    
    const currentLine = getLineForScrollPosition(getLineMapper(), scrollOptions);
    if (currentLine === null || isNaN(currentLine)) return;
    
    if (userScrollDebounceTimer) clearTimeout(userScrollDebounceTimer);
    
    if (userScrollDebounceMs <= 0) {
      // No debounce - call immediately
      onUserScroll(currentLine);
    } else {
      userScrollDebounceTimer = setTimeout(() => {
        if (!disposed) {
          onUserScroll(currentLine);
        }
      }, userScrollDebounceMs);
    }
  };

  /**
   * Handle scroll event based on current state
   */
  const handleScroll = (): void => {
    if (disposed) return;

    switch (state) {
      case ScrollState.INITIAL:
      case ScrollState.RESTORING:
        // Ignore scroll events in INITIAL and RESTORING states
        // RESTORING: scroll events are caused by DOM changes, not user interaction
        break;

      case ScrollState.TRACKING:
        // Update targetLine and report
        updateTargetLineFromScroll();
        reportUserScroll();
        break;

      case ScrollState.LOCKED:
        // Update targetLine but don't report
        updateTargetLineFromScroll();
        break;
    }
  };

  /**
   * Handle DOM content change based on current state
   */
  const handleContentChange = (): void => {
    if (disposed) return;

    const currentHeight = container.scrollHeight;
    if (currentHeight === lastContentHeight) return;
    lastContentHeight = currentHeight;

    switch (state) {
      case ScrollState.INITIAL:
        // Ignore DOM changes in INITIAL state
        break;

      case ScrollState.RESTORING:
        // Check if we can jump now
        if (canScrollToTarget()) {
          doScroll(targetLine);
          enterLocked();
        }
        // Otherwise stay in RESTORING
        break;

      case ScrollState.TRACKING:
        // Maintain position
        doScroll(targetLine);
        enterLocked();
        break;

      case ScrollState.LOCKED:
        // Re-scroll and reset timer
        doScroll(targetLine);
        enterLocked();
        break;
    }
  };

  /**
   * Handle viewport resize (window/container size change)
   * Re-scroll to maintain reading position during resize
   */
  const handleResize = (): void => {
    if (disposed) return;

    // Update lastContentHeight in case it changed
    lastContentHeight = container.scrollHeight;

    switch (state) {
      case ScrollState.INITIAL:
      case ScrollState.RESTORING:
        // Don't interfere during initial load
        break;

      case ScrollState.TRACKING:
      case ScrollState.LOCKED:
        // Maintain position on resize
        doScroll(targetLine);
        enterLocked();
        break;
    }
  };

  const setupListeners = (): void => {
    const target = getScrollTarget();

    target.addEventListener('scroll', handleScroll, { passive: true });

    // ResizeObserver for viewport resize (width change causes text reflow)
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(handleResize);
      });
      resizeObserver.observe(container);
    }

    // MutationObserver for content changes (streaming, dynamic rendering)
    mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(handleContentChange);
    });
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  };

  const removeListeners = (): void => {
    const target = getScrollTarget();
    target.removeEventListener('scroll', handleScroll);
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    if (userScrollDebounceTimer) clearTimeout(userScrollDebounceTimer);
    if (lockTimer) clearTimeout(lockTimer);
  };

  return {
    setTargetLine(line: number): void {
      targetLine = line;
      
      switch (state) {
        case ScrollState.INITIAL:
          // Check if can jump, otherwise enter RESTORING
          if (canScrollToTarget()) {
            doScroll(line);
            enterLocked();
          } else {
            state = ScrollState.RESTORING;
          }
          break;

        case ScrollState.RESTORING:
          // Update target, check if can jump
          if (canScrollToTarget()) {
            doScroll(line);
            enterLocked();
          }
          // Otherwise stay in RESTORING with new target
          break;

        case ScrollState.TRACKING:
          // Jump immediately
          doScroll(line);
          enterLocked();
          break;

        case ScrollState.LOCKED:
          // Update target, re-scroll, reset timer
          doScroll(line);
          enterLocked();
          break;
      }
      
      lastContentHeight = container.scrollHeight;
    },

    getCurrentLine(): number | null {
      return getLineForScrollPosition(getLineMapper(), scrollOptions);
    },

    onStreamingComplete(): void {
      if (state === ScrollState.RESTORING) {
        // Try to jump to targetLine first
        if (canScrollToTarget()) {
          doScroll(targetLine);
          enterLocked();
        } else {
          // Target block doesn't exist, jump to bottom
          const documentHeight = container.scrollHeight;
          const viewportHeight = getViewportHeight();
          const maxScroll = Math.max(0, documentHeight - viewportHeight);
          
          if (useWindowScroll) {
            window.scrollTo({ top: maxScroll, behavior: 'auto' });
          } else {
            container.scrollTo({ top: maxScroll, behavior: 'auto' });
          }
          
          // Update targetLine to current position
          updateTargetLineFromScroll();
          enterLocked();
        }
      }
      // Ignore in other states
    },

    reset(): void {
      state = ScrollState.INITIAL;
      targetLine = 0;
      lastContentHeight = 0;
      if (lockTimer) {
        clearTimeout(lockTimer);
        lockTimer = null;
      }
    },

    getState(): ScrollStateType {
      return state;
    },

    start(): void {
      if (disposed) return;
      setupListeners();
      lastContentHeight = container.scrollHeight;
    },

    dispose(): void {
      disposed = true;
      removeListeners();
    },
  };
}
