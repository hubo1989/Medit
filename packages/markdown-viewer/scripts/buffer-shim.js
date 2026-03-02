// Buffer polyfill for browser environment using npm buffer package
import { Buffer as BufferPolyfill } from 'buffer';

// Make Buffer available globally
export const Buffer = BufferPolyfill;
globalThis.Buffer = BufferPolyfill;
