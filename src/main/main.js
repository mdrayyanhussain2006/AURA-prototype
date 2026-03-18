const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { isDev, defaultBrowserWindowOptions } = require('./security');
const { registerIpcHandlers } = require('./ipc');

let mainWindow;

// 1. Updated function to accept the helper as an argument
function createMainWindow(isDevHelper) {
  mainWindow = new BrowserWindow(defaultBrowserWindowOptions);

  const rendererDevServerUrl = 'http://localhost:5173';

  // Check both the local security setting and the external helper
  if (isDev || isDevHelper) {
    mainWindow.loadURL(rendererDevServerUrl);
  } else {
    const indexHtmlPath = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
    mainWindow.loadFile(indexHtmlPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const vaultIpc = require('./ipc/vault');
const consentIpc = require('./ipc/consent');
const { ipcMain } = require('electron');

// 2. Wrap the startup logic in an async block to handle the dynamic import
app.whenReady().then(async () => {
  let isDevHelper = false;
  try {
    // This bridges the gap between old 'require' and new 'import'
    const { default: devHelper } = await import('electron-is-dev');
    isDevHelper = devHelper;
  } catch (err) {
    console.log('Running without electron-is-dev helper');
  }

  registerIpcHandlers();

  // Ensuring BOTH exist as per user instructions
  if (typeof vaultIpc.registerHandlers === 'function') vaultIpc.registerHandlers(ipcMain);
  if (typeof consentIpc.registerHandlers === 'function') consentIpc.registerHandlers(ipcMain);

  createMainWindow(isDevHelper);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(isDevHelper);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});