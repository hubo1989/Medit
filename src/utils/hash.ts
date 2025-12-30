/**
 * Simple hash utilities for content-based identification
 */

/**
 * Generate a simple hash code from a string.
 * Uses djb2 algorithm - fast and produces good distribution.
 * @param str - String to hash
 * @returns Hash code as hex string
 */
export function hashCode(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  // Convert to unsigned 32-bit and then to hex
  return (hash >>> 0).toString(16);
}

/**
 * Generate a content hash combining type and content.
 * @param type - Plugin type (e.g., 'mermaid', 'vega')
 * @param content - Source content
 * @returns Combined hash string
 */
export function generateContentHash(type: string, content: string): string {
  return hashCode(`${type}:${content}`);
}
