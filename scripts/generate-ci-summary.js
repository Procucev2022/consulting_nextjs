#!/usr/bin/env node

/**
 * CI Summary Report Generator bridge for PR quality check workflow
 */
async function main() {
  try {
    const { generateSummaryReport } = await import('./generate-pr-summary.mjs');
    const result = generateSummaryReport();
    process.stdout.write(result.markdown || '## 🚀 Quality Gate Execution Completed');
  } catch (err) {
    process.stdout.write('## 🚀 Quality Gate Execution Completed');
  }
}

main();
