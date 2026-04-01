#!/usr/bin/env node

/**
 * AURA Channel Sync Validator
 *
 * Build-time script that ensures the inline CH object in secure_preload.js
 * stays in sync with the canonical ipcChannels.cjs. Run this as part of
 * your CI/build pipeline to catch drift before it causes silent failures.
 *
 * Usage: node scripts/validate-channels.cjs
 */

const fs = require('node:fs');
const path = require('node:path');

const CHANNELS_PATH = path.join(__dirname, '..', 'src', 'shared', 'ipcChannels.cjs');
const PRELOAD_PATH = path.join(__dirname, '..', 'src', 'main', 'secure_preload.js');

function extractChannelKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Match lines like:   KEY_NAME: 'value' or KEY_NAME: "value"
  const keyRegex = /^\s+([A-Z_]+)\s*:\s*['"]([^'"]+)['"]/gm;
  const keys = {};
  let match;

  while ((match = keyRegex.exec(content)) !== null) {
    keys[match[1]] = match[2];
  }

  return keys;
}

function main() {
  console.log('🔍 AURA Channel Sync Validator\n');

  if (!fs.existsSync(CHANNELS_PATH)) {
    console.error('❌ ipcChannels.cjs not found at:', CHANNELS_PATH);
    process.exit(1);
  }

  if (!fs.existsSync(PRELOAD_PATH)) {
    console.error('❌ secure_preload.js not found at:', PRELOAD_PATH);
    process.exit(1);
  }

  const canonical = extractChannelKeys(CHANNELS_PATH);
  const preload = extractChannelKeys(PRELOAD_PATH);

  const canonicalKeys = Object.keys(canonical);
  const preloadKeys = Object.keys(preload);

  console.log(`  Canonical (ipcChannels.cjs): ${canonicalKeys.length} channels`);
  console.log(`  Preload (secure_preload.js): ${preloadKeys.length} channels\n`);

  let hasErrors = false;

  // Check for channels in canonical but missing from preload
  // NOTE: Preload only exposes a subset of channels (those needed by the renderer).
  // We check that every channel in the preload exists in canonical (not vice versa).
  const missingFromCanonical = preloadKeys.filter((k) => !canonicalKeys.includes(k));
  if (missingFromCanonical.length > 0) {
    console.error('❌ Channels in preload but MISSING from ipcChannels.cjs:');
    missingFromCanonical.forEach((k) => console.error(`   - ${k}`));
    hasErrors = true;
  }

  // Check for value mismatches on shared keys
  const sharedKeys = preloadKeys.filter((k) => canonicalKeys.includes(k));
  const mismatches = sharedKeys.filter((k) => canonical[k] !== preload[k]);
  if (mismatches.length > 0) {
    console.error('❌ Channel value mismatches:');
    mismatches.forEach((k) => {
      console.error(`   - ${k}: canonical="${canonical[k]}" vs preload="${preload[k]}"`);
    });
    hasErrors = true;
  }

  // Report channels only in canonical (informational — preload is a subset)
  const onlyInCanonical = canonicalKeys.filter((k) => !preloadKeys.includes(k));
  if (onlyInCanonical.length > 0) {
    console.log(`ℹ️  ${onlyInCanonical.length} channels in canonical not exposed in preload (expected):`);
    onlyInCanonical.forEach((k) => console.log(`   - ${k}`));
    console.log('');
  }

  if (hasErrors) {
    console.error('\n❌ Channel synchronization FAILED — fix the issues above.');
    process.exit(1);
  }

  console.log('✅ All channels synchronized — preload is a valid subset of ipcChannels.cjs.\n');
  process.exit(0);
}

main();
