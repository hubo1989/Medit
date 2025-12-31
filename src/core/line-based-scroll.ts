/**
 * Line-Based Scroll Manager
 * 
 * Unified scroll position management based on source line numbers.
 * More stable than absolute pixel positions because line numbers
 * are tied to content, not layout.
 * 
 * Used by both Chrome extension and VSCode extension.
 */

const CODE_LINE_CLASS = 'code-line';

/**
 * Element with source line information
 */
export interface CodeLineElement {
  element: HTMLElement;
  line: number;
  lineCount?: number;  // Number of source lines in this block
}

/**
 * Get all elements with source line information
 */
export function getCodeLineElements(container?: HTMLElement): CodeLineElement[] {
  const elements: CodeLineElement[] = [];
  const root = container || document;
  
  for (const el of root.getElementsByClassName(CODE_LINE_CLASS)) {
    if (!(el instanceof HTMLElement)) continue;
    
    const lineAttr = el.getAttribute('data-line');
    if (!lineAttr) continue;
    
    const line = parseInt(lineAttr, 10);
    if (isNaN(line)) continue;
    
    const lineCountAttr = el.getAttribute('data-line-count');
    const lineCount = lineCountAttr ? parseInt(lineCountAttr, 10) : undefined;
    
    elements.push({ element: el, line, lineCount });
  }
  
  // Sort by line number
  elements.sort((a, b) => a.line - b.line);
  return elements;
}

/**
 * Find elements for a specific source line
 */
export function getElementsForSourceLine(
  targetLine: number,
  container?: HTMLElement
): { previous?: CodeLineElement; next?: CodeLineElement } {
  const elements = getCodeLineElements(container);
  if (elements.length === 0) return {};
  
  let previous = elements[0];
  
  for (const entry of elements) {
    if (entry.line === targetLine) {
      return { previous: entry };
    } else if (entry.line > targetLine) {
      return { previous, next: entry };
    }
    previous = entry;
  }
  
  return { previous };
}

/**
 * Options for getting line from scroll position
 */
export interface GetLineOptions {
  /** Content container element (for VSCode webview) */
  container?: HTMLElement;
  /** Whether using window scroll (true for Chrome) or container scroll (false for VSCode) */
  useWindowScroll?: boolean;
}

/**
 * Get line number for current scroll position
 * Inverse of scrollToLine - calculates source line from pixel position
 */
export function getLineForScrollPosition(options: GetLineOptions = {}): number | null {
  const { container, useWindowScroll = true } = options;
  
  const elements = getCodeLineElements(container);
  if (elements.length === 0) return null;
  
  let scrollTop: number;
  let viewportTop: number;
  
  if (useWindowScroll) {
    scrollTop = window.scrollY || window.pageYOffset || 0;
    viewportTop = 0;
  } else if (container) {
    scrollTop = container.scrollTop;
    viewportTop = container.getBoundingClientRect().top;
  } else {
    return null;
  }
  
  // Find the block that contains the current scroll position
  let previous = elements[0];
  
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const rect = el.element.getBoundingClientRect();
    const blockTop = useWindowScroll 
      ? rect.top + scrollTop 
      : rect.top - viewportTop + scrollTop;
    
    // If this block starts after current scroll position, previous is our target
    if (blockTop > scrollTop) {
      break;
    }
    
    previous = el;
  }
  
  // Get previous block position and height
  const prevRect = previous.element.getBoundingClientRect();
  const blockTop = useWindowScroll 
    ? prevRect.top + scrollTop 
    : prevRect.top - viewportTop + scrollTop;
  const blockHeight = prevRect.height;
  
  // Calculate line range for this block
  let blockLineCount: number;
  if (previous.lineCount && previous.lineCount > 0) {
    blockLineCount = previous.lineCount;
  } else {
    // Find next block to calculate line count
    let nextBlockLine: number | undefined;
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].line > previous.line) {
        nextBlockLine = elements[i].line;
        break;
      }
    }
    blockLineCount = nextBlockLine ? nextBlockLine - previous.line : 1;
  }
  
  // Calculate progress within block
  const pixelOffset = scrollTop - blockTop;
  const progress = blockHeight > 0 ? pixelOffset / blockHeight : 0;
  
  // Clamp progress to [0, 1]
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  // Calculate line number
  return previous.line + clampedProgress * blockLineCount;
}

/**
 * Options for scrolling to line
 */
