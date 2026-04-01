/* Simple build step for main/preload.
 * In a more advanced setup you might transpile with esbuild or tsup.
 * For now we simply ensure the files exist and could be extended later.
 */

const { copyFileSync, mkdirSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');

const srcDir = resolve(__dirname, '..', 'src', 'main');
const distDir = resolve(__dirname, '..', 'dist', 'main');

mkdirSync(distDir, { recursive: true });

copyFileSync(resolve(srcDir, 'main.js'), resolve(distDir, 'main.js'));

const securePreloadSrc = resolve(srcDir, 'secure_preload.js');
const preloadSrc = resolve(srcDir, 'preload.js');

if (existsSync(securePreloadSrc)) {
	copyFileSync(securePreloadSrc, resolve(distDir, 'secure_preload.js'));
} else if (existsSync(preloadSrc)) {
	// Backward compatibility for older branch states.
	copyFileSync(preloadSrc, resolve(distDir, 'preload.js'));
} else {
	throw new Error('No preload entry found (expected secure_preload.js or preload.js).');
}

console.log('Main process files prepared in dist/main.');

