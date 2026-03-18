# Project `src` Export

This file contains the folder structure and the full source of every file under the `src/` directory.

## Folder structure

src/
- shared/
  - ipcChannels.js
  - constants.js
- main/
  - security.js
  - preload.js
  - main.js
  - ipc/
    - consent.js
    - index.js
    - env.js
    - demo.js
    - auth.js
    - ai.js
    - insights.js
    - vault.js
    - storage.js
    - security.js
    - marketplace.js
- renderer/
  - pages/
    - SettingsPage.jsx
    - DashboardPage.jsx
    - ArchivesPage.jsx
  - main.jsx
  - index.html
  - styles/
    - tailwind.css
  - lib/
    - ai/
      - aiClient.js
    - storage/
      - secureStorage.js
  - App.jsx
  - components/
    - layout/
      - TopBar.jsx
      - SidebarNav.jsx
      - AppLayout.jsx
- features/
  - README.md
  - security/
    - useSecurity.js
    - securityIpc.js
    - Security.jsx
  - vault/
    - vaultIpc.js
    - useVault.js
    - placeholderData.js
  - marketplace/
    - Marketplace.jsx
    - useMarketplace.js
    - marketplaceIpc.js
  - insights/
    - useInsights.js
    - insightsIpc.js
    - Insights.jsx
  - auth/
    - Auth.jsx
    - useAuth.js
    - authIpc.js
  - consent/
    - Consent.jsx
    - useConsent.js
    - consentIpc.js
  - demo/
    - useDemo.js
    - demoIpc.js
    - Demo.jsx

---

## Files and contents

### src/shared/ipcChannels.js
```javascript
// IPC channel constants shared between main and renderer (via preload).

const NS = 'aura';

module.exports = {
  // Core (existing)
  STORAGE_SAVE_SECURE_ITEM: `${NS}:storage:saveSecureItem`,
  STORAGE_GET_SECURE_ITEM: `${NS}:storage:getSecureItem`,
  AI_RUN_ARCHIVE_ASSISTANT: `${NS}:ai:runArchiveAssistant`,
  ENV_GET_APP_NAME: `${NS}:env:getAppName`,
  ENV_GET_PLATFORM: `${NS}:env:getPlatform`,

  // Auth
  AUTH_GET_SESSION: `${NS}:auth:getSession`,
  AUTH_LOGIN: `${NS}:auth:login`,
  AUTH_LOGOUT: `${NS}:auth:logout`,

  // Vault
  VAULT_LIST_ITEMS: `${NS}:vault:listItems`,
  VAULT_GET_ITEM: `${NS}:vault:getItem`,
  VAULT_SAVE_ITEM: `${NS}:vault:saveItem`,

  // Insights
  INSIGHTS_GET_SUMMARY: `${NS}:insights:getSummary`,
  INSIGHTS_GET_ACTIVITY: `${NS}:insights:getActivity`,

  // Marketplace
  MARKETPLACE_LIST_ITEMS: `${NS}:marketplace:listItems`,
  MARKETPLACE_GET_ITEM_DETAILS: `${NS}:marketplace:getItemDetails`,

  // Consent
  CONSENT_GET_ALL: `${NS}:consent:getAll`,
  CONSENT_UPDATE: `${NS}:consent:update`,

  // Security
  SECURITY_GET_STATUS: `${NS}:security:getStatus`,
  SECURITY_GET_POLICIES: `${NS}:security:getPolicies`,

  // Demo
  DEMO_PING: `${NS}:demo:ping`,
  DEMO_GET_INFO: `${NS}:demo:getInfo`
};
```

### src/shared/constants.js
```javascript
/**
 * Shared constants for main and renderer processes.
 * Use for app-wide values, feature names, and cross-process contracts.
 */

module.exports = {
  /** Application identity */
  APP_NAME: 'AURA Desktop Vault',
  APP_SCOPE: 'aura',

  /** Feature identifiers (for routing, analytics, consent scopes) */
  FEATURES: {
    AUTH: 'auth',
    VAULT: 'vault',
    INSIGHTS: 'insights',
    MARKETPLACE: 'marketplace',
    CONSENT: 'consent',
    SECURITY: 'security',
    DEMO: 'demo'
  },

  /** Default UI state */
  DEFAULTS: {
    SIDEBAR_WIDTH: 256,
    TOP_BAR_HEIGHT: 56
  },

  /** IPC namespace prefix for feature channels */
  IPC_NAMESPACE: 'aura'
};
```

### src/main/security.js
```javascript
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
    preload: require('node:path').join(__dirname, 'preload.js'),
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
```

