const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { parseWranglerJsonOutput } = require('./d1-seed-tools');
const {
  INTERNAL_TABLE_NAMES,
  buildTableCountSql,
  getSchemaTablesSql,
  getSeedLedgerSql,
  getDuplicateTransactionKeysSql,
  getAssessmentDataVersionIntegritySql,
  getUserIntegritySql,
  getOrphanReferenceSql,
  getTenantScopedPrimaryKeySql,
  getTenantIntegrityTriggerSql,
  compareD1Drift
} = require('./d1-drift-tools');

const backendRoot = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(backendRoot, '.env') });
const environmentName = process.env.D1_ENV || 'dev';
const databaseName = process.env.D1_DATABASE_NAME || (environmentName === 'dev' ? 'consulting_dev' : 'consulting-db');
const isRemote = process.argv.includes('--remote');
const spawnOptions = { cwd: backendRoot, stdio: 'pipe', shell: false, env: { ...process.env, CI: process.env.CI || '1' } };

const runNpx = (args) => {
  const wranglerCli = path.join(backendRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  return spawnSync(process.execPath, [wranglerCli, ...args], spawnOptions);
};

const executeQuery = (sql) => {
  const args = [
    'd1', 'execute', databaseName, `--command=${sql}`,
    `--config=${path.join(backendRoot, 'wrangler.jsonc')}`, '--env', environmentName, '--json'
  ];
  args.push(isRemote ? '--remote' : '--local');
  if (!isRemote) args.push(`--persist-to=${path.join(backendRoot, '.wrangler', 'state')}`);
  const result = runNpx(args);
  if (result.status !== 0) {
    const details = String(result.stderr || result.stdout || result.error?.message || '').trim().slice(0, 500);
    throw new Error(`Wrangler D1 drift query failed for ${databaseName}${details ? `: ${details}` : ''}`);
  }
  const rows = parseWranglerJsonOutput(result.stdout);
  const response = JSON.parse(String(result.stdout).trim());
  const readCounts = response.map((entry) => entry.meta?.rows_read);
  return {
    rows,
    rowsRead: readCounts.every((count) => count !== undefined && count !== null && Number.isFinite(Number(count)))
      ? readCounts.reduce((total, count) => total + Number(count), 0)
      : null
  };
};

const runDriftCheck = () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(backendRoot, 'd1-seed-manifest.json'), 'utf8'));
  const expectedTables = Object.keys(manifest.tables || {});
  const schemaResult = executeQuery(getSchemaTablesSql());
  const actualTables = schemaResult.rows.map((row) => row.name);
  const missingTables = new Set(expectedTables.filter((tableName) => !actualTables.includes(tableName)));
  const countableTables = expectedTables.filter((tableName) =>
    !INTERNAL_TABLE_NAMES.has(tableName) && actualTables.includes(tableName)
  );
  const actualCounts = [];
  let rowsRead = schemaResult.rowsRead;
  const addRowsRead = (count) => {
    rowsRead = rowsRead === null || count === null ? null : rowsRead + count;
  };
  const batchSize = 5;
  for (let offset = 0; offset < countableTables.length; offset += batchSize) {
    const query = executeQuery(buildTableCountSql(countableTables.slice(offset, offset + batchSize)));
    actualCounts.push(...query.rows);
    addRowsRead(query.rowsRead);
  }

  const ledgerResult = actualTables.includes('D1SeedFileLedger')
    ? executeQuery(getSeedLedgerSql())
    : { rows: [], rowsRead: 0 };
  addRowsRead(ledgerResult.rowsRead);
  const duplicateResult = executeQuery(getDuplicateTransactionKeysSql());
  addRowsRead(duplicateResult.rowsRead);
  const dataVersionIntegrityResult = executeQuery(getAssessmentDataVersionIntegritySql());
  addRowsRead(dataVersionIntegrityResult.rowsRead);
  const userIntegrityResult = executeQuery(getUserIntegritySql());
  addRowsRead(userIntegrityResult.rowsRead);
  const orphanResult = executeQuery(getOrphanReferenceSql());
  addRowsRead(orphanResult.rowsRead);
  const foreignKeyResult = executeQuery('PRAGMA/**/foreign_key_check');
  addRowsRead(foreignKeyResult.rowsRead);
  const tenantPrimaryKeyResult = executeQuery(getTenantScopedPrimaryKeySql());
  addRowsRead(tenantPrimaryKeyResult.rowsRead);
  const tenantIntegrityTriggerResult = executeQuery(getTenantIntegrityTriggerSql());
  addRowsRead(tenantIntegrityTriggerResult.rowsRead);

  const report = compareD1Drift({
    expectedTables,
    actualTables,
    expectedCounts: manifest.tables,
    actualCounts,
    expectedSeedChecksums: manifest.files,
    actualSeedLedgerRows: ledgerResult.rows,
    duplicateKeyGroups: duplicateResult.rows[0]?.duplicate_key_groups || 0,
    duplicateAssessmentDataVersionGroups: dataVersionIntegrityResult.rows
      .find((row) => row.check_name === 'duplicate_assessment_data_version_groups')?.violation_count || 0,
    assessmentDataVersionIndexValid: Number(dataVersionIntegrityResult.rows
      .find((row) => row.check_name === 'assessment_data_version_index_invalid')?.violation_count) === 0,
    duplicateUserEmailGroups: userIntegrityResult.rows
      .find((row) => row.check_name === 'duplicate_user_email_groups')?.violation_count || 0,
    normalizedUserEmailIndexValid: Number(userIntegrityResult.rows
      .find((row) => row.check_name === 'normalized_user_email_index_invalid')?.violation_count) === 0,
    orphanCounts: Object.fromEntries(orphanResult.rows.map((row) => [row.check_name, row.violation_count])),
    foreignKeyViolations: foreignKeyResult.rows.length,
    tenantPrimaryKeyRows: tenantPrimaryKeyResult.rows,
    tenantIntegrityTriggerNames: tenantIntegrityTriggerResult.rows.map((row) => row.trigger_name)
  });
  return { ...report, database: databaseName, environment: environmentName, scannedRows: rowsRead };
};

try {
  const report = runDriftCheck();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`D1 drift check failed: ${message}\n`);
  process.exitCode = 1;
}
