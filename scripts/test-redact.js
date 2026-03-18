const template = require('../src/renderer/redaction_pipeline_template.json');
function quickRedact(text) {
  let redacted = text;
  const patterns = template.pipeline.stages[0].patterns;
  Object.entries(patterns).forEach(([type, p]) => {
    const cleanP = p.replace('(?i)', '');
    const regex = new RegExp(cleanP, 'gi');
    redacted = redacted.replace(regex, `[REDACTED_${type}]`);
  });
  return { redacted, safe: true };
}
console.log(JSON.stringify(quickRedact("Contact me at test@example.com with key: secret1234567890"), null, 2));
