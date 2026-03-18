export function analyzeVault(items = []) {
  const totalItems = Array.isArray(items) ? items.length : 0;
  const emailRegex = /\S+@\S+\.\S+/;
  const longNumberRegex = /\d{6,}/;

  let sensitiveCount = 0;
  let hasEmail = false;
  let hasWeakSecret = false;
  let hasLongNumber = false;
  const hasWarnings = new Set();

  const safeItems = Array.isArray(items) ? items : [];
  for (const item of safeItems) {
    const value = String(item?.value ?? item?.content ?? '');
    const lowerValue = value.toLowerCase();

    const emailDetected = emailRegex.test(value);
    const weakDetected = value.length > 0 && value.length < 6;
    const longNumberDetected = longNumberRegex.test(value);
    const keywordDetected = lowerValue.includes('password') || lowerValue.includes('secret');

    if (emailDetected || weakDetected || longNumberDetected || keywordDetected) {
      sensitiveCount += 1;
    }

    if (emailDetected) {
      hasEmail = true;
      hasWarnings.add('Email data detected');
    }

    if (weakDetected) {
      hasWeakSecret = true;
      hasWarnings.add('Weak secrets found');
    }

    if (longNumberDetected) {
      hasLongNumber = true;
      hasWarnings.add('Long numeric patterns detected');
    }
  }

  let score = 100 - (10 * sensitiveCount);
  if (hasWeakSecret) {
    score -= 5;
  }
  score = Math.max(30, score);

  let insightMessage = 'Vault appears secure and well maintained.';
  if (sensitiveCount > 2) {
    insightMessage = 'High risk: multiple sensitive patterns detected.';
  } else if (hasEmail) {
    insightMessage = 'Email data found. Ensure encryption.';
  } else if (hasWeakSecret) {
    insightMessage = 'Weak secrets detected. Consider stronger values.';
  }

  return {
    totalItems,
    sensitiveCount,
    score,
    warnings: Array.from(hasWarnings),
    insightMessage
  };
}
