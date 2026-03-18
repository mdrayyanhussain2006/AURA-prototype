# AURA Prototype — System Architecture

This document describes the layered system architecture of **AURA (Autonomous User-Regulated Archives)** Desktop Vault prototype — an Electron + React application for local-first, encrypted personal archives with optional AI assistance.

---

## High-Level Overview

AURA follows a **process-isolated, layered architecture**:

- **Renderer process** (UI + client-side logic) runs in a sandboxed Chromium context.
- **Main process** (Electron) owns privileged operations: storage, AI, environment.
- **Preload script** is the only bridge between renderer and main, exposing a minimal `window.aura` API.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RENDERER PROCESS (Sandboxed)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  UI LAYER          │  React, Tailwind, react-router-dom              │   │
│  │  (Pages, Layout, Components)                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LOGIC LAYER (Renderer)  │  lib/ wrappers, state, routing            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼  window.aura (contextBridge only)      │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                           MAIN PROCESS (Node.js)                             │
│  ┌─────────────────────────────────▼───────────────────────────────────┐   │
│  │  SECURITY LAYER     │  security.js, webPreferences, preload          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LOGIC LAYER (Main) │  main.js, IPC registration, lifecycle         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ DATA LAYER   │ │ AI LAYER     │ │ STORAGE      │ │ MARKETPLACE      │   │
│  │ (IPC/env)    │ │ (IPC/ai)     │ │ LAYER (IPC)  │ │ SIMULATION       │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. UI Layer

**Location:** `src/renderer/` — React app entry, pages, layout, and shared components.

**Responsibilities:**

- Render all user-facing screens and components.
- Provide navigation (sidebar, top bar) and routing.
- Consume the `window.aura` API only through the preload bridge (no direct Node/Electron access).

**Key artifacts:**

| Artifact | Purpose |
|----------|--------|
| `main.jsx` | React root, `BrowserRouter`, Tailwind import |
| `App.jsx` | Route definitions: `/`, `/dashboard`, `/archives`, `/settings` |
| `components/layout/AppLayout.jsx` | Shell: sidebar + top bar + main content area |
| `components/layout/SidebarNav.jsx` | Navigation links (Dashboard, Archives, Settings) |
| `components/layout/TopBar.jsx` | Header with vault status and platform (via `aura.env`) |
| `pages/DashboardPage.jsx` | Dashboard: stat cards, vault activity, guardrails |
| `pages/ArchivesPage.jsx` | Archives placeholder (collections, indexes, AI curation) |
| `pages/SettingsPage.jsx` | Settings: encryption and AI policy placeholders |
| `styles/tailwind.css` | Global Tailwind styles and AURA theme tokens |

**Design:** Tailwind-based, dark theme with `aura-*` design tokens. UI is presentational; business logic and privileged calls go through the logic layer and IPC.

---

## 2. Logic Layer

**Split between renderer and main.**

### 2.1 Renderer logic

**Location:** `src/renderer/lib/`.

- **`lib/ai/aiClient.js`** — Wrapper for `window.aura.ai.runArchiveAssistant(payload)`. Used when the UI needs to call the archive assistant; no API keys or network code in the renderer.
- **`lib/storage/secureStorage.js`** — Wrappers for `window.aura.storage.saveSecureItem` and `getSecureItem`. UI uses these instead of calling IPC directly.

Routing and app state live in the React tree (`App.jsx`, `main.jsx`); no global state library in the prototype.

### 2.2 Main process logic

**Location:** `src/main/main.js`, `src/main/ipc/index.js`.

- **`main.js`** — App lifecycle, `createMainWindow`, load dev URL vs built `index.html`, `registerIpcHandlers()` on ready.
- **`ipc/index.js`** — Registers all IPC handlers: env, storage, AI. Single entry point for privileged capabilities.

The logic layer does not implement storage encryption or AI providers; it delegates to the data, storage, and AI layers via IPC handlers.

---

## 3. Data Layer

**Location:** `src/main/ipc/env.js`, `src/shared/ipcChannels.js`; exposed as `window.aura.env` in preload.

**Responsibilities:**

- Provide read-only environment and app metadata to the renderer.
- No user data; only app name and platform for display (e.g. TopBar).

**API (via preload):**

| Method | Channel | Returns |
|--------|---------|--------|
| `aura.env.getAppName()` | `aura:env:getAppName` | `app.getName()` |
| `aura.env.getPlatform()` | `aura:env:getPlatform` | `process.platform` |

**Design:** Data is derived in the main process from Electron `app` and `process`; the renderer cannot access Node or system APIs directly.

---

## 4. Security Layer

**Location:** `src/main/security.js`, `src/main/preload.js`, and BrowserWindow `webPreferences`.

**Responsibilities:**

- Enforce process isolation and a minimal renderer API.
- Ensure no Node integration or arbitrary shell access from the UI.

**Mechanisms:**

