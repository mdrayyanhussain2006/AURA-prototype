/**
 * AURA IPC Payload Schemas — Zod-based validation for all incoming IPC payloads.
 *
 * Every ipcMain.handle() that accepts user-supplied data MUST validate it
 * through one of these schemas before processing. This is the "Strict Input
 * Validation" gate referenced in the AURA architecture diagram.
 */

const { z } = require('zod');

// ─── Vault Schemas ───────────────────────────────────────────────

const VaultSaveItemSchema = z.object({
  id: z.union([z.string().min(1), z.null()]).optional(),
  payload: z.object({
    title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
    content: z.string().max(50000, 'Content exceeds maximum length'),
    type: z.string().max(50).optional().default('note')
  })
});

const VaultGetItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required')
});

const VaultDeleteItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required')
});

// ─── Consent Schemas ─────────────────────────────────────────────

const ConsentUpdateSchema = z.object({
  id: z.string().optional(),
  app: z.string().min(1, 'App name is required').optional(),
  scope: z.string().optional(),
  purpose: z.string().optional(),
  granted: z.boolean({ required_error: 'granted flag is required' }),
  riskLevel: z.enum(['safe', 'moderate', 'high']).optional(),
  expiresAt: z.string().optional(),
  createdAt: z.string().optional()
}).refine(
  (data) => data.app || data.scope || data.id,
  { message: 'At least one of app, scope, or id must be provided' }
);

// ─── Settings Schemas ────────────────────────────────────────────

const SettingsUpdateSchema = z.object({
  autoLockMinutes: z.number().int().min(1).max(1440).optional(),
  theme: z.enum(['dark', 'light', 'system']).optional(),
  redactionEnabled: z.boolean().optional(),
  developerMode: z.boolean().optional()
}).passthrough(); // Allow unknown keys for forward compatibility

// ─── Marketplace Schemas ─────────────────────────────────────────

const MarketplaceGetItemDetailsSchema = z.object({
  id: z.string().min(1, 'Item ID is required')
});

// ─── Insights Schemas ────────────────────────────────────────────

const InsightsGetActivitySchema = z.object({
  limit: z.number().int().min(1).max(50).optional().default(10)
});

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Validates an IPC payload against a Zod schema.
 * Returns { ok: true, data } on success, { ok: false, error } on failure.
 */
function validatePayload(schema, payload, handlerName) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    console.warn(`[IPC:${handlerName}] Validation failed:`, issues);
    return { ok: false, error: `Validation failed: ${issues}` };
  }
  return { ok: true, data: result.data };
}

module.exports = {
  VaultSaveItemSchema,
  VaultGetItemSchema,
  VaultDeleteItemSchema,
  ConsentUpdateSchema,
  SettingsUpdateSchema,
  MarketplaceGetItemDetailsSchema,
  InsightsGetActivitySchema,
  validatePayload
};