### src/main/preload.js
```javascript
const { contextBridge, ipcRenderer } = require('electron');
const Channels = require('../shared/ipcChannels');

// Securely expose a limited API surface to the renderer.
contextBridge.exposeInMainWorld('aura', {
  // Placeholder: Encrypted local storage integration hook
  storage: {
    async saveSecureItem(key, value) {
      return ipcRenderer.invoke(Channels.STORAGE_SAVE_SECURE_ITEM, { key, value });
    },
    async getSecureItem(key) {
      return ipcRenderer.invoke(Channels.STORAGE_GET_SECURE_ITEM, { key });
    }
  },

  // Placeholder: AI integration hook
  ai: {
    async runArchiveAssistant(payload) {
      return ipcRenderer.invoke(Channels.AI_RUN_ARCHIVE_ASSISTANT, { payload });
    }
  },

  // Read-only environment info
  env: {
    async getAppName() {
      return ipcRenderer.invoke(Channels.ENV_GET_APP_NAME);
    },
    async getPlatform() {
      return ipcRenderer.invoke(Channels.ENV_GET_PLATFORM);
    }
  },

  // Feature: Auth
  auth: {
    async getSession() {
      return ipcRenderer.invoke(Channels.AUTH_GET_SESSION);
    },
    async login(payload) {
      return ipcRenderer.invoke(Channels.AUTH_LOGIN, payload);
    },
    async logout() {
      return ipcRenderer.invoke(Channels.AUTH_LOGOUT);
    }
  },

  // Feature: Vault
  vault: {
    async listItems() {
      return ipcRenderer.invoke(Channels.VAULT_LIST_ITEMS);
    },
    async getItem(payload) {
      return ipcRenderer.invoke(Channels.VAULT_GET_ITEM, payload);
    },
    async saveItem(payload) {
      return ipcRenderer.invoke(Channels.VAULT_SAVE_ITEM, payload);
    }
  },

  // Feature: Insights
  insights: {
    async getSummary() {
      return ipcRenderer.invoke(Channels.INSIGHTS_GET_SUMMARY);
    },
    async getActivity(payload) {
      return ipcRenderer.invoke(Channels.INSIGHTS_GET_ACTIVITY, payload);
    }
  },

  // Feature: Marketplace
  marketplace: {
    async listItems() {
      return ipcRenderer.invoke(Channels.MARKETPLACE_LIST_ITEMS);
    },
    async getItemDetails(payload) {
      return ipcRenderer.invoke(Channels.MARKETPLACE_GET_ITEM_DETAILS, payload);
    }
  },

  // Feature: Consent
  consent: {
    async getAll() {
      return ipcRenderer.invoke(Channels.CONSENT_GET_ALL);
    },
    async update(payload) {
      return ipcRenderer.invoke(Channels.CONSENT_UPDATE, payload);
    }
  },

  // Feature: Security
  security: {
    async getStatus() {
      return ipcRenderer.invoke(Channels.SECURITY_GET_STATUS);
    },
    async getPolicies() {
      return ipcRenderer.invoke(Channels.SECURITY_GET_POLICIES);
    }
  },

  // Feature: Demo
  demo: {
    async ping() {
      return ipcRenderer.invoke(Channels.DEMO_PING);
    },
    async getInfo() {
      return ipcRenderer.invoke(Channels.DEMO_GET_INFO);
    }
  }
});
```

### src/main/main.js
```javascript
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
```

### src/renderer/pages/SettingsPage.jsx
```jsx
import React from 'react';

function SettingsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Settings</h2>
        <p className="text-xs text-slate-400">
          Configure encryption, vault behavior, and AI integration policies.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-aura-border bg-slate-950/80 p-4 text-xs text-slate-200">
          <h3 className="text-xs font-semibold text-slate-100">Encryption</h3>
          <p className="mt-1 text-slate-400">
            Wire this panel into your key management and local encrypted storage module.
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex items-center justify-between gap-3">
              <span>Require vault passphrase on startup</span>
              <span className="inline-flex h-5 w-9 items-center rounded-full bg-slate-800 px-0.5">
                <span className="h-4 w-4 rounded-full bg-emerald-400 translate-x-4" />
              </span>
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Auto-lock after inactivity</span>
              <span className="rounded border border-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                15 min
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-aura-border bg-slate-950/80 p-4 text-xs text-slate-200">
          <h3 className="text-xs font-semibold text-slate-100">AI Policies</h3>
          <p className="mt-1 text-slate-400">
            Future AI requests should respect these global policies before leaving the local sandbox.
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex items-center justify-between gap-3">
              <span>Allow external AI APIs</span>
              <span className="inline-flex h-5 w-9 items-center rounded-full bg-slate-900 px-0.5">
                <span className="h-4 w-4 rounded-full bg-slate-600" />
              </span>
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Redact sensitive entities before sending</span>
              <span className="inline-flex h-5 w-9 items-center rounded-full bg-slate-800 px-0.5">
                <span className="h-4 w-4 rounded-full bg-emerald-400 translate-x-4" />
              </span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
```

