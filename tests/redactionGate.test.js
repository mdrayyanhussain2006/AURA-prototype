/**
 * Redaction Gate Test Suite
 *
 * Validates that the AURA PII scrubbing pipeline correctly identifies
 * and redacts sensitive data before it reaches the encryption layer.
 *
 * These tests use the fallback patterns directly (same as the service)
 * to avoid a dependency on the filesystem for pipeline template loading.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the fs module so loadPatterns uses fallback patterns
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockRejectedValue(new Error('File not found')),
  access: vi.fn().mockRejectedValue(new Error('File not found'))
}));

// Import after mocking
const { quickRedact } = await import('../src/main/services/redactionGate.js');

describe('redactionGate — quickRedact', () => {
  it('should redact email addresses', async () => {
    const input = 'Contact me at john.doe@example.com for details.';
    const result = await quickRedact(input);

    expect(result.redacted).not.toContain('john.doe@example.com');
    expect(result.redacted).toContain('[REDACTED_EMAIL]');
    expect(result.redactionSummary).toContain('EMAIL');
    expect(result.safe).toBe(true);
  });

  it('should redact phone numbers', async () => {
    const input = 'Call me at (555) 123-4567 or +1-800-555-0199.';
    const result = await quickRedact(input);

    expect(result.redacted).not.toContain('(555) 123-4567');
    expect(result.redacted).toContain('[REDACTED_PHONE]');
    expect(result.redactionSummary).toContain('PHONE');
    expect(result.safe).toBe(true);
  });

  it('should redact API keys and secrets', async () => {
    const input = 'api_key = "sk_live_1234567890abcdef1234"';
    const result = await quickRedact(input);

    expect(result.redacted).not.toContain('sk_live_1234567890abcdef1234');
    expect(result.redacted).toContain('[REDACTED_KEY]');
    expect(result.redactionSummary).toContain('KEY');
    expect(result.safe).toBe(true);
  });

  it('should return clean input unchanged with empty summary', async () => {
    const input = 'This is a perfectly safe note with no PII.';
    const result = await quickRedact(input);

    expect(result.redacted).toBe(input);
    expect(result.redactionSummary).toEqual([]);
    expect(result.safe).toBe(true);
  });

  it('should handle null input gracefully', async () => {
    const result = await quickRedact(null);

    expect(result.redacted).toBe('');
    expect(result.redactionSummary).toEqual([]);
    expect(result.safe).toBe(true);
  });

  it('should handle undefined input gracefully', async () => {
    const result = await quickRedact(undefined);

    expect(result.redacted).toBe('');
    expect(result.redactionSummary).toEqual([]);
    expect(result.safe).toBe(true);
  });

  it('should handle empty string input', async () => {
    const result = await quickRedact('');

    expect(result.redacted).toBe('');
    expect(result.redactionSummary).toEqual([]);
    expect(result.safe).toBe(true);
  });

  it('should redact multiple PII types in one pass', async () => {
    const input = 'Send to user@test.org, call (555) 999-1234, token=abcdef1234567890abcd';
    const result = await quickRedact(input);

    expect(result.redactionSummary).toContain('EMAIL');
    expect(result.redactionSummary).toContain('PHONE');
    expect(result.safe).toBe(true);
  });
});
