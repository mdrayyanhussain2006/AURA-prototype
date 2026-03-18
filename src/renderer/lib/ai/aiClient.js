// Renderer-side wrapper over the secure preload AI API.
// Keep provider keys and network calls in main; renderer only sends approved payloads.

export async function runArchiveAssistant(payload) {
  if (!window.aura?.ai?.runArchiveAssistant) {
    return { ok: false, error: 'AI API not available', result: null };
  }
  return window.aura.ai.runArchiveAssistant(payload);
}

