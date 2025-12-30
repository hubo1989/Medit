/**
 * DOM Differ - Incremental DOM updates using morphdom
 * Handles smart diffing with plugin node protection
 */

import morphdom from 'morphdom';

/**
 * Options for DOM diffing
 */
export interface DiffOptions {
  /**
   * Callback when a node is about to be removed.
   * Return false to prevent removal.
   */
  onBeforeNodeDiscarded?: (node: Node) => boolean;
  
  /**
   * Callback when a node is about to be updated.
   * Return false to skip the update.
   */
  onBeforeElUpdated?: (fromEl: HTMLElement, toEl: HTMLElement) => boolean;
  
  /**
   * Callback after diffing is complete
   */
  onComplete?: () => void;
}

/**
 * Get a unique key for a node for morphdom matching.
 * Only plugin nodes use explicit keys; block nodes use position-based matching.
 */
function getNodeKey(node: Node): string | null {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }
  
  const el = node as HTMLElement;
  
  // Block nodes: don't use hash as key (same content = same hash = wrong match)
  // Let morphdom use position-based matching instead
  // The hash is only used in shouldSkipUpdate for optimization
  
  const sourceHash = el.dataset?.sourceHash;
  const pluginType = el.dataset?.pluginType;
  
  // Plugin nodes: use type + hash (plugins are unique by content)
  if (sourceHash && pluginType) {
    return `plugin-${pluginType}-${sourceHash}`;
  }
  
  // Other elements: use id if available
  return el.id || null;
}

/**
 * Check if an element should skip update (block with matching hash or rendered plugin)
 */
function shouldSkipUpdate(fromEl: HTMLElement, toEl: HTMLElement): boolean {
  // Block nodes: skip if hash matches (content identical)
  const fromBlockHash = fromEl.dataset?.blockHash;
  const toBlockHash = toEl.dataset?.blockHash;
  if (fromBlockHash && toBlockHash && fromBlockHash === toBlockHash) {
    return true;
  }
  
  // Plugin nodes: skip if rendered and hash matches
  if (fromEl.dataset?.pluginRendered === 'true' && 
      fromEl.dataset?.sourceHash === toEl.dataset?.sourceHash &&
      fromEl.dataset?.pluginType === toEl.dataset?.pluginType) {
    return true;
  }
  return false;
}

// Cache for last rendered HTML to skip unnecessary diffs
let lastRenderedHtml: string | null = null;

/**
 * Clear the HTML cache (call when file changes)
 */
export function clearHtmlCache(): void {
  lastRenderedHtml = null;
}

/**
 * Perform incremental DOM diff/patch from oldContainer to match newHtml.
 * Preserves already-rendered plugin nodes that have matching content hash.
 * 
 * @param container - The existing DOM container to update
 * @param newHtml - New HTML content to morph to
 * @param options - Diff options
 * @returns true if DOM was updated, false if skipped (HTML unchanged)
 */
export function diffAndPatch(
  container: HTMLElement,
  newHtml: string,
  options: DiffOptions = {}
): boolean {
  // Quick check: if HTML is identical to last render, skip diff entirely
  if (lastRenderedHtml === newHtml) {
    options.onComplete?.();
    return false;
  }
  
  // Create a temporary container with new HTML
  const tempContainer = document.createElement(container.tagName);
  tempContainer.innerHTML = newHtml;
  
  // Perform morphdom diff
  morphdom(container, tempContainer, {
    // Use content hash for plugin node matching
    getNodeKey,
    
    // Only update children, not the container itself
    childrenOnly: true,
    
    // Before updating an element
    onBeforeElUpdated(fromEl, toEl) {
      // Check if this is a rendered plugin that should be preserved
      if (shouldSkipUpdate(fromEl as HTMLElement, toEl as HTMLElement)) {
        return false; // Skip update, keep the rendered version
      }
      
      // Allow external hook
      if (options.onBeforeElUpdated) {
        return options.onBeforeElUpdated(fromEl as HTMLElement, toEl as HTMLElement);
      }
      
      return true;
    },
    
    // Before discarding a node
    onBeforeNodeDiscarded(node) {
      if (options.onBeforeNodeDiscarded) {
        return options.onBeforeNodeDiscarded(node);
      }
      return true;
    }
  });
  
  // Cache the HTML for next comparison
  lastRenderedHtml = newHtml;
  
  // Notify completion
  options.onComplete?.();
  return true;
}

/**
 * Check if incremental update is possible.
 * Returns false if the content is too different (e.g., first render).
 */
export function canIncrementalUpdate(container: HTMLElement): boolean {
  // If container is empty, do full render
  return container.childNodes.length > 0;
}

/**
 * Find all placeholder elements that need async rendering.
 * These are placeholders that don't have a matching rendered node.
 */
export function findPendingPlaceholders(container: HTMLElement): HTMLElement[] {
  const placeholders: HTMLElement[] = [];
  
  // Find all elements with async-placeholder class that aren't rendered
  const allPlaceholders = container.querySelectorAll('.async-placeholder');
  allPlaceholders.forEach(el => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.dataset?.pluginRendered !== 'true') {
      placeholders.push(htmlEl);
    }
  });
  
  return placeholders;
}
