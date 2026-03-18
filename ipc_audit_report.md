# IPC Audit Report

## Missing channels
- `STORAGE_SAVE_SECURE_ITEM` referenced in `src/main/ipc/storage.js` but not defined in `src/shared/ipcChannels.js`.
- `STORAGE_GET_SECURE_ITEM` referenced in `src/main/ipc/storage.js` but not defined in `src/shared/ipcChannels.js`.
- `AI_RUN_ARCHIVE_ASSISTANT` referenced in `src/main/ipc/ai.js` but not defined in `src/shared/ipcChannels.js`.
- `ENV_GET_APP_NAME` referenced in `src/main/ipc/env.js` but not defined in `src/shared/ipcChannels.js`.
- `ENV_GET_PLATFORM` referenced in `src/main/ipc/env.js` but not defined in `src/shared/ipcChannels.js`.
- `AUTH_GET_SESSION` referenced in `src/main/ipc/auth.js` but not defined in `src/shared/ipcChannels.js`.
- `AUTH_LOGIN` referenced in `src/main/ipc/auth.js` but not defined in `src/shared/ipcChannels.js`.
- `AUTH_LOGOUT` referenced in `src/main/ipc/auth.js` but not defined in `src/shared/ipcChannels.js`.
- `INSIGHTS_GET_SUMMARY` referenced in `src/main/ipc/insights.js` but not defined in `src/shared/ipcChannels.js`.
- `INSIGHTS_GET_ACTIVITY` referenced in `src/main/ipc/insights.js` but not defined in `src/shared/ipcChannels.js`.
- `MARKETPLACE_LIST_ITEMS` referenced in `src/main/ipc/marketplace.js` but not defined in `src/shared/ipcChannels.js`.
- `MARKETPLACE_GET_ITEM_DETAILS` referenced in `src/main/ipc/marketplace.js` but not defined in `src/shared/ipcChannels.js`.
- `SECURITY_GET_STATUS` referenced in `src/main/ipc/security.js` but not defined in `src/shared/ipcChannels.js`.
- `SECURITY_GET_POLICIES` referenced in `src/main/ipc/security.js` but not defined in `src/shared/ipcChannels.js`.
- `DEMO_GET_INFO` referenced in `src/main/ipc/demo.js` but not defined in `src/shared/ipcChannels.js`.
- Channel name mismatches: none detected for the canonical channels currently defined.

## Broken bridges
- `src/renderer/lib/storage/secureStorage.js` calls `window.aura.storage.*`, but `storage` is no longer exposed in `src/main/preload.js`.
- `src/renderer/lib/ai/aiClient.js` calls `window.aura.ai.*`, but `ai` is no longer exposed in `src/main/preload.js`.
- `src/features/auth/authIpc.js` calls `window.aura.auth.*`, but `auth` is no longer exposed in `src/main/preload.js`.
- `src/features/insights/insightsIpc.js` calls `window.aura.insights.*`, but `insights` is no longer exposed in `src/main/preload.js`.
- `src/features/marketplace/marketplaceIpc.js` calls `window.aura.marketplace.*`, but `marketplace` is no longer exposed in `src/main/preload.js`.
- `src/features/security/securityIpc.js` calls `window.aura.security.*`, but `security` is no longer exposed in `src/main/preload.js`.
- `src/features/demo/demoIpc.js` calls `window.aura.demo.getInfo`, but `getInfo` is no longer exposed in `src/main/preload.js`.
- `src/renderer/components/layout/TopBar.jsx` calls `window.aura.env.getPlatform`, but `env` is no longer exposed in `src/main/preload.js`.
- Preload path: `src/main/security.js` points to `preload.js` in the same directory; no misconfiguration detected.

## Fix recommendations
- Decide whether the canonical contract should stay minimal. If the app should keep `storage`, `ai`, `env`, `auth`, `insights`, `marketplace`, `security`, or `demo.getInfo`, add those channels back to `src/shared/ipcChannels.js` and re-expose them in `src/main/preload.js`.
- If the minimal contract is intentional, remove or refactor renderer callers to stop using APIs that are no longer exposed, and remove or guard main-process handlers that register channels not in the contract to avoid `ipcMain.handle(undefined, ...)` at startup.
- Keep `src/shared/ipcChannels.js` as the single source of truth and ensure both main and preload import from it to avoid future channel drift.
