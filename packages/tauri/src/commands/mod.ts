/**
 * Tauri Commands Module
 *
 * This module provides command interfaces similar to Tauri's Rust commands.
 * In Tauri v2 with frontend plugins, these are implemented as TypeScript
 * functions that wrap the plugin-fs API.
 */

import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

export interface SaveFileResult {
  success: boolean;
  error?: string;
}

export interface SaveFileOptions {
  filePath: string;
  content: string;
  baseDir?: BaseDirectory;
}

/**
 * Save content to a file
 *
 * This command wraps the Tauri fs plugin's writeTextFile function
 * to provide a consistent interface similar to a Rust command.
 *
 * @param options - Save file options including path and content
 * @returns Result object indicating success or failure
 */
export async function saveFile(options: SaveFileOptions): Promise<SaveFileResult> {
  const { filePath, content, baseDir = BaseDirectory.AppLocalData } = options;

  try {
    await writeTextFile(filePath, content, {
      baseDir,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[commands::save_file] Failed to save file:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Save file with explicit parameters (alternative interface)
 *
 * @param filePath - Path to the file
 * @param content - Content to write
 * @param baseDir - Base directory for file operations
 * @returns Result object indicating success or failure
 */
export async function saveFileCommand(
  filePath: string,
  content: string,
  baseDir: BaseDirectory = BaseDirectory.AppLocalData
): Promise<SaveFileResult> {
  return saveFile({ filePath, content, baseDir });
}

export default {
  saveFile,
  saveFileCommand,
};
