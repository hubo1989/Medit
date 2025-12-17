const DEFAULT_UPLOAD_CHUNK_SIZE = 255 * 1024;

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

let requestCounter = 0;
function nextRequestId(): string {
  requestCounter += 1;
  return `${Date.now()}-${requestCounter}`;
}

async function sendUploadOperation(sendMessage: (message: Record<string, any>) => Promise<any>, payload: Record<string, unknown>): Promise<unknown> {
  const response = await sendMessage({
    id: nextRequestId(),
    type: 'UPLOAD_OPERATION',
    payload,
    timestamp: Date.now(),
    source: 'upload-manager',
  });

  if (isResponseEnvelope(response)) {
    if (response.ok) return response.data;
    throw new Error(response.error?.message || 'Upload operation failed');
  }

  throw new Error('Unexpected response shape (expected ResponseEnvelope)');
}

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

  const initData = (await sendUploadOperation(sendMessage, {
    operation: 'init',
    purpose,
    encoding,
    expectedSize: totalSize,
    metadata,
    chunkSize: requestedChunkSize,
  })) as unknown;

  if (!initData || typeof initData !== 'object') {
    throw new Error('Upload initialization failed');
  }

  const initObj = initData as Record<string, unknown>;
  const token = typeof initObj.token === 'string' ? initObj.token : '';
  if (!token) {
    throw new Error('Upload initialization failed');
  }

  let chunkSize = typeof initObj.chunkSize === 'number' && initObj.chunkSize > 0
    ? initObj.chunkSize
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

    await sendUploadOperation(sendMessage, {
      operation: 'chunk',
      token,
      chunk,
    });

    uploaded = Math.min(totalSize, offset + chunkSize);
    if (typeof onProgress === 'function') {
      try {
        onProgress({ uploaded, total: totalSize });
      } catch (error) {
        console.warn('Upload progress callback error:', error);
      }
    }
  }

  const finalizeData = (await sendUploadOperation(sendMessage, {
    operation: 'finalize',
    token,
  })) as unknown;

  const finalize = finalizeData && typeof finalizeData === 'object'
    ? (finalizeData as Record<string, any>)
    : {};

  return {
    token,
    chunkSize,
    finalize
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

  return sendMessage({
    id: `${Date.now()}-abort`,
    type: 'UPLOAD_OPERATION',
    payload: { operation: 'abort', token },
    timestamp: Date.now(),
    source: 'upload-manager',
  }).catch(() => {});
}
