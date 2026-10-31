import fs from 'fs';
import path from 'path';

const COVERAGE_THRESHOLD = 90;
const COVERAGE_METRICS = [
  { key: 'statements', label: 'Statements' },
  { key: 'branches', label: 'Branches' },
  { key: 'functions', label: 'Functions' },
  { key: 'lines', label: 'Lines' }
];

export function parseJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    return null;
  }
  return null;
}

function percentage(value) {
  return Number.isFinite(value) ? `${Number(value.toFixed(2))}%` : 'N/A';
}

function getTestMetrics(results = {}) {
  const hasResults = Number.isFinite(results.numTotalTests) && results.numTotalTests > 0;
  const fileResults = Array.isArray(results.testResults) ? results.testResults : [];
  const runtimeFromFiles = fileResults.reduce((sum, file) => {
    const runtime = Number(file?.perfStats?.runtime);
    return sum + (Number.isFinite(runtime) ? runtime : 0);
  }, 0);
  const elapsedFromFiles = fileResults.reduce((maximum, file) => {
    const endTime = Number(file?.endTime);
    const startTime = Number(file?.startTime);
    if (Number.isFinite(endTime) && Number.isFinite(startTime)) {
      return Math.max(maximum, endTime - startTime);
    }
    return maximum;
  }, 0);
  const reportStart = Number(results.startTime);
  const reportEnd = fileResults.reduce((maximum, file) => {
    const endTime = Number(file?.endTime);
    return Number.isFinite(endTime) ? Math.max(maximum, endTime) : maximum;
  }, 0);
  const elapsedFromReport = Number.isFinite(reportStart) && reportEnd > reportStart
    ? reportEnd - reportStart
    : 0;
  const runtime = runtimeFromFiles || elapsedFromReport || elapsedFromFiles;
  const failures = fileResults.flatMap((file) => {
    const assertions = Array.isArray(file?.assertionResults) ? file.assertionResults : [];
    return assertions
      .filter((assertion) => assertion?.status === 'failed')
      .map((assertion) => ({
        file: file.name || 'Unknown test file',
        title: assertion.fullName || assertion.title || 'Failed test',
        message: Array.isArray(assertion.failureMessages)
          ? assertion.failureMessages.join(' ').replace(/\s+/g, ' ').slice(0, 400)
          : ''
      }));
  });

  return {
    hasResults,
    suites: Number(results.numPassedTestSuites) || 0,
    totalSuites: Number(results.numTotalTestSuites) || 0,
    total: Number(results.numTotalTests) || 0,
    passed: Number(results.numPassedTests) || 0,
    failed: Number(results.numFailedTests) || 0,
    runtime,
    failures
  };
}

function collectFileCoverage(coverage, project) {
  if (!coverage || typeof coverage !== 'object') return [];
  return Object.entries(coverage)
    .filter(([fileName, metrics]) => fileName !== 'total' && metrics && typeof metrics === 'object')
    .map(([fileName, metrics]) => ({ project, fileName, metrics }));
}

function getPerFileCoverage(files) {
  const minimums = Object.fromEntries(COVERAGE_METRICS.map(({ key }) => [key, null]));
  const violations = [];

  for (const file of files) {
    const missed = [];
    for (const { key, label } of COVERAGE_METRICS) {
      const pct = file.metrics[key]?.pct;
      if (Number.isFinite(pct)) {
        minimums[key] = minimums[key] === null ? pct : Math.min(minimums[key], pct);
      }
      if (!Number.isFinite(pct) || pct < COVERAGE_THRESHOLD) {
        missed.push(`${label} ${Number.isFinite(pct) ? percentage(pct) : 'N/A'}`);
      }
    }
    if (missed.length) violations.push({ ...file, missed });
  }

  return { minimums, violations, fileCount: files.length, passed: files.length > 0 && violations.length === 0 };
}

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 'Not available';
  const seconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainderSeconds}s` : `${remainderSeconds}s`;
}

function formatTestValue(metrics, key) {
  return metrics.hasResults ? metrics[key] : 'Not reported';
}

function escapeInline(value) {
  return String(value).replace(/`/g, "'").replace(/\|/g, '\\|');
}

