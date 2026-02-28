/**
 * Cross-platform script to copy Vditor assets from node_modules to public folder
 * Works on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const publicDir = path.join(rootDir, '..', 'public');
const targetDir = path.join(publicDir, 'vditor');
const sourceDir = path.join(rootDir, '..', 'node_modules', 'vditor', 'dist');

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
  console.error(`Error: Vditor source directory not found: ${sourceDir}`);
  console.error('Make sure vditor is installed (run: pnpm install)');
  process.exit(1);
}

// Remove existing target directory
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  console.log('Removed existing public/vditor');
}

// Copy vditor/dist to public/vditor
fs.cpSync(sourceDir, targetDir, { recursive: true });
console.log('Copied vditor/dist to public/vditor');
