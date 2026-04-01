const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { isDev, defaultBrowserWindowOptions } = require('./security');
const { registerIpcHandlers } = require('./ipc');
const { ensureOfflineCapable } = require('./services/offlineGuard');
const { runHealthAudit } = require('./services/healthAuditor');
const Channels = require('../shared/ipcChannels.cjs');

let mainWindow;
let healthAuditInterval = null;

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

/**
 * Starts the Autonomous Health Loop.
 * Pushes security audit results to the renderer every 30 seconds.
 */
function startHealthAuditLoop() {
  // Run the first audit immediately once the window is ready
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      const auditData = runHealthAudit();
      mainWindow.webContents.send(Channels.INSIGHTS_GET_SUMMARY, auditData);
      console.log(`[HealthLoop] Audit pushed — score: ${auditData.score}/${100} (${auditData.level})`);
    } catch (err) {
      console.error('[HealthLoop] Initial audit error:', err.message);
    }
  }

  // Schedule recurring audits every 30 seconds
  healthAuditInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    try {
      const auditData = runHealthAudit();
      mainWindow.webContents.send(Channels.INSIGHTS_GET_SUMMARY, auditData);
    } catch (err) {
      console.error('[HealthLoop] Audit error:', err.message);
    }
  }, 30_000);
}

const vaultIpc = require('./ipc/vault');
const consentIpc = require('./ipc/consent');
const { ipcMain } = require('electron');

// 2. Wrap the startup logic in an async block to handle the dynamic import
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

  // ── Start Autonomous Health Loop after window is ready ──
  mainWindow.webContents.once('did-finish-load', () => {
    startHealthAuditLoop();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(isDevHelper);
    }
  });
});

app.on('window-all-closed', () => {
  // Clear the health audit interval to prevent orphaned timers
  if (healthAuditInterval) {
    clearInterval(healthAuditInterval);
    healthAuditInterval = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});