export interface ScrollToLineOptions {
  /** Content container element (for VSCode webview) */
  container?: HTMLElement;
  /** Whether using window scroll (true for Chrome) or container scroll (false for VSCode) */
  useWindowScroll?: boolean;
  /** Scroll behavior */
  behavior?: ScrollBehavior;
}

/**
 * Scroll to reveal a specific source line
 * @returns true if scroll was performed, false if no suitable element found or line out of range
 */
export function scrollToLine(line: number, options: ScrollToLineOptions = {}): boolean {
  const { container, useWindowScroll = true, behavior = 'auto' } = options;
  
  // Special case: line <= 0 means scroll to top
  if (line <= 0) {
    if (useWindowScroll) {
      window.scrollTo({ top: 0, behavior });
    } else if (container) {
      container.scrollTo({ top: 0, behavior });
    }
    return true;
  }
  
  const { previous, next } = getElementsForSourceLine(line, container);
  
  if (!previous) {
    return false;
  }
  
  // Calculate line range for this block
  let blockLineCount: number;
  if (previous.lineCount && previous.lineCount > 0) {
    blockLineCount = previous.lineCount;
  } else if (next) {
    blockLineCount = next.line - previous.line;
  } else {
    // Last block with no lineCount - assume 1 line
    blockLineCount = 1;
  }
  
  // If target line is beyond the last block's range, don't scroll yet
  // (content may still be loading/rendering)
  const lastLineInBlock = previous.line + blockLineCount;
  if (!next && line > lastLineInBlock) {
    // Target line is beyond rendered content, skip scrolling
    return false;
  }
  
  let currentScroll: number;
  let viewportTop: number;
  
  if (useWindowScroll) {
    currentScroll = window.scrollY || window.pageYOffset || 0;
    viewportTop = 0;
  } else if (container) {
    const containerRect = container.getBoundingClientRect();
    currentScroll = container.scrollTop;
    viewportTop = containerRect.top;
  } else {
    return false;
  }
  
  // Get previous block position and height
  const rect = previous.element.getBoundingClientRect();
  const blockTop = useWindowScroll 
    ? rect.top + currentScroll 
    : rect.top - viewportTop + currentScroll;
  const blockHeight = rect.height;
  
  // Calculate offset within block
  const lineOffset = line - previous.line;
  const progress = blockLineCount > 0 ? lineOffset / blockLineCount : 0;
  
  // Clamp progress to [0, 1] to stay within block bounds
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  // Calculate target pixel position
  const scrollTo = blockTop + clampedProgress * blockHeight;
  
  // Perform scroll
  if (useWindowScroll) {
    window.scrollTo({ top: Math.max(0, scrollTo), behavior });
  } else if (container) {
    container.scrollTo({ top: Math.max(0, scrollTo), behavior });
  }
  
  return true;
}

/**
 * Line-based scroll state for persistence
 */
export interface LineScrollState {
  /** Source line number (with fractional part for position within block) */
  line: number;
  /** Timestamp when saved */
  timestamp: number;
}

/**
 * Scroll sync controller interface
 * Manages bi-directional scroll sync with user interaction detection
 */
export interface ScrollSyncController {
  /** Set target line from source (e.g., editor) */
  setTargetLine(line: number): void;
  /** Get current scroll position as line number */
  getCurrentLine(): number | null;
  /** Check if user has manually scrolled */
  hasUserScrolled(): boolean;
  /** Reset user scroll state (call on file switch) */
  resetUserScroll(): void;
  /** Reposition to target line if user hasn't scrolled (call after content changes) */
  reposition(): void;
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
  /** Whether using window scroll (true for Chrome) or container scroll (false for VSCode) */
  useWindowScroll?: boolean;
  /** Callback when user scrolls (for reverse sync) */
  onUserScroll?: (line: number) => void;
  /** Debounce time for user scroll callback (ms) */
  userScrollDebounceMs?: number;
}

/**
 * Create a scroll sync controller that:
 * 1. Tracks target line from source (editor)
 * 2. Auto-repositions on content changes if user hasn't scrolled
 * 3. Detects user-initiated scroll vs programmatic scroll
 * 4. Reports user scroll for reverse sync
 */