### src/renderer/pages/DashboardPage.jsx
```jsx
import React from 'react';

function StatCard({ label, value, hint }) {
  return (
    <div className="flex flex-col rounded-xl border border-aura-border bg-slate-950/80 p-4 shadow-sm shadow-slate-950/40">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{hint}</div>
    </div>
  );
}

function ActivityItem({ title, timestamp, level }) {
  const levelColor =
    level === 'warning'
      ? 'text-amber-300 border-amber-500/30 bg-amber-500/5'
      : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/5';

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/70 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${level === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
        <span className="text-slate-200">{title}</span>
      </div>
      <span className={`rounded-full px-2 py-0.5 ${levelColor}`}>{timestamp}</span>
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Indexed Artifacts"
          value="1,248"
          hint="Documents, conversations, and knowledge fragments currently tracked."
        />
        <StatCard
          label="Integrity Score"
          value="99.7%"
          hint="Consistency and redundancy across your local vault."
        />
        <StatCard
          label="AI Impact Radius"
          value="Local-first"
          hint="AI suggestions are constrained to your encrypted, local context."
        />
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3 rounded-xl border border-aura-border bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900/90 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Vault Activity</h2>
          <p className="text-xs text-slate-400">
            AURA continuously maintains your personal archive while respecting explicit user controls.
          </p>
          <div className="mt-3 space-y-2">
            <ActivityItem
              title="New note cluster created: &quot;Research / Autonomous Systems&quot;"
              timestamp="2 min ago"
              level="ok"
            />
            <ActivityItem
              title="Archive reconciliation completed for &quot;Design Journal&quot;"
              timestamp="18 min ago"
              level="ok"
            />
            <ActivityItem
              title="AI assistant requested access to &quot;Private / Finance&quot; (blocked)"
              timestamp="42 min ago"
              level="warning"
            />
          </div>
        </div>
        <div className="space-y-3 rounded-xl border border-aura-border bg-slate-950/80 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Guardrails</h2>
          <p className="text-xs text-slate-400">
            High-level controls governing how AURA and connected AI systems can interact with your data.
          </p>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                <span className="font-medium">Local-first storage</span> — data is written to local encrypted
                volumes by default.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300" />
              <span>
                <span className="font-medium">Explicit AI scopes</span> — every external model call is scoped to a
                user-approved context.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>
                <span className="font-medium">Transparent flows</span> — upcoming integration points will surface
                clear, inspectable plans.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
```

### src/renderer/pages/ArchivesPage.jsx
```jsx
import React from 'react';

function ArchivesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Archives</h2>
        <p className="text-xs text-slate-400">
          Organize, query, and refine the long-term memory of your personal systems.
        </p>
      </header>

      <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4 text-xs text-slate-300">
        <p className="mb-2 text-slate-400">
          This is a placeholder for the core AURA archive management UI. The layout is designed to host:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Hierarchical collections and lenses over your data.</li>
          <li>Encrypted local indexes and vector search controls.</li>
          <li>AI-assisted curation tools within strict, user-defined boundaries.</li>
        </ul>
      </div>
    </div>
  );
}

export default ArchivesPage;
```

### src/renderer/main.jsx
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/tailwind.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

### src/renderer/index.html
```html
<!doctype html>
<html lang="en" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' http://localhost:*/"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AURA Desktop Vault</title>
  </head>
  <body class="h-full bg-aura-bg text-slate-100">
    <div id="root"></div>
    <script type="module" src="/main.jsx"></script>
  </body>
</html>
```

### src/main/ipc/consent.js
```javascript
const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels');

function registerConsentIpc() {
  ipcMain.handle(Channels.CONSENT_GET_ALL, async () => {
    return { ok: true, consents: {} };
  });

  ipcMain.handle(Channels.CONSENT_UPDATE, async (_event, { scope, granted }) => {
    if (!scope || typeof scope !== 'string') return { ok: false, error: 'Invalid scope' };
    void granted;
    return { ok: true };
  });
}

module.exports = { registerConsentIpc };
```

### src/main/ipc/index.js
```javascript
const { registerStorageIpc } = require('./storage');
const { registerAiIpc } = require('./ai');
const { registerEnvIpc } = require('./env');
const { registerAuthIpc } = require('./auth');
const { registerVaultIpc } = require('./vault');
const { registerInsightsIpc } = require('./insights');
const { registerMarketplaceIpc } = require('./marketplace');
const { registerConsentIpc } = require('./consent');
const { registerSecurityIpc } = require('./security');
const { registerDemoIpc } = require('./demo');

function registerIpcHandlers() {
  registerEnvIpc();
  registerStorageIpc();
  registerAiIpc();
  registerAuthIpc();
  registerVaultIpc();
  registerInsightsIpc();
  registerMarketplaceIpc();
  registerConsentIpc();
  registerSecurityIpc();
  registerDemoIpc();
}

module.exports = { registerIpcHandlers };
```

### src/main/ipc/env.js
```javascript
const { ipcMain, app } = require('electron');
const Channels = require('../../shared/ipcChannels');

function registerEnvIpc() {
  ipcMain.handle(Channels.ENV_GET_APP_NAME, async () => {
    return app.getName();
  });

  ipcMain.handle(Channels.ENV_GET_PLATFORM, async () => {
    return process.platform;
  });
}

module.exports = { registerEnvIpc };
```

