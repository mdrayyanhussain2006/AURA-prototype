const { contextBridge, ipcRenderer } = require('electron');
import Channels from '../shared/ipcChannels.js';

const ALLOWED_CHANNELS = new Set(Object.values(Channels));

const safeInvoke = async (channel, payload) => {
  if (typeof channel !== 'string' || !ALLOWED_CHANNELS.has(channel)) {
    return { ok: false, error: 'Unauthorized IPC channel' };
  }
  return ipcRenderer.invoke(channel, payload);
};

contextBridge.exposeInMainWorld('aura', {
  vault: {
    listItems: () => safeInvoke(Channels.VAULT_LIST_ITEMS),
    saveItem: (p) => safeInvoke(Channels.VAULT_SAVE_ITEM, p)
  },
  demo: {
    ping: () => safeInvoke(Channels.DEMO_PING)
  },
  consent: {
    getAll: () => safeInvoke(Channels.CONSENT_GET_ALL),
    update: (p) => safeInvoke(Channels.CONSENT_UPDATE, p)
  },
  insights: {
    getSummary: () => safeInvoke(Channels.INSIGHTS_GET_SUMMARY)
  },
  security: {
    getStatus: () => safeInvoke(Channels.SECURITY_GET_STATUS)
  }
});

