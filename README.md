# AURA Desktop Vault

Production-grade **Electron + React + Tailwind** starter for **AURA (Autonomous User-Regulated Archives)**.

## Architecture highlights

- **Secure by default**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- **Preload boundary**: renderer only accesses privileged features via `window.aura` (IPC)
- **Ready for encrypted local storage**: stubbed IPC handlers in `src/main/ipc/storage.js`
- **Ready for AI APIs**: stubbed IPC handler in `src/main/ipc/ai.js` (keep keys in main)
- **Routing**: `react-router-dom` with an app layout + pages
- **Modern UI**: Tailwind-based sidebar + top bar + dashboard

## Quick start

Install dependencies:

```bash
npm install
```

Run in development (Electron + Vite):

```bash
npm run dev
```

Build renderer (and prep main) for production runs:

```bash
npm run build
```

Run production mode:

```bash
npm run start
```

## Folder structure

```text
.
├─ scripts/
│  └─ build-main.cjs
├─ src/
│  ├─ main/               # Electron main process
│  │  ├─ ipc/             # IPC handlers (secure privileged operations)
│  │  │  ├─ ai.js
│  │  │  ├─ env.js
│  │  │  ├─ index.js
│  │  │  └─ storage.js
│  │  ├─ main.js          # BrowserWindow + lifecycle
│  │  ├─ preload.js       # contextBridge API: window.aura
│  │  └─ security.js      # security defaults
│  ├─ renderer/           # React UI (Vite root)
│  │  ├─ components/
│  │  │  └─ layout/
│  │  │     ├─ AppLayout.jsx
│  │  │     ├─ SidebarNav.jsx
│  │  │     └─ TopBar.jsx
│  │  ├─ lib/
│  │  │  ├─ ai/aiClient.js
│  │  │  └─ storage/secureStorage.js
│  │  ├─ pages/
│  │  │  ├─ ArchivesPage.jsx
│  │  │  ├─ DashboardPage.jsx
│  │  │  └─ SettingsPage.jsx
│  │  ├─ styles/tailwind.css
│  │  ├─ App.jsx
│  │  ├─ index.html
│  │  └─ main.jsx
│  └─ shared/
│     └─ ipcChannels.js   # channel constants
├─ dist/                  # build output (generated)
├─ postcss.config.cjs
├─ tailwind.config.cjs
├─ vite.renderer.config.mts
└─ package.json
```