### src/main/ipc/demo.js
```javascript
const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels');
const Constants = require('../../shared/constants');

function registerDemoIpc() {
  ipcMain.handle(Channels.DEMO_PING, async () => {
    return { ok: true, pong: Date.now() };
  });

  ipcMain.handle(Channels.DEMO_GET_INFO, async () => {
    return {
      ok: true,
      info: {
        version: '0.1.0',
        appName: Constants.APP_NAME,
        features: Object.values(Constants.FEATURES)
      }
    };
  });
}

module.exports = { registerDemoIpc };
```

### src/main/ipc/auth.js
```javascript
const { ipcMain, app } = require('electron');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Channels = require('../../shared/ipcChannels');

const AUTH_STORE_FILENAME = 'auth-store.json';
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;
const SALT = 'aura-vault-v1';

function getAuthStorePath() {
  return path.join(app.getPath('userData'), AUTH_STORE_FILENAME);
}

function hashPassphrase(passphrase) {
  if (!passphrase || typeof passphrase !== 'string') return null;
  return crypto.scryptSync(passphrase, SALT, KEY_LEN).toString('hex');
}

function loadStoredHash() {
  try {
    const p = getAuthStorePath();
    if (!fs.existsSync(p)) return null;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return data.vaultHash && typeof data.vaultHash === 'string' ? data.vaultHash : null;
  } catch {
    return null;
  }
}

function saveStoredHash(hash) {
  try {
    const p = getAuthStorePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify({ vaultHash: hash }), 'utf8');
    return true;
  } catch {
    return false;
  }
}

// In-memory session only (cleared on logout; passphrase hash is persisted)
let currentSession = null;

function registerAuthIpc() {
  ipcMain.handle(Channels.AUTH_GET_SESSION, async () => {
    return { ok: true, session: currentSession };
  });

  ipcMain.handle(Channels.AUTH_LOGIN, async (_event, { username, passphrase }) => {
    const u = username?.trim();
    if (!u || u.length === 0) return { ok: false, error: 'Username is required' };
    if (!passphrase || typeof passphrase !== 'string') return { ok: false, error: 'Passphrase is required' };

    const hash = hashPassphrase(passphrase);
    if (!hash) return { ok: false, error: 'Invalid passphrase' };

    const storedHash = loadStoredHash();

    if (!storedHash) {
      // First-time setup: store hash and create session
      if (!saveStoredHash(hash)) return { ok: false, error: 'Could not save vault' };
      currentSession = { username: u, createdAt: Date.now() };
      return { ok: true, session: currentSession };
    }

    // Verify passphrase
    if (hash !== storedHash) {
      return { ok: false, error: 'Invalid passphrase' };
    }

    currentSession = { username: u, createdAt: Date.now() };
    return { ok: true, session: currentSession };
  });

  ipcMain.handle(Channels.AUTH_LOGOUT, async () => {
    currentSession = null;
    return { ok: true };
  });
}

module.exports = { registerAuthIpc };
```

### src/main/ipc/ai.js
```javascript
const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels');

/**
 * Register AI IPC handlers.
 *
 * NOTE: Keep API keys out of the renderer process.
 * When you integrate an AI provider, do it here in main (or in a separate local service),
 * and expose only the minimum capabilities via IPC.
 */
function registerAiIpc() {
  ipcMain.handle(Channels.AI_RUN_ARCHIVE_ASSISTANT, async (_event, { payload }) => {
    void payload;
    return {
      ok: false,
      error: 'Not implemented (AI stub)',
      result: { message: 'AI integration not yet wired. This is a safe placeholder.' }
    };
  });
}

module.exports = { registerAiIpc };
```

### src/renderer/styles/tailwind.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html,
  body,
  #root {
    height: 100%;
  }
}
```

### src/main/ipc/insights.js
```javascript
const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels');

function registerInsightsIpc() {
  ipcMain.handle(Channels.INSIGHTS_GET_SUMMARY, async () => {
    return { ok: true, summary: { indexedCount: 0, integrityScore: 100 } };
  });

  ipcMain.handle(Channels.INSIGHTS_GET_ACTIVITY, async (_event, { limit }) => {
    const max = Math.min(Number(limit) || 10, 50);
    return { ok: true, activity: [] };
  });
}

module.exports = { registerInsightsIpc };
```

### src/main/ipc/vault.js
```javascript
const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels');

function registerVaultIpc() {
  ipcMain.handle(Channels.VAULT_LIST_ITEMS, async () => {
    // Stub: replace with real vault listing
    return { ok: true, items: [] };
  });

  ipcMain.handle(Channels.VAULT_GET_ITEM, async (_event, { id }) => {
    if (!id || typeof id !== 'string') return { ok: false, error: 'Invalid id', item: null };
    return { ok: true, item: null };
  });

  ipcMain.handle(Channels.VAULT_SAVE_ITEM, async (_event, { id, payload }) => {
    if (!id || typeof id !== 'string') return { ok: false, error: 'Invalid id' };
    void payload;
    return { ok: true };
  });
}

