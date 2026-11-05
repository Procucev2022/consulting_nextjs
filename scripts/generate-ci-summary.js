#!/usr/bin/env node

/**
 * CI Summary Report Generator bridge for PR quality check workflow
 */
async function main() {
  const { generateSummaryReport } = await import('./generate-pr-summary.mjs');
  const result = generateSummaryReport();
  if (!result.markdown) throw new Error('The PR quality summary generator returned an empty report.');
  process.stdout.write(result.markdown);
}

main().catch((error) => {
  const details = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`[ci-summary] Failed to generate the PR quality report: ${details}\n`);
  process.exitCode = 1;
});
