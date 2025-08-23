#!/usr/bin/env node

/**
 * Platform-specific native library optimizer
 *
 * This script runs after npm install and removes unnecessary
 * native libraries for other platforms, keeping only the
 * libraries needed for the current platform.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Platform detection
const platform = os.platform();
const arch = os.arch();

console.log(`🔍 Optimizing for platform: ${platform}-${arch}`);

const libsDir = path.join(__dirname, '..', 'libs');

if (!fs.existsSync(libsDir)) {
  console.log(`⚠️  No libs directory found. Skipping optimization.`);
  process.exit(0);
}

// Define platform directories to keep/remove
const platformDirs = {
  'win32': ['windows'],
  'linux': ['linux'],
  'darwin': ['macos']
};

const keepDirs = platformDirs[platform] || [];
const allDirs = ['windows', 'linux', 'macos'];
const removeDirs = allDirs.filter(dir => !keepDirs.includes(dir));

console.log(`📦 Keeping libraries for: ${keepDirs.join(', ')}`);
console.log(`🗑️  Removing libraries for: ${removeDirs.join(', ')}`);

let totalSaved = 0;

// Remove unnecessary platform directories
for (const dir of removeDirs) {
  const dirPath = path.join(libsDir, dir);

  if (fs.existsSync(dirPath)) {
    const sizeBefore = getDirSize(dirPath);

    try {
      removeRecursive(dirPath);
      totalSaved += sizeBefore;
      console.log(`✅ Removed ${dir} libraries (${formatBytes(sizeBefore)} saved)`);
    } catch (error) {
      console.log(`❌ Failed to remove ${dir}: ${error.message}`);
    }
  }
}

// Show optimization results
if (totalSaved > 0) {
  console.log(`🎉 Optimization complete! Saved ${formatBytes(totalSaved)} of disk space.`);
} else {
  console.log(`✅ No optimization needed - only current platform libraries found.`);
}

// Verify the current platform libraries exist
const currentPlatformDir = path.join(libsDir, keepDirs[0]);
if (keepDirs.length > 0 && fs.existsSync(currentPlatformDir)) {
  const remainingSize = getDirSize(currentPlatformDir);
  console.log(`📊 Current platform libraries: ${formatBytes(remainingSize)}`);
} else if (keepDirs.length > 0) {
  console.log(`⚠️  Warning: No libraries found for current platform (${platform})`);
}

/**
 * Get directory size recursively
 */
function getDirSize(dirPath) {
  let size = 0;

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        size += getDirSize(itemPath);
      } else {
        size += stats.size;
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return size;
}

/**
 * Remove directory recursively
 */
function removeRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);

    if (fs.statSync(itemPath).isDirectory()) {
      removeRecursive(itemPath);
    } else {
      fs.unlinkSync(itemPath);
    }
  }

  fs.rmdirSync(dirPath);
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
