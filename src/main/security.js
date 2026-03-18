// Centralized security-related constants and helpers for the Electron main process.

const isDev = process.env.NODE_ENV === 'development';

/** BrowserWindow default security options */
const defaultBrowserWindowOptions = {
  width: 1200,
  height: 800,
  minWidth: 1040,
  minHeight: 640,
  backgroundColor: '#050816',
  show: false,
  autoHideMenuBar: true,
  webPreferences: {
    contextIsolation: true,
    preload: require('node:path').join(__dirname, 'secure_preload.js'),
    nodeIntegration: false,
    sandbox: true,
    devTools: isDev,
    webSecurity: true
  }
};

module.exports = {
  isDev,
  defaultBrowserWindowOptions
};

