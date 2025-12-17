/**
 * Async Task Queue
 * Manages deferred async tasks for plugin content rendering
 */

import { createPlaceholderElement } from '../plugins/plugin-content-utils';
import type {
  TaskStatus,
  TaskData,
  AsyncTaskObject,
  PlaceholderResult,
  AsyncTaskResult,
  AsyncTaskPlugin,
  TranslateFunction,
  EscapeHtmlFunction,
  AsyncTaskQueueManager
} from '../types/index';

/**
 * Creates an async task queue manager.
 * @param escapeHtml - HTML escape function
 * @returns Async task queue manager instance
 */
export function createAsyncTaskQueue(escapeHtml: EscapeHtmlFunction): AsyncTaskQueueManager {
  // Global async task queue
  const asyncTaskQueue: AsyncTaskObject[] = [];
  let asyncTaskIdCounter = 0;

  /**
   * Generate unique ID for async tasks
   */
  function generateAsyncId(): string {
    return `async-placeholder-${++asyncTaskIdCounter}`;
  }

  /**
   * Register async task for later execution with status management
   * @param callback - The async callback function
   * @param data - Data to pass to callback
   * @param plugin - Plugin instance that provides type and placeholder generation
   * @param translate - Translation function
   * @param initialStatus - Initial task status ('ready', 'fetching')
   * @returns Object with task control and placeholder content
   */
  function asyncTask(
    callback: (data: TaskData) => Promise<void>,
    data: Record<string, unknown> = {},
    plugin: AsyncTaskPlugin | null = null,
    translate: TranslateFunction | null = null,
    initialStatus: TaskStatus = 'ready'
  ): AsyncTaskResult {
    const placeholderId = generateAsyncId();
    const type = plugin?.type || 'unknown';

    // Create task object with status management
    const task: AsyncTaskObject = {
      id: placeholderId,
      callback,
      data: { ...data, id: placeholderId },
      type,
      status: initialStatus, // 'ready', 'fetching', 'error'
      error: null,

      // Methods for business logic to update status
      setReady: () => {
        task.status = 'ready';
      },
      setError: (error: Error) => {
        task.status = 'error';
        task.error = error;
      }
    };

    asyncTaskQueue.push(task);

    // Generate placeholder using utility function
    // Provide fallback translate function if not provided
    const translateFn: TranslateFunction = translate || ((key: string) => key);
    const placeholderHtml = createPlaceholderElement(
      placeholderId,
      type,
      plugin?.isInline() || false,
      translateFn
    );

    return {
      task, // Return task object for business logic control
      placeholder: {
        type: 'html',
        value: placeholderHtml
      }
    };
  }

  /**
   * Process all async tasks in parallel
   * @param translate - Translation function
   * @param showProcessingIndicator - Function to show processing indicator
   * @param hideProcessingIndicator - Function to hide processing indicator
   * @param updateProgress - Function to update progress
   */
  async function processAsyncTasks(
    translate: TranslateFunction,
    showProcessingIndicator: () => void,
    hideProcessingIndicator: () => void,
    updateProgress: (completed: number, total: number) => void
  ): Promise<void> {
    if (asyncTaskQueue.length === 0) {
      return;
    }

    const totalTasks = asyncTaskQueue.length;
    const tasks = asyncTaskQueue.splice(0, asyncTaskQueue.length); // Take all tasks

    // Show processing indicator and set initial progress
    showProcessingIndicator();
    updateProgress(0, totalTasks);

    let completedTasks = 0;

    // Wait for all fetching tasks to be ready first
    const waitForReady = async (task: AsyncTaskObject): Promise<void> => {
      while (task.status === 'fetching') {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };

    // Process all tasks in parallel
    const processTask = async (task: AsyncTaskObject): Promise<void> => {
      try {
        // Wait if task is still fetching
        await waitForReady(task);

        if (task.status === 'error') {
          // Handle error case - update placeholder with error message
          const placeholder = document.getElementById(task.id);
          if (placeholder) {
            const unknownError = translate('async_unknown_error');
            const errorDetail = escapeHtml((task.error ? task.error.message : '') || unknownError);
            const localizedError = translate('async_processing_error', [errorDetail]);
            placeholder.outerHTML = `<pre style="background: #fee; border-left: 4px solid #f00; padding: 10px; font-size: 12px;">${localizedError}</pre>`;
          }
        } else {
          // Process ready task normally
          await task.callback(task.data);
        }
      } catch (error) {
        console.error('Async task processing error:', error);
        // Update placeholder with error message
        const placeholder = document.getElementById(task.id);
        if (placeholder) {
          const errorMessage = error instanceof Error ? error.message : '';
          const errorDetail = escapeHtml(errorMessage);
          const localizedError = translate('async_task_processing_error', [errorDetail]);
          placeholder.outerHTML = `<pre style="background: #fee; border-left: 4px solid #f00; padding: 10px; font-size: 12px;">${localizedError}</pre>`;
        }
      } finally {
        completedTasks++;
        updateProgress(completedTasks, totalTasks);
      }
    };

    // Run all tasks in parallel
    await Promise.all(tasks.map(processTask));

    // Hide processing indicator when all tasks are done
    hideProcessingIndicator();
  }

  /**
   * Get current queue length
   * @returns Number of tasks in queue
   */
  function getQueueLength(): number {
    return asyncTaskQueue.length;
  }

  return {
    asyncTask,
    processAsyncTasks,
    getQueueLength
  };
}