| Mechanism | Implementation |
|-----------|----------------|
| **Context isolation** | `webPreferences.contextIsolation: true` — renderer cannot touch Node or preload globals except what is exposed. |
| **No Node in renderer** | `webPreferences.nodeIntegration: false` — no `require('electron')` or `process` in renderer. |
| **Sandbox** | `webPreferences.sandbox: true` — OS-level sandbox for renderer. |
| **Web security** | `webPreferences.webSecurity: true` — standard browser security. |
| **Preload as single bridge** | `preload.js` runs in a privileged context and uses `contextBridge.exposeInMainWorld('aura', { ... })` to expose only `storage`, `ai`, and `env` with fixed method signatures. |
| **External links** | `webContents.setWindowOpenHandler` forces `shell.openExternal(url)` and denies in-app window opening to avoid redirect abuse. |
| **DevTools** | Enabled only when `NODE_ENV === 'development'` via `security.js`. |

**Design:** Principle of least privilege: the renderer can only call the IPC methods exposed under `window.aura`; all privileged work (storage, AI, env) happens in the main process.

---

## 5. AI Layer

**Location:** Main: `src/main/ipc/ai.js`. Renderer: `src/renderer/lib/ai/aiClient.js`. Preload: `aura.ai.runArchiveAssistant`.

**Responsibilities:**

- Expose a single AI capability to the UI: “run archive assistant” with a payload.
- Keep API keys and external AI calls in the main process (or a future local service), never in the renderer.

**Flow:**

1. UI calls `aiClient.runArchiveAssistant(payload)` (or equivalent).
2. `aiClient` calls `window.aura.ai.runArchiveAssistant({ payload })`.
3. Preload forwards to IPC channel `aura:ai:runArchiveAssistant`.
4. Main handler in `ipc/ai.js` receives the payload; currently returns a stub (“Not implemented (AI stub)”).

**Planned:** Implement real AI provider (e.g. LLM API or local model) in main, validate and scope requests, then return results over IPC. All keys and network stay in main.

---

## 6. Storage Layer

**Location:** Main: `src/main/ipc/storage.js`. Renderer: `src/renderer/lib/storage/secureStorage.js`. Preload: `aura.storage.saveSecureItem`, `aura.storage.getSecureItem`.

**Responsibilities:**

- Provide secure, key-value–style persistence for the vault.
- Validate keys and inputs in the main process; renderer only sends key/value via IPC.

**API (via preload):**

| Method | Channel | Behavior (current) |
|--------|---------|--------------------|
| `aura.storage.saveSecureItem(key, value)` | `aura:storage:saveSecureItem` | Validates key; returns stub “Not implemented (encrypted storage stub)”. |
| `aura.storage.getSecureItem(key)` | `aura:storage:getSecureItem` | Validates key; returns stub with `value: null`. |

**Planned (from code comments):** Derive a per-user vault key (passphrase or OS keychain), encrypt at rest (e.g. AES-GCM), store under `app.getPath('userData')` or user-selected vault path, and enforce authentication/authorization on access.

---

## 7. Marketplace Simulation Layer

**Status:** Not yet implemented in the codebase; documented as a **simulation / future** layer for the AURA prototype.

**Intended responsibilities:**

- **Simulate** or later implement a marketplace for AURA-related assets, e.g.:
  - Archive templates or schemas.
  - Lenses / views over archives.
  - Optional AI assistant “plugins” or presets (with strict user consent and local-first constraints).
- Provide discovery, metadata, and (in a full implementation) safe install/update flows without compromising the security or local-first guarantees of the vault.

**Suggested placement:**

- **Main process:** Marketplace service or simulation module that:
  - Fetches or generates catalog metadata (e.g. mock JSON or real signed manifests).
  - Validates and sandboxes any installable content.
  - Exposes only high-level operations via IPC (e.g. “list available items”, “install item by id”).
- **Preload:** Expose a minimal `aura.marketplace` API (e.g. `listItems()`, `getItemDetails(id)`), and optionally `installItem(id)` when implemented.
- **UI:** A dedicated “Marketplace” or “Discover” page that lists items and triggers install/simulate actions via `window.aura.marketplace`.

**Security considerations:** All network and file writes for marketplace content should occur in the main process; renderer only triggers actions and displays metadata. Integrity checks (e.g. signatures, hashes) and user confirmation should be required before installing or enabling any marketplace item.

---

## Cross-Cutting Summary

| Layer | Location | Status |
|-------|----------|--------|
| **UI** | `src/renderer/` (pages, components, layout) | Implemented |
| **Logic** | `src/renderer/lib/`, `src/main/main.js`, `src/main/ipc/index.js` | Implemented |
| **Data** | `src/main/ipc/env.js`, `aura.env` | Implemented |
| **Security** | `src/main/security.js`, `preload.js`, webPreferences | Implemented |
| **AI** | `src/main/ipc/ai.js`, `src/renderer/lib/ai/aiClient.js` | Stub implemented |
| **Storage** | `src/main/ipc/storage.js`, `src/renderer/lib/storage/secureStorage.js` | Stub implemented |
| **Marketplace simulation** | — | Planned / simulation only |

All privileged operations (storage, AI, env) are registered in the main process and invoked by the renderer only through the preload-exposed `window.aura` API, keeping the UI layer safe and the architecture ready for encrypted storage, real AI integration, and a future marketplace layer.
