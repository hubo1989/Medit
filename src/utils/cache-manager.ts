// Chrome Extension Cache Manager with IndexedDB Storage

import type {
  CacheItem,
  CacheStats,
  RendererThemeConfig
} from '../types/index';

// Re-export types for consumers
export type { CacheItem, CacheStats };

class ExtensionCacheManager {
  maxItems: number;
  dbName = 'MarkdownViewerCache';
  dbVersion = 1;
  storeName = 'renderCache';

  db: IDBDatabase | null = null;
  initPromise: Promise<IDBDatabase>;

  // Async cleanup state management
  cleanupInProgress = false; // Flag to prevent concurrent cleanup
  cleanupScheduled = false; // Flag to prevent multiple scheduled cleanups

  constructor(maxItems = 1000) {
    this.maxItems = maxItems;
    this.initPromise = this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for render cache
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('accessTime', 'accessTime', { unique: false });
          store.createIndex('size', 'size', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db!;
  }

  /**
   * Calculate SHA256 hash of string
   */
  private async calculateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Estimate byte size of data
   */
  estimateSize(data: unknown): number {
    return new Blob([typeof data === 'string' ? data : JSON.stringify(data)]).size;
  }

  /**
   * Get cached item by key from IndexedDB
   */
  async get(key: string): Promise<any> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        const result = getRequest.result as CacheItem | undefined;
        if (result) {
          resolve(result.value);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  /**
   * Set cached item in IndexedDB
   * Cleanup is done asynchronously to avoid blocking insertion
   */
  async set(key: string, value: unknown, type = 'unknown'): Promise<void> {
    await this.ensureDB();

    const size = this.estimateSize(value);
    const now = Date.now();

    const item: CacheItem = {
      key,
      value,
      type,
      size,
      timestamp: now,
      accessTime: now
    };

    try {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const result = await new Promise<void>((resolve, reject) => {
        const request = store.put(item);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };

        transaction.onerror = () => {
          reject(transaction.error);
        };

        transaction.onabort = () => {
          reject(new Error('Transaction aborted'));
        };
      });

      // Schedule async cleanup after successful insertion (non-blocking)
      this._scheduleAsyncCleanup();

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate cache key for content and type
   * @param content - Content to cache
   * @param type - Cache type identifier
   * @param themeConfig - Optional theme configuration (fontFamily, fontSize, diagramStyle)
   * @returns Cache key
   */
  async generateKey(content: string, type: string, themeConfig: RendererThemeConfig | null = null): Promise<string> {
    let keyContent = content;
    
    // Include theme config in cache key if provided
    if (themeConfig) {
      const fontFamily = themeConfig.fontFamily || '';
      const fontSize = themeConfig.fontSize || '';
      const diagramStyle = themeConfig.diagramStyle || 'normal';
      keyContent = `${content}_font:${fontFamily}_size:${fontSize}_style:${diagramStyle}`;
    }
    
    const hash = await this.calculateHash(keyContent);
    return `${hash}_${type}`;
  }

  /**
   * Delete cached item from IndexedDB
   */
  async delete(key: string): Promise<boolean> {
    await this.ensureDB();

    const transaction = this.db!.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all cache from IndexedDB
   */
  async clear(): Promise<void> {
    await this.ensureDB();

    const transaction = this.db!.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get cache statistics from IndexedDB
   */
  async getStats(limit = 50): Promise<CacheStats> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      let itemCount = 0;
      let totalSize = 0;
      const items: CacheItem[] = [];
      
      // 1. Get total count
      const countRequest = store.count();
      
      countRequest.onsuccess = () => {
        itemCount = countRequest.result;
      };
      
      // 2. Calculate total size using key cursor on size index (avoids loading values)
      const sizeIndex = store.index('size');
      const sizeCursorRequest = sizeIndex.openKeyCursor();
      
      sizeCursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursor | null;
        if (cursor) {
          totalSize += cursor.key as number;
          cursor.continue();
        }
      };
      
      // 3. Get top N items by accessTime
      const accessIndex = store.index('accessTime');
      const itemsCursorRequest = accessIndex.openCursor(null, 'prev');
      
      itemsCursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor && items.length < limit) {
          items.push(cursor.value as CacheItem);
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        const stats: CacheStats = {
          indexedDBCache: {
            itemCount: itemCount,
            maxItems: this.maxItems,
            totalSize: totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            items: items.map(item => ({
              key: (item.key?.substring(0, 32) || '') + '...',
              type: item.type,
              size: item.size,
              sizeMB: (item.size / (1024 * 1024)).toFixed(3),
              created: new Date(item.timestamp).toISOString(),
              lastAccess: new Date(item.accessTime).toISOString()
            }))
          },
          combined: {
            totalItems: itemCount,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
          },
          databaseInfo: {
            dbName: this.dbName,
            storeName: this.storeName,
            version: this.dbVersion
          }
        };

        resolve(stats);
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  /**
   * Schedule async cleanup without blocking current operation
   * Uses flags to prevent concurrent cleanup operations
   */
  private _scheduleAsyncCleanup(): void {
    // Don't schedule if already scheduled or in progress
    if (this.cleanupScheduled || this.cleanupInProgress) {
      return;
    }

    this.cleanupScheduled = true;

    // Run cleanup asynchronously after a delay to avoid blocking
    setTimeout(async () => {
      this.cleanupScheduled = false;

      // Double-check if cleanup is already running
      if (this.cleanupInProgress) {
        return;
      }

      try {
        await this._asyncCleanup();
      } catch (error) {
        console.error('Async cleanup failed:', error);
      }
    }, 100);
  }

  /**
   * Async cleanup that runs in background
   * Only cleans up if cache exceeds maxItems, brings it down to exactly maxItems
   */
  private async _asyncCleanup(): Promise<void> {
    // Prevent concurrent cleanup
    if (this.cleanupInProgress) {
      return;
    }

    this.cleanupInProgress = true;

    try {
      await this.ensureDB();

      // Get current item count from database
      const currentCount = await this._getItemCount();
      if (currentCount <= this.maxItems) {
        return;
      }

      // Calculate how many items to delete
      const itemsToDelete = currentCount - this.maxItems;

      // Perform cleanup in a separate transaction
      await new Promise<void>((resolve, reject) => {
        const cleanupTransaction = this.db!.transaction([this.storeName], 'readwrite');
        const cleanupStore = cleanupTransaction.objectStore(this.storeName);
        const index = cleanupStore.index('accessTime');

        const itemsToSort: Array<{ key: string; accessTime: number; size: number }> = [];
        const cursorRequest = index.openCursor();

        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
          if (cursor) {
            const item = cursor.value as CacheItem;
            itemsToSort.push({
              key: item.key,
              accessTime: item.accessTime,
              size: item.size || 0
            });
            cursor.continue();
          } else {
            // Sort by access time (oldest first)
            itemsToSort.sort((a, b) => a.accessTime - b.accessTime);

            // Delete oldest items to bring count down to maxItems
            const keysToDelete = itemsToSort.slice(0, itemsToDelete);
            let deletedCount = 0;
            let deletedSize = 0;

            if (keysToDelete.length === 0) {
              resolve();
              return;
            }

            keysToDelete.forEach(item => {
              // Delete from IndexedDB
              const deleteRequest = cleanupStore.delete(item.key);

              deleteRequest.onsuccess = () => {
                deletedCount++;
                deletedSize += item.size;
                if (deletedCount === keysToDelete.length) {
                  resolve();
                }
              };

              deleteRequest.onerror = () => {
                reject(deleteRequest.error);
              };
            });
          }
        };

        cursorRequest.onerror = () => {
          reject(cursorRequest.error);
        };

        cleanupTransaction.onerror = () => {
          reject(cleanupTransaction.error);
        };

        cleanupTransaction.onabort = () => {
          reject(new Error('Cleanup transaction aborted'));
        };
      });
    } finally {
      this.cleanupInProgress = false;
    }
  }

  /**
   * Get current item count from database
   */
  private async _getItemCount(): Promise<number> {
    await this.ensureDB();

    const transaction = this.db!.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        resolve(countRequest.result);
      };

      countRequest.onerror = () => {
        reject(countRequest.error);
      };
    });
  }

  /**
   * Manual cleanup (for external calls)
   */
  async cleanupIfNeeded(): Promise<void> {
    const count = await this._getItemCount();
    if (count > this.maxItems) {
      await this.cleanup();
    }
  }

  /**
   * Manual cleanup (synchronous version for external use)
   * Brings cache down to maxItems by removing oldest items
   */
  async cleanup(): Promise<void> {
    // Use the async cleanup implementation to avoid code duplication
    // But wait for it to complete (synchronous behavior for manual calls)
    if (this.cleanupInProgress) {
      // Wait for current cleanup to finish
      while (this.cleanupInProgress) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return;
    }

    await this._asyncCleanup();
  }
}

export default ExtensionCacheManager;
