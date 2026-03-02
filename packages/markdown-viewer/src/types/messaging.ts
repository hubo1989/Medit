/**
 * Messaging Type Definitions
 *
 * NOTE: This file defines the type-level contract only.
 * Runtime implementations live under src/messaging/.
 */

import type { FileState } from './core';
import type { RendererThemeConfig, RenderResult } from './render';

// =============================================================================
// Message Type Sets
// =============================================================================

export const RenderMessageType = {
  RENDER_DIAGRAM: 'RENDER_DIAGRAM',
  SET_THEME_CONFIG: 'SET_THEME_CONFIG',
  PING: 'PING',
  READY: 'READY',
  READY_ACK: 'READY_ACK',
} as const;

export type RenderMessageType = typeof RenderMessageType[keyof typeof RenderMessageType];

export const ServiceMessageType = {
  STORAGE_GET: 'STORAGE_GET',
  STORAGE_SET: 'STORAGE_SET',
  STORAGE_REMOVE: 'STORAGE_REMOVE',

  OFFSCREEN_READY: 'OFFSCREEN_READY',
  OFFSCREEN_DOM_READY: 'OFFSCREEN_DOM_READY',
  OFFSCREEN_ERROR: 'OFFSCREEN_ERROR',

  LOCALE_CHANGED: 'LOCALE_CHANGED',
  THEME_CHANGED: 'THEME_CHANGED',

  CACHE_OPERATION: 'CACHE_OPERATION',

  FILE_STATE_OPERATION: 'FILE_STATE_OPERATION',
  SCROLL_OPERATION: 'SCROLL_OPERATION',

  UPLOAD_OPERATION: 'UPLOAD_OPERATION',
  DOCX_DOWNLOAD_FINALIZE: 'DOCX_DOWNLOAD_FINALIZE',

  FETCH_ASSET: 'FETCH_ASSET',
  INJECT_CONTENT_SCRIPT: 'INJECT_CONTENT_SCRIPT',
  READ_LOCAL_FILE: 'READ_LOCAL_FILE',
  DOWNLOAD_FILE: 'DOWNLOAD_FILE',
} as const;

export type ServiceMessageType = typeof ServiceMessageType[keyof typeof ServiceMessageType];

export const CommonMessageType = {
  RESPONSE: 'RESPONSE',
} as const;

export type CommonMessageType = typeof CommonMessageType[keyof typeof CommonMessageType];

export type AnyMessageType = RenderMessageType | ServiceMessageType | CommonMessageType;

// =============================================================================
// Payload Maps
// =============================================================================

export type RenderPayloadMap = {
  RENDER_DIAGRAM: {
    renderType: string;
    input: string | object;
    themeConfig?: RendererThemeConfig | null;
  };
  SET_THEME_CONFIG: {
    config: RendererThemeConfig;
  };
  PING: Record<string, never>;
  READY: Record<string, never>;
  READY_ACK: Record<string, never>;
};

export type ServicePayloadMap = {
  STORAGE_GET: {
    keys: string | string[];
  };
  STORAGE_SET: {
    items: Record<string, unknown>;
  };
  STORAGE_REMOVE: {
    keys: string | string[];
  };

  OFFSCREEN_READY: Record<string, never>;
  OFFSCREEN_DOM_READY: Record<string, never>;
  OFFSCREEN_ERROR: {
    error: string;
    filename?: string;
    lineno?: number;
  };

  LOCALE_CHANGED: {
    locale: string;
  };

  THEME_CHANGED: {
    themeId: string;
  };
  CACHE_OPERATION: {
    operation: 'get' | 'set' | 'clear' | 'getStats' | 'delete';
    key?: string;
    value?: unknown;
    dataType?: string;
  };
  FILE_STATE_OPERATION: {
    operation: 'get' | 'set' | 'clear';
    url: string;
    state?: FileState;
  };
  SCROLL_OPERATION: {
    operation: 'get' | 'clear';
    url: string;
  };
  UPLOAD_OPERATION: {
    operation: 'init' | 'chunk' | 'finalize' | 'abort';
    purpose?: string;
    encoding?: 'text' | 'base64';
    expectedSize?: number;
    metadata?: Record<string, unknown>;
    chunkSize?: number;
    token?: string;
    chunk?: string;
  };
  DOCX_DOWNLOAD_FINALIZE: {
    token: string;
  };
  FETCH_ASSET: {
    path: string;
  };
  INJECT_CONTENT_SCRIPT: {
    url: string;
  };
  READ_LOCAL_FILE: {
    filePath: string;
    binary?: boolean;
  };
  DOWNLOAD_FILE: {
    filename: string;
    data: string;
    mimeType?: string;
  };
};

// =============================================================================
// Envelopes
// =============================================================================

export type RequestEnvelope<TType extends AnyMessageType, TPayload> = {
  id: string;
  type: TType;
  payload: TPayload;
  timestamp: number;
  source?: string;
};

export type ResponseEnvelope = {
  type: 'RESPONSE';
  requestId: string;
  ok: boolean;
  data?: unknown;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
};

// =============================================================================
// Typed Request Helpers
// =============================================================================

export type RenderRequestEnvelope<T extends RenderMessageType> = RequestEnvelope<
  T,
  T extends keyof RenderPayloadMap ? RenderPayloadMap[T] : unknown
>;

export type ServiceRequestEnvelope<T extends ServiceMessageType> = RequestEnvelope<
  T,
  T extends keyof ServicePayloadMap ? ServicePayloadMap[T] : unknown
>;

// =============================================================================
// Convenience Result Types
// =============================================================================

export type RenderResponseData = RenderResult;
