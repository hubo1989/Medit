/**
 * DOCX Download Utilities
 * Functions for downloading DOCX files
 */

import { uploadInChunks, abortUpload } from '../utils/upload-manager';

/**
 * Runtime message handler type
 */
type SendMessageFunction = (payload: unknown) => Promise<unknown>;

/**
 * Download finalize response
 */
interface DownloadFinalizeResponse {
  success: boolean;
  error?: string;
  downloadId?: number;
}

type ResponseEnvelope = {
  type: 'RESPONSE';
  requestId: string;
  ok: boolean;
  data?: unknown;
  error?: { message: string };
};

function isResponseEnvelope(message: unknown): message is ResponseEnvelope {
  if (!message || typeof message !== 'object') return false;
  const obj = message as Record<string, unknown>;
  return obj.type === 'RESPONSE' && typeof obj.requestId === 'string' && typeof obj.ok === 'boolean';
}

/**
 * Convert byte array chunk to base64 without exceeding call stack limits
 * @param bytes - Binary chunk
 * @returns Base64 encoded chunk
 */
export function encodeBytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const sliceSize = 0x8000;
  for (let i = 0; i < bytes.length; i += sliceSize) {
    const slice = bytes.subarray(i, Math.min(i + sliceSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return btoa(binary);
}

/**
 * Wrapper for chrome.runtime.sendMessage with Promise interface
 * @param message - Message payload
 * @returns Response from background script
 */
export function runtimeSendMessage(message: unknown): Promise<unknown> {
  const platform = globalThis.platform as { message?: { send?: (msg: Record<string, unknown>) => Promise<unknown> } } | undefined;
  if (platform?.message?.send && message && typeof message === 'object') {
    return platform.message.send(message as Record<string, unknown>);
  }

  return Promise.reject(new Error('Platform messaging not available'));
}

/**
 * Fallback download method using <a> element
 * @param blob - File blob
 * @param filename - Output filename
 */
export function fallbackDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Download blob as file using chunked upload to background script
 * @param blob - File blob
 * @param filename - Output filename
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  let token: string | null = null;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const uploadResult = await uploadInChunks({
      sendMessage: (payload: unknown) => runtimeSendMessage(payload),
      purpose: 'docx-download',
      encoding: 'base64',
      totalSize: bytes.length,
      metadata: {
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      },
      getChunk: (offset: number, size: number) => {
        const end = Math.min(offset + size, bytes.length);
        const chunkBytes = bytes.subarray(offset, end);
        return encodeBytesToBase64(chunkBytes);
      }
    });

    token = uploadResult.token;

    const finalizeRaw = await runtimeSendMessage({
      id: `${Date.now()}-docx-finalize`,
      type: 'DOCX_DOWNLOAD_FINALIZE',
      payload: { token },
      timestamp: Date.now(),
      source: 'docx-download',
    });

    if (isResponseEnvelope(finalizeRaw)) {
      if (!finalizeRaw.ok) {
        throw new Error(finalizeRaw.error?.message || 'Download finalize failed');
      }
      return;
    }

    throw new Error('Unexpected response shape (expected ResponseEnvelope)');
  } catch (error) {
    console.error('Download failed:', error);
    if (token) {
      abortUpload((payload: unknown) => runtimeSendMessage(payload), token);
    }
    fallbackDownload(blob, filename);
  }
}
