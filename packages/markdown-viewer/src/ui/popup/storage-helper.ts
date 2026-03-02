/**
 * Storage helper using message channel to background
 * Works with both Chrome (MV3) and Firefox (MV2)
 */

let messageId = 0;

function generateId(): string {
  return `storage-${Date.now()}-${++messageId}`;
}

/**
 * Standard ResponseEnvelope from background
 */
interface ResponseEnvelope<T = unknown> {
  type: 'RESPONSE';
  requestId: string;
  ok: boolean;
  data?: T;
  error?: { message: string };
}

/**
 * Type guard for ResponseEnvelope
 */
function isResponseEnvelope<T>(response: unknown): response is ResponseEnvelope<T> {
  if (!response || typeof response !== 'object') return false;
  const obj = response as Record<string, unknown>;
  return obj.type === 'RESPONSE' && typeof obj.requestId === 'string' && typeof obj.ok === 'boolean';
}

/**
 * Send message to background and wait for response
 */
function sendToBackground<T>(type: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = generateId();
    chrome.runtime.sendMessage(
      { id, type, payload, timestamp: Date.now(), source: 'popup-storage' },
      (response: unknown) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response) {
          reject(new Error('No response from background'));
          return;
        }
        // Handle standard ResponseEnvelope format
        if (isResponseEnvelope<T>(response)) {
          if (response.ok) {
            resolve(response.data as T);
          } else {
            reject(new Error(response.error?.message || 'Unknown error'));
          }
          return;
        }
        // Unexpected response format
        reject(new Error('Unexpected response format (expected ResponseEnvelope)'));
      }
    );
  });
}

/**
 * Get items from local storage via background
 */
export async function storageGet(keys: string[]): Promise<Record<string, unknown>> {
  return sendToBackground<Record<string, unknown>>('STORAGE_GET', { keys });
}

/**
 * Set items to local storage via background
 */
export async function storageSet(items: Record<string, unknown>): Promise<void> {
  await sendToBackground<{ success: boolean }>('STORAGE_SET', { items });
}
