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
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
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

    const finalizeResponse = await runtimeSendMessage({
      type: 'DOCX_DOWNLOAD_FINALIZE',
      token
    }) as DownloadFinalizeResponse;

    if (!finalizeResponse || !finalizeResponse.success) {
      throw new Error(finalizeResponse?.error || 'Download finalize failed');
    }
  } catch (error) {
    console.error('Download failed:', error);
    if (token) {
      abortUpload((payload: unknown) => runtimeSendMessage(payload), token);
    }
    fallbackDownload(blob, filename);
  }
}
