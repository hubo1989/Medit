// ViewerController
// Shared, platform-agnostic markdown rendering orchestration.

import {
  AsyncTaskManager,
  extractHeadings,
  extractTitle,
  processMarkdownStreaming,
  type HeadingInfo,
} from '../markdown-processor';

import type { PluginRenderer, TranslateFunction } from '../../types/index';

export type ViewerRenderResult = {
  title: string | null;
  headings: HeadingInfo[];
  taskManager: AsyncTaskManager;
};

export type RenderMarkdownOptions = {
  markdown: string;
  container: HTMLElement;
  renderer: PluginRenderer;
  translate: TranslateFunction;

  /**
   * Optional external task manager, useful for cancellation.
   * If not provided, a new AsyncTaskManager will be created.
   */
  taskManager?: AsyncTaskManager;

  /**
   * When true, container.innerHTML will be cleared before rendering.
   * Keep false if the caller wants to clear before applying theme to avoid flicker.
   */
  clearContainer?: boolean;

  /**
   * Whether to process async tasks immediately.
   * If false, caller can run taskManager.processAll() later.
   */
  processTasks?: boolean;

  onHeadings?: (headings: HeadingInfo[]) => void;
  onProgress?: (completed: number, total: number) => void;
  onBeforeTasks?: () => void;
  onAfterTasks?: () => void;
  onStreamingComplete?: () => void;
  postProcess?: (container: Element) => Promise<void> | void;
};

export async function renderMarkdownDocument(options: RenderMarkdownOptions): Promise<ViewerRenderResult> {
  const {
    markdown,
    container,
    renderer,
    translate,
    taskManager: providedTaskManager,
    clearContainer = true,
    processTasks = true,
    onHeadings,
    onProgress,
    onBeforeTasks,
    onAfterTasks,
    onStreamingComplete,
    postProcess,
  } = options;

  const taskManager = providedTaskManager ?? new AsyncTaskManager(translate);

  if (clearContainer) {
    container.innerHTML = '';
  }

  // Process and render markdown with streaming
  await processMarkdownStreaming(markdown, {
    renderer,
    taskManager,
    translate,
    onChunk: async (html) => {
      if (taskManager.isAborted()) return;

      // Append chunk HTML to container
      const template = document.createElement('template');
      template.innerHTML = html;
      container.appendChild(template.content);

      // Update headings after each chunk for progressive TOC
      const headings = extractHeadings(container);
      onHeadings?.(headings);
    },
  });

  if (taskManager.isAborted()) {
    return {
      title: extractTitle(markdown),
      headings: [],
      taskManager,
    };
  }

  // Streaming rendering is complete, notify caller
  onStreamingComplete?.();

  const headings = extractHeadings(container);

  if (processTasks) {
    onBeforeTasks?.();
    await taskManager.processAll((completed, total) => {
      onProgress?.(completed, total);
    });
    onAfterTasks?.();

    if (taskManager.isAborted()) {
      return {
        title: extractTitle(markdown),
        headings,
        taskManager,
      };
    }

    await postProcess?.(container);
  }

  return {
    title: extractTitle(markdown),
    headings,
    taskManager,
  };
}
