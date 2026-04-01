/**
 * AURA Redaction Test Script
 *
 * Validates the production redactionGate module with sample inputs.
 * Usage: node scripts/test-redact.js
 */

const { quickRedact } = require('../src/main/services/redactionGate');

console.log('🔒 AURA Redaction Gate — Test Suite\n');

// Test 1: Email + API key detection
const test1 = quickRedact('Contact me at test@example.com with key: secret1234567890');
console.log('Test 1 — Email + Key:');
console.log(JSON.stringify(test1, null, 2));
console.log('');

// Test 2: Clean text (no PII)
const test2 = quickRedact('This is a perfectly clean note about project architecture.');
console.log('Test 2 — Clean text:');
console.log(JSON.stringify(test2, null, 2));
console.log('');

// Test 3: Phone number
const test3 = quickRedact('Call me at (555) 123-4567 for the meeting.');
console.log('Test 3 — Phone:');
console.log(JSON.stringify(test3, null, 2));
console.log('');

// Test 4: Null / undefined / empty
console.log('Test 4 — Edge cases:');
console.log('  null:', JSON.stringify(quickRedact(null)));
console.log('  undefined:', JSON.stringify(quickRedact(undefined)));
console.log('  empty:', JSON.stringify(quickRedact('')));
console.log('  number:', JSON.stringify(quickRedact(42)));
console.log('');

// Test 5: Multiple PII types
const test5 = quickRedact('User admin@company.org has password=SuperSecret123456 and phone +1-800-555-1234');
console.log('Test 5 — Multiple PII:');
console.log(JSON.stringify(test5, null, 2));
console.log('');

// Summary
const allSafe = [test1, test2, test3, test5].every((r) => r.safe);
console.log(allSafe ? '✅ All tests passed — redaction gate is functional.' : '❌ Some tests failed!');