module.exports = { registerVaultIpc };
```

### src/renderer/lib/ai/aiClient.js
```javascript
// Renderer-side wrapper over the secure preload AI API.
// Keep provider keys and network calls in main; renderer only sends approved payloads.

export async function runArchiveAssistant(payload) {
  if (!window.aura?.ai?.runArchiveAssistant) {
    return { ok: false, error: 'AI API not available', result: null };
  }
  return window.aura.ai.runArchiveAssistant(payload);
}
```

### src/features/README.md
```markdown
# Feature modules

Each feature under `src/features/` follows the same layout:

- **`<Feature>.jsx`** — React component (UI).
- **`use<Feature>.js`** — Dedicated hook (state + IPC calls).
- **`<feature>Ipc.js`** — IPC service (renderer-side only; invokes `window.aura.<feature>`).

Main process handlers live in `src/main/ipc/` (e.g. `auth.js`, `vault.js`). Channel names are defined in `src/shared/ipcChannels.js`. Shared app constants are in `src/shared/constants.js` and used by both main and renderer.

## Features

| Feature      | Route         | Component   | Hook           | IPC service      |
|-------------|----------------|-------------|----------------|------------------|
| Auth        | `/auth`        | `Auth.jsx`  | `useAuth.js`   | `authIpc.js`     |
| Vault       | `/vault`       | `Vault.jsx` | `useVault.js`  | `vaultIpc.js`    |
| Insights    | `/insights`    | `Insights.jsx` | `useInsights.js` | `insightsIpc.js` |
| Marketplace | `/marketplace` | `Marketplace.jsx` | `useMarketplace.js` | `marketplaceIpc.js` |
| Consent     | `/consent`     | `Consent.jsx` | `useConsent.js` | `consentIpc.js`  |
| Security    | `/security`    | `Security.jsx` | `useSecurity.js` | `securityIpc.js` |
| Demo        | `/demo`        | `Demo.jsx`  | `useDemo.js`   | `demoIpc.js`     |

## Importing in the renderer

Use the `@features` alias (see `vite.renderer.config.mts`):

```js
import Auth from '@features/auth/Auth';
import { useAuth } from '@features/auth/useAuth';
import * as authIpc from '@features/auth/authIpc';
```
```

### src/renderer/lib/storage/secureStorage.js
```javascript
// Renderer-side wrapper over the secure preload API.
// This is where your UI can interact with the encrypted storage layer without knowing IPC details.

export async function saveSecureItem(key, value) {
  if (!window.aura?.storage?.saveSecureItem) {
    return { ok: false, error: 'Secure storage API not available' };
  }
  return window.aura.storage.saveSecureItem(key, value);
}

export async function getSecureItem(key) {
  if (!window.aura?.storage?.getSecureItem) {
    return { ok: false, error: 'Secure storage API not available', value: null };
  }
  return window.aura.storage.getSecureItem(key);
}
```

### src/features/security/useSecurity.js
```javascript
import { useState, useEffect, useCallback } from 'react';
import * as securityIpc from './securityIpc';

export function useSecurity() {
  const [status, setStatus] = useState(null);
  const [policies, setPolicies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [statusRes, policiesRes] = await Promise.all([
      securityIpc.getStatus(),
      securityIpc.getPolicies()
    ]);
    if (statusRes.ok) setStatus(statusRes.status ?? null);
    if (policiesRes.ok) setPolicies(policiesRes.policies ?? null);
    if (!statusRes.ok) setError(statusRes.error ?? 'Failed to load security');
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, policies, loading, error, refresh };
}
```

### src/features/security/securityIpc.js
```javascript
/**
 * Security IPC service — renderer-side only.
 */

export async function getStatus() {
  if (!window.aura?.security?.getStatus) return { ok: false, error: 'Security API not available', status: null };
  return window.aura.security.getStatus();
}

export async function getPolicies() {
  if (!window.aura?.security?.getPolicies) return { ok: false, error: 'Security API not available', policies: null };
  return window.aura.security.getPolicies();
}
```

### src/features/security/Security.jsx
```jsx
import React from 'react';
import { useSecurity } from './useSecurity';