export function generateSummaryReport(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const backendResults = parseJsonFile(path.join(rootDir, 'backend', 'test-results.json')) || {};
  const frontendResults = parseJsonFile(path.join(rootDir, 'frontend', 'test-results.json')) || {};
  const backendCoverage = parseJsonFile(path.join(rootDir, 'backend', 'coverage', 'coverage-summary.json')) || {};
  const frontendCoverage = parseJsonFile(path.join(rootDir, 'frontend', 'coverage', 'coverage-summary.json')) || {};
  const backend = getTestMetrics(backendResults);
  const frontend = getTestMetrics(frontendResults);

  const backendCoverageTotal = backendCoverage.total || {};
  const frontendCoverageTotal = frontendCoverage.total || {};
  const coverageMetrics = Object.fromEntries(COVERAGE_METRICS.map(({ key }) => {
    const backendMetric = backendCoverageTotal[key] || {};
    const frontendMetric = frontendCoverageTotal[key] || {};
    const totalItems = (Number(backendMetric.total) || 0) + (Number(frontendMetric.total) || 0);
    const coveredItems = (Number(backendMetric.covered) || 0) + (Number(frontendMetric.covered) || 0);
    const overallPct = totalItems > 0 ? Number(((coveredItems / totalItems) * 100).toFixed(2)) : 0;
    return [key, { backend: Number(backendMetric.pct) || 0, frontend: Number(frontendMetric.pct) || 0, overall: overallPct }];
  }));

  const perFile = getPerFileCoverage([
    ...collectFileCoverage(backendCoverage, 'Backend'),
    ...collectFileCoverage(frontendCoverage, 'Frontend')
  ]);
  const benchmarkSatisfied = COVERAGE_METRICS.every(({ key }) => coverageMetrics[key].overall >= COVERAGE_THRESHOLD)
    && perFile.passed;

  const totalTests = backend.total + frontend.total;
  const totalPassed = backend.passed + frontend.passed;
  const totalFailed = backend.failed + frontend.failed;
  const allTestsReported = backend.hasResults && frontend.hasResults;
  const allTestsPassed = allTestsReported && totalFailed === 0;

  const backendGateResult = options.backendGateResult ?? process.env.BACKEND_GATE_RESULT;
  const frontendGateResult = options.frontendGateResult ?? process.env.FRONTEND_GATE_RESULT;
  const gateResultsProvided = Boolean(backendGateResult || frontendGateResult);
  const qualityGatesPassed = gateResultsProvided
    ? backendGateResult === 'success' && frontendGateResult === 'success'
    : true;
  const qualityGateSummary = gateResultsProvided
    ? qualityGatesPassed ? 'Passed' : 'Failed or incomplete'
    : 'Not reported';
  const reportPassed = allTestsPassed && benchmarkSatisfied && qualityGatesPassed;
  const statusBadge = reportPassed
    ? '✅ **PASSED — ALL QUALITY CRITERIA MET**'
    : '❌ **FAILED — QUALITY GATES NOT SATISFIED**';

  const runtimeTotal = backend.runtime + frontend.runtime;
  const failedTests = [
    ...backend.failures.map((failure) => ({ project: 'Backend', ...failure })),
    ...frontend.failures.map((failure) => ({ project: 'Frontend', ...failure }))
  ].slice(0, 10);
  const failedTestTable = failedTests.length
    ? `\n### Failed test details\n${failedTests.map((failure) => `- **${failure.project}** \`${escapeInline(failure.file)}\` — ${escapeInline(failure.title)}${failure.message ? `: ${escapeInline(failure.message)}` : ''}`).join('\n')}\n`
    : '';
  const perFileLines = COVERAGE_METRICS.map(({ key, label }) => `| ${label} | ${percentage(perFile.minimums[key])} |`).join('\n');
  const violationsMarkdown = perFile.violations.length
    ? perFile.violations.slice(0, 20).map((file) => `- **${file.project}** \`${escapeInline(file.fileName)}\`: ${file.missed.join(', ')}`).join('\n')
    : '- None';
  const gateStatusMarkdown = gateResultsProvided
    ? `| Backend quality job | ${backendGateResult || 'not reported'} |\n| Frontend quality job | ${frontendGateResult || 'not reported'} |`
    : '| Workflow job results | Not available outside GitHub Actions |';

  const markdown = `## 📊 Pull Request Quality & Unit Test Summary

${statusBadge}

### 🧪 Unit Tests Execution Overview
| Metric | Backend (Node.js) | Frontend (Next.js) | Total Combined |
| :--- | :---: | :---: | :---: |
| **Test Suites** | ${backend.hasResults ? `${backend.suites} / ${backend.totalSuites} passed` : 'Not reported'} | ${frontend.hasResults ? `${frontend.suites} / ${frontend.totalSuites} passed` : 'Not reported'} | **${allTestsReported ? `${backend.suites + frontend.suites} / ${backend.totalSuites + frontend.totalSuites} passed` : 'Not reported'}** |
| **Total Tests** | ${formatTestValue(backend, 'total')} | ${formatTestValue(frontend, 'total')} | **${allTestsReported ? totalTests : 'Not reported'}** |
| **Passed Tests** | ${formatTestValue(backend, 'passed')} | ${formatTestValue(frontend, 'passed')} | **${allTestsReported ? totalPassed : 'Not reported'}** |
| **Failed Tests** | ${formatTestValue(backend, 'failed')} | ${formatTestValue(frontend, 'failed')} | **${allTestsReported ? totalFailed : 'Not reported'}** |
| **Execution Duration** | ${formatDuration(backend.runtime)} | ${formatDuration(frontend.runtime)} | **${formatDuration(runtimeTotal)}** |
| **Quality Job Result** | ${backendGateResult || 'Not reported'} | ${frontendGateResult || 'Not reported'} | **${qualityGateSummary}** |

${failedTestTable}
### 📈 Code Coverage Metrics
| Parameter | Backend Coverage | Frontend Coverage | Overall Monorepo | Threshold |
| :--- | :---: | :---: | :---: | :---: |
| **Statements** | ${percentage(coverageMetrics.statements.backend)} | ${percentage(coverageMetrics.statements.frontend)} | **${percentage(coverageMetrics.statements.overall)}** | >= ${COVERAGE_THRESHOLD}% |
| **Branches** | ${percentage(coverageMetrics.branches.backend)} | ${percentage(coverageMetrics.branches.frontend)} | **${percentage(coverageMetrics.branches.overall)}** | >= ${COVERAGE_THRESHOLD}% |
| **Functions** | ${percentage(coverageMetrics.functions.backend)} | ${percentage(coverageMetrics.functions.frontend)} | **${percentage(coverageMetrics.functions.overall)}** | >= ${COVERAGE_THRESHOLD}% |
| **Lines** | ${percentage(coverageMetrics.lines.backend)} | ${percentage(coverageMetrics.lines.frontend)} | **${percentage(coverageMetrics.lines.overall)}** | >= ${COVERAGE_THRESHOLD}% |

### Per-file Coverage (strict 90% for every metric)
Files analyzed: **${perFile.fileCount}**; files below threshold: **${perFile.violations.length}**.

| Metric | Minimum per-file coverage |
| :--- | :---: |
${perFileLines}

Files below threshold:
${violationsMarkdown}

### Quality Gate Results
| Gate | Result |
| :--- | :--- |
${gateStatusMarkdown}

*Generated on ${new Date().toISOString()} by the PR quality workflow.*
`;

  return {
    markdown,
    totalTests,
    totalPassed,
    totalFailed,
    allTestsPassed,
    benchmarkSatisfied,
    perFileCoveragePassed: perFile.passed,
    perFileCount: perFile.fileCount,
    perFileViolations: perFile.violations,
    allQualityGatesPassed: qualityGatesPassed,
    overallStmts: coverageMetrics.statements.overall,
    overallBranch: coverageMetrics.branches.overall,
    overallFuncs: coverageMetrics.functions.overall,
    overallLines: coverageMetrics.lines.overall,
    durationMs: runtimeTotal
  };
}

/* v8 ignore start */
if (process.argv[1] && process.argv[1].endsWith('generate-pr-summary.mjs')) {
  const result = generateSummaryReport();
  const outputPath = path.resolve(process.cwd(), 'pr-summary.md');
  fs.writeFileSync(outputPath, result.markdown, 'utf8');
  process.stdout.write(`PR summary written to ${outputPath}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${result.markdown}\n`, 'utf8');
    process.stdout.write('PR summary appended to GITHUB_STEP_SUMMARY\n');
  }
}
/* v8 ignore stop */