export function createScrollSyncController(options: ScrollSyncControllerOptions): ScrollSyncController {
  const {
    container,
    useWindowScroll = false,
    onUserScroll,
    userScrollDebounceMs = 50,
  } = options;

  // Current target line (always kept up-to-date from any source)
  let targetLine: number = 0;
  // Is current scroll gesture from user interaction?
  let isUserScrolling = false;
  let userScrollResetTimer: ReturnType<typeof setTimeout> | null = null;
  let userScrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastContentHeight = 0;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let disposed = false;

  const scrollOptions: ScrollToLineOptions = {
    container,
    useWindowScroll,
  };

  const getLineOptions: GetLineOptions = {
    container,
    useWindowScroll,
  };

  // Get scroll target (window or container)
  const getScrollTarget = (): HTMLElement | Window => {
    return useWindowScroll ? window : container;
  };

  /**
   * Mark scroll as user-initiated
   */
  const markUserScroll = (): void => {
    isUserScrolling = true;
    
    if (userScrollResetTimer) clearTimeout(userScrollResetTimer);
    userScrollResetTimer = setTimeout(() => {
      isUserScrolling = false;
    }, 200);
  };

  /**
   * Handle scroll event - only update targetLine on user scroll
   */
  const handleScroll = (): void => {
    if (disposed) return;

    // Only update targetLine and notify when user initiates scroll
    // Program scroll (from setTargetLine) should NOT update targetLine
    if (isUserScrolling) {
      const currentLine = getLineForScrollPosition(getLineOptions);
      if (currentLine !== null && !isNaN(currentLine)) {
        targetLine = currentLine;
        
        // Report to source (editor) for reverse sync
        if (onUserScroll) {
          if (userScrollDebounceTimer) clearTimeout(userScrollDebounceTimer);
          userScrollDebounceTimer = setTimeout(() => {
            if (!disposed) {
              onUserScroll(currentLine);
            }
          }, userScrollDebounceMs);
        }
      }
    }
  };

  /**
   * Check content height and reposition if needed
   */
  const checkAndReposition = (): void => {
    if (disposed) return;

    const currentHeight = container.scrollHeight;
    if (currentHeight !== lastContentHeight) {
      lastContentHeight = currentHeight;
      // Content changed, reposition to targetLine
      scrollToLine(targetLine, scrollOptions);
    }
  };

  /**
   * Setup event listeners
   */
  const setupListeners = (): void => {
    const target = getScrollTarget();

    // User interaction events (detect user-initiated scroll)
    target.addEventListener('wheel', markUserScroll, { passive: true });
    target.addEventListener('touchmove', markUserScroll, { passive: true });
    target.addEventListener('keydown', (e: Event) => {
      const key = (e as KeyboardEvent).key;
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(key)) {
        markUserScroll();
      }
    });

    // Scroll event (update targetLine and optionally sync to editor)
    target.addEventListener('scroll', handleScroll, { passive: true });

    // Monitor content changes for auto-reposition (immediate)
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        // Use requestAnimationFrame for immediate visual update
        requestAnimationFrame(checkAndReposition);
      });
      resizeObserver.observe(container);
      
      // Also observe the content element inside container for better detection
      const contentEl = container.querySelector('#markdown-content');
      if (contentEl) {
        resizeObserver.observe(contentEl);
      }
    }

    mutationObserver = new MutationObserver(() => {
      // Immediate reposition on DOM change
      requestAnimationFrame(checkAndReposition);
    });
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  };

  /**
   * Remove event listeners
   */
  const removeListeners = (): void => {
    const target = getScrollTarget();

    target.removeEventListener('wheel', markUserScroll);
    target.removeEventListener('touchmove', markUserScroll);
    target.removeEventListener('scroll', handleScroll);

    resizeObserver?.disconnect();
    mutationObserver?.disconnect();

    if (userScrollResetTimer) clearTimeout(userScrollResetTimer);
    if (userScrollDebounceTimer) clearTimeout(userScrollDebounceTimer);
  };

  return {
    setTargetLine(line: number): void {
      targetLine = line;
      // Scroll to target
      scrollToLine(line, scrollOptions);
      lastContentHeight = container.scrollHeight;
    },

    getCurrentLine(): number | null {
      return getLineForScrollPosition(getLineOptions);
    },

    hasUserScrolled(): boolean {
      return isUserScrolling;
    },

    resetUserScroll(): void {
      isUserScrolling = false;
      targetLine = 0;
      // Scroll to top
      scrollToLine(0, scrollOptions);
      lastContentHeight = container.scrollHeight;
    },

    reposition(): void {
      // Always reposition to targetLine
      if (!disposed) {
        scrollToLine(targetLine, scrollOptions);
        lastContentHeight = container.scrollHeight;
      }
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
