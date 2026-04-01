/**
 * AURA Redaction Privacy Gate — Production Middleware
 *
 * Server-side PII scrubbing that runs in the Trusted Main Process.
 * All raw content MUST pass through quickRedact() before entering
 * the Encryption Layer. This ensures the "Protected Data Pipeline"
 * is enforced even if the renderer-side redaction is bypassed.
 */

const fs = require('node:fs');
const path = require('node:path');

let pipelinePatterns = null;

/**
 * Lazily loads redaction patterns from the pipeline template.
 * Cached after first load for performance.
 */
function loadPatterns() {
  if (pipelinePatterns) return pipelinePatterns;

  try {
    // Resolve from project root — works in both dev and production
    const templatePath = path.join(__dirname, '..', '..', 'renderer', 'redaction_pipeline_template.json');
    const raw = fs.readFileSync(templatePath, 'utf8');
    const template = JSON.parse(raw);
    const detectStage = template.pipeline?.stages?.find((s) => s.name === 'detect_sensitive');

    if (detectStage && detectStage.patterns) {
      pipelinePatterns = detectStage.patterns;
    } else {
      console.warn('[RedactionGate] No detect_sensitive stage found in template; using fallback patterns.');
      pipelinePatterns = getFallbackPatterns();
    }
  } catch (err) {
    console.warn('[RedactionGate] Could not load template:', err.message, '— using fallback patterns.');
    pipelinePatterns = getFallbackPatterns();
  }

  return pipelinePatterns;
}

/**
 * Hardcoded fallback patterns in case the JSON template is unavailable.
 * These match the core PII types AURA commits to redacting.
 */
function getFallbackPatterns() {
  return {
    EMAIL: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
    PHONE: '\\b(?:\\+?\\d{1,3}[- ]?)?\\(?\\d{3}\\)?[- ]?\\d{3}[- ]?\\d{4}\\b',
    KEY: '(?:api[_-]?key|key|secret|token|password)["\']?\\s*[:=]\\s*["\']?([a-zA-Z0-9\\-_]{16,})["\']?'
  };
}

/**
 * Scrubs PII from raw text using the redaction pipeline patterns.
 *
 * @param {*} text — Input text to redact. Non-strings are returned as-is.
 * @returns {{ redacted: string, redactionSummary: string[], safe: boolean }}
 */
function quickRedact(text) {
  // Guard: non-string or empty input
  if (text === null || text === undefined) {
    return { redacted: '', redactionSummary: [], safe: true };
  }

  const input = String(text);
  if (!input.trim()) {
    return { redacted: input, redactionSummary: [], safe: true };
  }

  const patterns = loadPatterns();
  let redacted = input;
  const summary = [];

  for (const [type, regexStr] of Object.entries(patterns)) {
    try {
      // JS RegExp doesn't support inline (?i) — strip it and use 'gi' flags
      const cleanStr = regexStr.replace('(?i)', '');
      const regex = new RegExp(cleanStr, 'gi');

      if (regex.test(redacted)) {
        summary.push(type);
        // Reset lastIndex since .test() advances it for global regexes
        regex.lastIndex = 0;
        redacted = redacted.replace(regex, `[REDACTED_${type}]`);
      }
    } catch (regexErr) {
      console.error(`[RedactionGate] Regex error for pattern "${type}":`, regexErr.message);
      // Continue with other patterns — don't let one bad regex break the gate
    }
  }

  return { redacted, redactionSummary: summary, safe: true };
}

module.exports = { quickRedact, loadPatterns };
