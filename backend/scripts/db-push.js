const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  splitSeedParts,
  verifySeedManifest,
  shouldSeedDatabase,
  getSeedFileLedgerReadSql,
  getSeedFileLedgerWriteSql,
  getWranglerSqlInputArgs,
  parseWranglerJsonOutput,
  isSeedFileApplied
} = require('./d1-seed-tools');
const { applyD1CompatibilityMigrations } = require('./d1-migration-tools');

const backendRoot = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(backendRoot, '.env') });
const environmentName = process.env.D1_ENV || 'dev';
const databaseName = process.env.D1_DATABASE_NAME || (environmentName === 'dev' ? 'consulting_dev' : 'consulting-db');
const isRemote = process.argv.includes('--remote');
const shouldSeedAll = process.argv.includes('--seed-all');
const shouldSeed = shouldSeedDatabase(process.argv);
const wranglerEntrypoint = path.join(backendRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const seedPartLimitBytes = 900000;
const spawnOptions = {
  cwd: backendRoot,
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    CI: process.env.CI || '1',
    WRANGLER_LOG_PATH: path.join(backendRoot, '.wrangler', 'logs')
  }
};

const runNpx = (args, stdio = 'inherit') => {
  const options = { ...spawnOptions, stdio };
  const [, ...wranglerArgs] = args;
  return spawnSync(process.execPath, [wranglerEntrypoint, ...wranglerArgs], options);
};

const executeSqlFile = (fileName) => {
  const filePath = path.resolve(backendRoot, fileName);
  if (!fs.existsSync(filePath)) throw new Error(`D1 SQL file not found: ${filePath}`);
  const args = ['wrangler', 'd1', 'execute', databaseName, `--file=${filePath}`, `--config=${path.join(backendRoot, 'wrangler.jsonc')}`, '--env', environmentName];
  if (isRemote) args.push('--remote');
  else args.push('--local', `--persist-to=${path.join(backendRoot, '.wrangler', 'state')}`);
  const result = runNpx(args, 'pipe');
  if (result.status !== 0) {
    const stderrText = result.stderr ? result.stderr.toString('utf8').trim() : '';
    const stdoutText = result.stdout ? result.stdout.toString('utf8').trim() : '';
    const details = stderrText || stdoutText || result.error?.message || '';
    if (!isRemote && (details.includes('spawn UNKNOWN') || details.includes('UV_HANDLE_CLOSING'))) {
      process.stderr.write(
        `[WARN] Local Cloudflare D1 runtime (workerd) cannot be spawned on this host (${details}). Skipping local D1 push.\n`
      );
      process.exit(0);
    }
    throw new Error(`Wrangler D1 execution failed for ${fileName}`);
  }
};

const executeSqlCommand = (sql, jsonOutput = false) => {
  const commandFilePath = path.join(backendRoot, `d1-command-${crypto.randomUUID()}.sql`);
  if (!jsonOutput) fs.writeFileSync(commandFilePath, sql, 'utf8');
  try {
    const args = ['wrangler', 'd1', 'execute', databaseName];
    args.push(...getWranglerSqlInputArgs(sql, commandFilePath, jsonOutput));
    args.push(`--config=${path.join(backendRoot, 'wrangler.jsonc')}`, '--env', environmentName);
    if (isRemote) args.push('--remote');
    else args.push('--local', `--persist-to=${path.join(backendRoot, '.wrangler', 'state')}`);
    if (jsonOutput) args.push('--json');
    const result = runNpx(args, 'pipe');
    if (!jsonOutput) {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    if (result.status !== 0) {
      const stderrText = result.stderr ? result.stderr.toString('utf8').trim() : '';
      const stdoutText = result.stdout ? result.stdout.toString('utf8').trim() : '';
      let details = stderrText;
      if (!details && stdoutText) {
        try {
          const parsed = JSON.parse(stdoutText);
          details = parsed?.error?.text || parsed?.errors?.[0]?.message || stdoutText;
        } catch {
          details = stdoutText;
        }
      }
      if (!details && result.error?.message) {
        details = String(result.error.message).trim();
      }
      if (stderrText) process.stderr.write(`${stderrText}\n`);
      if (stdoutText && stdoutText !== stderrText) process.stderr.write(`${stdoutText}\n`);
      if (!isRemote && (details.includes('spawn UNKNOWN') || details.includes('UV_HANDLE_CLOSING'))) {
        process.stderr.write(
          `[WARN] Local Cloudflare D1 runtime (workerd) cannot be spawned on this host (${details}). Skipping local D1 push.\n`
        );
        process.exit(0);
      }
      throw new Error(`Wrangler D1 command failed for ${databaseName}${details ? `: ${details}` : ''}`);
    }
    return jsonOutput ? parseWranglerJsonOutput(result.stdout) : [];
  } finally {
    if (!jsonOutput) fs.rmSync(commandFilePath, { force: true });
  }
};

const executeGeneratedSeedInParts = (fileName, checksum) => {
  const existingRows = executeSqlCommand(getSeedFileLedgerReadSql(fileName), true);
  if (isSeedFileApplied(existingRows, checksum)) {
    process.stdout.write(`Skipping ${fileName}; matching seed checksum is already recorded in D1.\n`);
    return;
  }
  const seedPath = path.resolve(backendRoot, fileName);
  const parts = splitSeedParts(fs.readFileSync(seedPath, 'utf8'), seedPartLimitBytes);
  const partFiles = [];
  try {
    for (const [index, part] of parts.entries()) {
      const seedPrefix = path.basename(fileName, path.extname(fileName));
      const partName = `${seedPrefix}.part-${String(index + 1).padStart(4, '0')}.sql`;
      fs.writeFileSync(path.join(backendRoot, partName), part, 'utf8');
      partFiles.push(partName);
    }
    for (const partFile of partFiles) executeSqlFile(partFile);
    executeSqlCommand(getSeedFileLedgerWriteSql(fileName, checksum));
  } finally {
    if (process.env.KEEP_D1_PARTS !== 'true') {
      for (const partFile of partFiles) fs.rmSync(path.join(backendRoot, partFile), { force: true });
    }
  }
};

// Verify the seed manifest before writing, then batch compatibility checks and
// only the missing tenant migrations. Runtime sources and workbooks are not needed.
const seedManifest = shouldSeed ? verifySeedManifest(backendRoot) : null;
const migrationReport = applyD1CompatibilityMigrations(executeSqlCommand);
process.stdout.write(
  `D1 compatibility sync: ${migrationReport.metadataQueries} metadata queries, ` +
  `${migrationReport.writeCommands} write command(s), ${migrationReport.statements} statement(s), ` +
  `${migrationReport.migratedTables} table(s) updated.\n`
);
executeSqlFile('d1-schema.sql');
if (shouldSeed) {
  executeGeneratedSeedInParts('d1-seed.sql', seedManifest.files['d1-seed.sql']);
  if (shouldSeedAll) {
    for (const fileName of seedManifest.seedFiles) {
      if (fileName !== 'd1-seed.sql') executeGeneratedSeedInParts(fileName, seedManifest.files[fileName]);
    }
  }
}
