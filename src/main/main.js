const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { isDev, defaultBrowserWindowOptions } = require('./security');
const { registerIpcHandlers } = require('./ipc');
const { ensureOfflineCapable } = require('./services/offlineGuard');
const { setWindow, triggerHealthAudit } = require('./services/auditBridge');

let mainWindow;

function createMainWindow(isDevHelper) {
  mainWindow = new BrowserWindow(defaultBrowserWindowOptions);

  const rendererDevServerUrl = 'http://localhost:5173';

  // Use dev server if isDev is true, or if electron-is-dev is true AND we're not explicitly forcing production
  const shouldLoadDevServer = isDev || (isDevHelper && process.env.NODE_ENV !== 'production');
  
  if (shouldLoadDevServer) {
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
const { setMainWindowRef } = require('./ipc/auth');
const { ipcMain } = require('electron');

// Wrap the startup logic in an async block to handle the dynamic import
app.whenReady().then(async () => {
  // ── Offline-First Verification ──
  const offlineStatus = ensureOfflineCapable();

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

  // Pass mainWindow ref to auth for Google OAuth modal
  setMainWindowRef(mainWindow);

  // Pass mainWindow ref to audit bridge for event-driven health pushes
  setWindow(mainWindow);

  // ── Run initial health audit once window is ready ──
  mainWindow.webContents.once('did-finish-load', () => {
    triggerHealthAudit();
  });

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