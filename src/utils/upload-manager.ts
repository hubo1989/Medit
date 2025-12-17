const DEFAULT_UPLOAD_CHUNK_SIZE = 255 * 1024;

interface UploadOptions {
  sendMessage: (message: Record<string, any>) => Promise<any>;
  purpose: string;
  encoding?: 'text' | 'base64';
  totalSize: number;
  metadata?: Record<string, any>;
  getChunk: (offset: number, size: number) => string;
  requestedChunkSize?: number;
  onProgress?: (progress: { uploaded: number; total: number }) => void;
}

interface UploadResponse {
  token: string;
  chunkSize: number;
  finalize: Record<string, any>;
}

interface InitResponse {
  success: boolean;
  error?: string;
  token?: string;
  chunkSize?: number;
}

interface ChunkResponse {
  success: boolean;
  error?: string;
}

/**
 * Upload large payloads to the background script using a unified chunk protocol.
 * @param options - Upload options
 * @returns Upload response with token and finalize information
 */
export async function uploadInChunks(options: UploadOptions): Promise<UploadResponse> {
  const {
    sendMessage,
    purpose,
    encoding = 'text',
    totalSize,
    metadata = {},
    getChunk,
    requestedChunkSize,
    onProgress
  } = options;

  if (typeof sendMessage !== 'function') {
    throw new Error('sendMessage function is required');
  }

  if (typeof purpose !== 'string' || !purpose.trim()) {
    throw new Error('Upload purpose is required');
  }

  if (typeof getChunk !== 'function') {
    throw new Error('getChunk function is required');
  }

  const initResponse = (await sendMessage({
    type: 'UPLOAD_INIT',
    payload: {
      purpose,
      encoding,
      expectedSize: totalSize,
      metadata,
      chunkSize: requestedChunkSize
    }
  })) as InitResponse;

  if (!initResponse || !initResponse.success || !initResponse.token) {
    throw new Error(initResponse?.error || 'Upload initialization failed');
  }

  const token = initResponse.token;
  let chunkSize = typeof initResponse.chunkSize === 'number' && initResponse.chunkSize > 0
    ? initResponse.chunkSize
    : (typeof requestedChunkSize === 'number' && requestedChunkSize > 0 ? requestedChunkSize : DEFAULT_UPLOAD_CHUNK_SIZE);

  if (encoding === 'base64') {
    const remainder = chunkSize % 3;
    if (remainder !== 0) {
      chunkSize -= remainder;
    }
    if (chunkSize <= 0) {
      chunkSize = 3;
    }
  }

  let uploaded = 0;
  for (let offset = 0; offset < totalSize; offset += chunkSize) {
    const chunk = getChunk(offset, chunkSize);
    const chunkResponse = (await sendMessage({
      type: 'UPLOAD_CHUNK',
      token,
      chunk
    })) as ChunkResponse;

    if (!chunkResponse || !chunkResponse.success) {
      throw new Error(chunkResponse?.error || 'Upload chunk failed');
    }

    uploaded = Math.min(totalSize, offset + chunkSize);
    if (typeof onProgress === 'function') {
      try {
        onProgress({ uploaded, total: totalSize });
      } catch (error) {
        console.warn('Upload progress callback error:', error);
      }
    }
  }

  const finalizeResponse = (await sendMessage({
    type: 'UPLOAD_FINALIZE',
    token
  })) as ChunkResponse & { finalize?: Record<string, any> };

  if (!finalizeResponse || !finalizeResponse.success) {
    throw new Error(finalizeResponse?.error || 'Upload finalize failed');
  }

  return {
    token,
    chunkSize,
    finalize: finalizeResponse.finalize || {}
  };
}

/**
 * Abort an ongoing upload session.
 * @param sendMessage - Promise-based wrapper around chrome.runtime.sendMessage
 * @param token - Upload session token
 */
export function abortUpload(sendMessage: (message: Record<string, any>) => Promise<any>, token: string): Promise<void> {
  if (typeof sendMessage !== 'function' || !token) {
    return Promise.resolve();
  }
  return sendMessage({ type: 'UPLOAD_ABORT', token }).catch(() => {});
}
