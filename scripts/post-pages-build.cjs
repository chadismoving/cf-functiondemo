#!/usr/bin/env node
const { mkdirSync, existsSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const workerAssetsDir = '.vercel/output/static/_worker.js/__next-on-pages-dist__/assets';

try {
  mkdirSync(workerAssetsDir, { recursive: true });

  const placeholderPath = join(workerAssetsDir, 'placeholder.bin');
  if (!existsSync(placeholderPath)) {
    writeFileSync(placeholderPath, new Uint8Array());
  }
} catch (error) {
  console.error('[post-pages-build] Failed to ensure assets directory:', error);
  process.exitCode = 1;
}
