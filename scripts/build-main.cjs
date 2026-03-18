/* Simple build step for main/preload.
 * In a more advanced setup you might transpile with esbuild or tsup.
 * For now we simply ensure the files exist and could be extended later.
 */

const { copyFileSync, mkdirSync } = require('node:fs');
const { resolve } = require('node:path');

const srcDir = resolve(__dirname, '..', 'src', 'main');
const distDir = resolve(__dirname, '..', 'dist', 'main');

mkdirSync(distDir, { recursive: true });

copyFileSync(resolve(srcDir, 'main.js'), resolve(distDir, 'main.js'));
copyFileSync(resolve(srcDir, 'preload.js'), resolve(distDir, 'preload.js'));

console.log('Main process files prepared in dist/main.');

