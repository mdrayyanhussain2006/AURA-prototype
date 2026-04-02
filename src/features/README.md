# Feature modules

Each feature under `src/features/` follows the same layout:

- **`<Feature>.jsx`** — React component (UI).
- **`use<Feature>.js`** — Dedicated hook (state + IPC calls).
- **`<feature>Ipc.js`** — IPC service (renderer-side only; invokes `window.aura.<feature>`).

Main process handlers live in `src/main/ipc/` (e.g. `auth.js`, `vault.js`). Channel names are defined in `src/shared/ipcChannels.cjs`. Shared app constants are in `src/shared/constants.js` and used by both main and renderer.

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