function Security() {
  const { status, policies, loading, error } = useSecurity();

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Security</h2>
        <p className="text-xs text-slate-400">Vault status and policies.</p>
      </header>
      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4">
          <h3 className="text-xs font-medium text-slate-400">Status</h3>
          {loading ? (
            <p className="mt-2 text-xs text-slate-500">Loading…</p>
          ) : status ? (
            <dl className="mt-2 space-y-1 text-xs text-slate-300">
              <dt>Vault locked</dt>
              <dd>{status.vaultLocked ? 'Yes' : 'No'}</dd>
              <dt>Last unlock</dt>
              <dd>{status.lastUnlock ?? '—'}</dd>
            </dl>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No status</p>
          )}
        </div>
        <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4">
          <h3 className="text-xs font-medium text-slate-400">Policies</h3>
          {loading ? (
            <p className="mt-2 text-xs text-slate-500">Loading…</p>
          ) : policies ? (
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {Object.entries(policies).map(([key, value]) => (
                <li key={key}>{key}: {String(value)}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No policies</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Security;
```

### src/features/vault/vaultIpc.js
```javascript
/**
 * Vault IPC service — renderer-side only.
 */

export async function listItems() {
  if (!window.aura?.vault?.listItems) return { ok: false, error: 'Vault API not available', items: [] };
  return window.aura.vault.listItems();
}

export async function getItem(id) {
  if (!window.aura?.vault?.getItem) return { ok: false, error: 'Vault API not available', item: null };
  return window.aura.vault.getItem({ id });
}

export async function saveItem(id, payload) {
  if (!window.aura?.vault?.saveItem) return { ok: false, error: 'Vault API not available' };
  return window.aura.vault.saveItem({ id, payload });
}
```

### src/features/vault/useVault.js
```javascript
import { useState, useEffect, useCallback } from 'react';
import * as vaultIpc from './vaultIpc';

export function useVault() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await vaultIpc.listItems();
    if (res.ok) setItems(res.items ?? []);
    else setError(res.error ?? 'Failed to list items');
    setLoading(false);
    return res;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getItem = useCallback((id) => vaultIpc.getItem(id), []);
  const saveItem = useCallback((id, payload) => vaultIpc.saveItem(id, payload), []);

  return { items, loading, error, refresh, getItem, saveItem };
}
```

### src/features/vault/placeholderData.js
```javascript
/**
 * Encrypted data placeholders for the Data Vault screen.
 * In production these would be real vault items decrypted in main process.
 */

export const ENCRYPTED_PLACEHOLDERS = [
  { id: 'vault-1', nameMasked: '••••••••••••••••', type: 'note', lastModified: '2025-01-28T14:32:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-2', nameMasked: '••••••••••••••••', type: 'document', lastModified: '2025-01-27T09:15:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-3', nameMasked: '••••••••••••••••', type: 'note', lastModified: '2025-01-26T18:00:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-4', nameMasked: '••••••••••••••••', type: 'credential', lastModified: '2025-01-25T11:22:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-5', nameMasked: '••••••••••••••••', type: 'note', lastModified: '2025-01-24T16:45:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-6', nameMasked: '••••••••••••••••', type: 'document', lastModified: '2025-01-23T08:30:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-7', nameMasked: '••••••••••••••••', type: 'note', lastModified: '2025-01-22T20:12:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
];

export function formatVaultDate(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}
```

### src/features/marketplace/Marketplace.jsx
```jsx
import React from 'react';
import { useMarketplace } from './useMarketplace';

function Marketplace() {
  const { items, loading, error } = useMarketplace();

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Marketplace</h2>
        <p className="text-xs text-slate-400">Discover templates, lenses, and add-ons.</p>
      </header>
      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}
      <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4">
        {loading ? (
          <p className="text-xs text-slate-400">Loading marketplace…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-400">No items available. Simulation mode.</p>
        ) : (
          <ul className="space-y-2 text-xs text-slate-300">
            {items.map((item) => (
              <li key={item.id}>{item.name ?? item.id}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Marketplace;
```

### src/features/marketplace/useMarketplace.js
```javascript
import { useState, useEffect, useCallback } from 'react';
import * as marketplaceIpc from './marketplaceIpc';

export function useMarketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await marketplaceIpc.listItems();
    if (res.ok) setItems(res.items ?? []);
    else setError(res.error ?? 'Failed to list marketplace items');
    setLoading(false);
    return res;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getItemDetails = useCallback((id) => marketplaceIpc.getItemDetails(id), []);

  return { items, loading, error, refresh, getItemDetails };
}
```

### src/features/marketplace/marketplaceIpc.js
```javascript
/**
 * Marketplace IPC service — renderer-side only.
 */

export async function listItems() {
  if (!window.aura?.marketplace?.listItems) return { ok: false, error: 'Marketplace API not available', items: [] };
  return window.aura.marketplace.listItems();
}

export async function getItemDetails(id) {
  if (!window.aura?.marketplace?.getItemDetails) return { ok: false, error: 'Marketplace API not available', item: null };
  return window.aura.marketplace.getItemDetails({ id });
}
```

### src/main/ipc/storage.js
```javascript
const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels');

/**
 * Register storage IPC handlers.
 *
 * NOTE: This is a secure stub. The actual implementation should:
 * - use a per-user vault key derived from a passphrase (or OS keychain)
 * - encrypt at rest (e.g., AES-GCM)
 * - authenticate requests and validate inputs
 * - store data in app.getPath('userData') or a user-selected vault location
 */
function registerStorageIpc() {
  ipcMain.handle(Channels.STORAGE_SAVE_SECURE_ITEM, async (_event, { key, value }) => {
    if (typeof key !== 'string' || key.length === 0) return { ok: false, error: 'Invalid key' };

    // Placeholder: persist encrypted data
    void value;
    return { ok: false, error: 'Not implemented (encrypted storage stub)' };
  });

  ipcMain.handle(Channels.STORAGE_GET_SECURE_ITEM, async (_event, { key }) => {
    if (typeof key !== 'string' || key.length === 0) return { ok: false, error: 'Invalid key' };

    return { ok: false, error: 'Not implemented (encrypted storage stub)', value: null };
  });
}

module.exports = { registerStorageIpc };
```

### src/main/ipc/security.js
```javascript
const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels');

function registerSecurityIpc() {
  ipcMain.handle(Channels.SECURITY_GET_STATUS, async () => {
    return { ok: true, status: { vaultLocked: false, lastUnlock: null } };
  });

  ipcMain.handle(Channels.SECURITY_GET_POLICIES, async () => {
    return { ok: true, policies: { localFirst: true, aiScoped: true } };
  });
}

module.exports = { registerSecurityIpc };
```

### src/main/ipc/marketplace.js
```javascript
const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels');

function registerMarketplaceIpc() {
  ipcMain.handle(Channels.MARKETPLACE_LIST_ITEMS, async () => {
    return { ok: true, items: [] };
  });

  ipcMain.handle(Channels.MARKETPLACE_GET_ITEM_DETAILS, async (_event, { id }) => {
    if (!id || typeof id !== 'string') return { ok: false, error: 'Invalid id', item: null };
    return { ok: true, item: null };
  });
}

module.exports = { registerMarketplaceIpc };
```

### src/renderer/App.jsx
```jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ArchivesPage from './pages/ArchivesPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
```

### src/renderer/components/layout/TopBar.jsx
```jsx
import React from 'react';

function TopBar() {
  const [platform, setPlatform] = React.useState('unknown');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await window.aura?.env?.getPlatform?.();
        if (mounted && p) setPlatform(p);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-aura-border bg-slate-950/60 px-6 backdrop-blur">
      <div>
        <h1 className="text-sm font-semibold text-slate-100">Vault Overview</h1>
        <p className="text-xs text-slate-400">
          Monitor your autonomous archive activity and integrity at a glance.
        </p>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-900/70 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Vault Engine</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-300">Idle</span>
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-slate-800 bg-slate-950/80 px-2 py-1 md:flex">
          <span className="text-slate-500">Platform</span>
          <span className="text-slate-300">{platform}</span>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
```

### src/features/consent/Consent.jsx
```jsx
import React from 'react';
import { useConsent } from './useConsent';

function Consent() {
  const { consents, loading, error } = useConsent();

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Consent</h2>
        <p className="text-xs text-slate-400">Manage data and AI usage permissions.</p>
      </header>
      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}
      <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4">
        {loading ? (
          <p className="text-xs text-slate-400">Loading consents…</p>
        ) : Object.keys(consents).length === 0 ? (
          <p className="text-xs text-slate-400">No consent records. Defaults apply.</p>
        ) : (
          <ul className="space-y-2 text-xs text-slate-300">
            {Object.entries(consents).map(([scope, granted]) => (
              <li key={scope}>
                <span className="font-medium">{scope}</span>: {granted ? 'Granted' : 'Denied'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Consent;
```

### src/renderer/components/layout/SidebarNav.jsx
```jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/archives', label: 'Archives' },
  { to: '/settings', label: 'Settings' }
];

function SidebarNav() {
  return (
    <aside className="flex w-64 flex-col border-r border-aura-border bg-slate-950/70 backdrop-blur">
      <div className="flex h-16 items-center gap-2 border-b border-aura-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aura-accent to-aura-accentSoft shadow-lg shadow-sky-500/40">
          <span className="text-lg font-semibold text-slate-950">A</span>
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">AURA</div>
          <div className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
            Desktop Vault
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 rounded-md px-3 py-2 transition-colors',
                isActive
                  ? 'bg-aura-accent/10 text-aura-accent border border-aura-accent/40 shadow-sm shadow-sky-500/30'
                  : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'
              ].join(' ')
            }
          >
            <span className="h-1.5 w-1.5 rounded-full bg-aura-accent/70" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-aura-border px-4 py-3 text-[11px] text-slate-500">
        <div className="font-medium text-slate-300">Autonomous User-Regulated Archives</div>
        <div>Local-first, encrypted by design. AI optional.</div>
      </div>
    </aside>
  );
}

export default SidebarNav;
```

### src/features/auth/Auth.jsx
```jsx
import React from 'react';
import { useAuth } from './useAuth';

function Auth() {
  const { session, loading, error, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="rounded-xl border border-aura-border bg-slate-950/80 p-6 text-center text-slate-400">
        Loading auth…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Auth</h2>
        <p className="text-xs text-slate-400">Session and vault access.</p>
      </header>
      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}
      <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4 text-xs text-slate-300">
        {session ? (
          <div className="flex items-center justify-between">
            <span>Logged in as <strong>{session.username}</strong></span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        ) : (
          <p>No active session. Use Settings or vault unlock to sign in.</p>
        )}
      </div>
    </div>
  );
}

export default Auth;
```

### src/renderer/components/layout/AppLayout.jsx
```jsx
import React from 'react';
import SidebarNav from './SidebarNav';
import TopBar from './TopBar';

function AppLayout({ children }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-aura-bg text-slate-100">
      <SidebarNav />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-slate-950/60 border-t border-aura-border">
          <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
```

### src/features/auth/useAuth.js
```javascript
import { useState, useEffect, useCallback } from 'react';
import * as authIpc from './authIpc';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await authIpc.getSession();
    if (res.ok) setSession(res.session ?? null);
    else setError(res.error ?? 'Failed to get session');
    setLoading(false);
    return res;
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (username, passphrase) => {
    setError(null);
    const res = await authIpc.login(username, passphrase);
    if (res.ok) setSession(res.session ?? null);
    else setError(res.error ?? 'Login failed');
    return res;
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    const res = await authIpc.logout();
    if (res.ok) setSession(null);
    return res;
  }, []);

  return { session, loading, error, refreshSession, login, logout };
}
```

### src/features/consent/useConsent.js
```javascript
import { useState, useEffect, useCallback } from 'react';
import * as consentIpc from './consentIpc';

export function useConsent() {
  const [consents, setConsents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await consentIpc.getAll();
    if (res.ok) setConsents(res.consents ?? {});
    else setError(res.error ?? 'Failed to load consents');
    setLoading(false);
    return res;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateConsent = useCallback(async (scope, granted) => {
    const res = await consentIpc.update(scope, granted);
    if (res.ok) await refresh();
    return res;
  }, [refresh]);

  return { consents, loading, error, refresh, updateConsent };
}
```

### src/features/auth/authIpc.js
```javascript
/**
 * Auth IPC service — renderer-side only.
 * Invokes main process via preload (window.aura.auth).
 */

export async function getSession() {
  if (!window.aura?.auth?.getSession) return { ok: false, error: 'Auth API not available', session: null };
  return window.aura.auth.getSession();
}

export async function login(username, passphrase) {
  if (!window.aura?.auth?.login) return { ok: false, error: 'Auth API not available' };
  return window.aura.auth.login({ username, passphrase });
}

export async function logout() {
  if (!window.aura?.auth?.logout) return { ok: false, error: 'Auth API not available' };
  return window.aura.auth.logout();
}
```

### src/features/consent/consentIpc.js
```javascript
/**
 * Consent IPC service — renderer-side only.
 */

export async function getAll() {
  if (!window.aura?.consent?.getAll) return { ok: false, error: 'Consent API not available', consents: {} };
  return window.aura.consent.getAll();
}

export async function update(scope, granted) {
  if (!window.aura?.consent?.update) return { ok: false, error: 'Consent API not available' };
  return window.aura.consent.update({ scope, granted });
}
```

### src/features/demo/useDemo.js
```javascript
import { useState, useCallback } from 'react';
import * as demoIpc from './demoIpc';

export function useDemo() {
  const [info, setInfo] = useState(null);
  const [latency, setLatency] = useState(null);
  const [error, setError] = useState(null);

  const ping = useCallback(async () => {
    setError(null);
    const start = Date.now();
    const res = await demoIpc.ping();
    if (res.ok) setLatency(Date.now() - start);
    else setError(res.error ?? 'Ping failed');
    return res;
  }, []);

  const loadInfo = useCallback(async () => {
    setError(null);
    const res = await demoIpc.getInfo();
    if (res.ok) setInfo(res.info ?? null);
    else setError(res.error ?? 'Failed to get info');
    return res;
  }, []);

  return { info, latency, error, ping, loadInfo };
}
```

### src/features/demo/demoIpc.js
```javascript
/**
 * Demo IPC service — renderer-side only.
 */

export async function ping() {
  if (!window.aura?.demo?.ping) return { ok: false, error: 'Demo API not available', pong: null };
  return window.aura.demo.ping();
}

export async function getInfo() {
  if (!window.aura?.demo?.getInfo) return { ok: false, error: 'Demo API not available', info: null };
  return window.aura.demo.getInfo();
}
```

### src/features/demo/Demo.jsx
```jsx
import React from 'react';
import { useDemo } from './useDemo';

function Demo() {
  const { info, latency, error, ping, loadInfo } = useDemo();

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Demo</h2>
        <p className="text-xs text-slate-400">Verify IPC and feature wiring.</p>
      </header>
      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}
      <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={ping}
            className="rounded-md border border-aura-border bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            Ping main process
          </button>
          <button
            type="button"
            onClick={loadInfo}
            className="rounded-md border border-aura-border bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            Load info
          </button>
        </div>
        {latency != null && (
          <p className="text-xs text-slate-400">Last ping latency: <strong>{latency} ms</strong></p>
        )}
        {info && (
          <pre className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-[11px] text-slate-300 overflow-auto">
            {JSON.stringify(info, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default Demo;
```
