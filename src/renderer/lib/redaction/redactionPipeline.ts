import template from '../../redaction_pipeline_template.json';

export interface RedactionResult {
  redacted: string;
  redaction_summary: string[];
  safe: boolean;
}

export function executeRedaction(input: string): RedactionResult {
  let redacted = input;
  const summary = new Set<string>();
  let safe = true;

  try {
    const stages = template.pipeline.stages;
    let patterns: Record<string, string> = {};
    let replacementTemplate = '[REDACTED_{TYPE}]';

    // Move patterns extraction outside the switch-case so it persists correctly
    const detectStage = stages.find(s => s.name === 'detect_sensitive');
    if (detectStage && 'patterns' in detectStage && detectStage.patterns) {
      patterns = detectStage.patterns as Record<string, string>;
    }

    // Iterate through the pipeline stages defined in the JSON
    for (const stage of stages) {
      switch (stage.name) {
        case 'detect_sensitive':
          // Extract the regex patterns
          if ('patterns' in stage && stage.patterns) {
            patterns = stage.patterns as Record<string, string>;
          }
          break;

        case 'redact_sensitive':
          // Extract the replacement template
          if ('replacement_template' in stage && stage.replacement_template) {
            replacementTemplate = stage.replacement_template as string;
          }

          // Apply each pattern to the input text
          for (const [type, regexStr] of Object.entries(patterns)) {
            // JS RegExp doesn't support inline flags like (?i) natively
            let cleanRegexStr = regexStr.replace('(?i)', '');
            const flags = 'gi'; // Global case-insensitive flag
            
            const regex = new RegExp(cleanRegexStr, flags);

            // If we find a match, add to summary and replace
            if (regex.test(redacted)) {
              summary.add(type);

              // Reset regex lastIndex because .test() advances it for global regexes
              regex.lastIndex = 0;

              // Format the replacement string (e.g., "[REDACTED_EMAIL]")
              const replacement = replacementTemplate.replace('{TYPE}', type);
              redacted = redacted.replace(regex, replacement);
            }
          }
          break;

        case 'summarize_redaction':
          // The summary is already aggregated in the Set during the redact stage
          break;

        case 'export_safe_payload':
          // Handled by the return statement formatting below
          break;
      }
    }
  } catch (error) {
    console.error('Redaction pipeline execution failed:', error);
    safe = false;
  }

  // Return the expected JSON output format
  return {
    redacted,
    redaction_summary: Array.from(summary),
    safe,
  };
}
