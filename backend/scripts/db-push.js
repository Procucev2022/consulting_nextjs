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
const logDir = path.join(backendRoot, '.wrangler', 'logs');
const spawnOptions = {
  cwd: backendRoot,
  stdio: 'inherit',
  shell: false,
  encoding: 'utf8', // FIX: return strings, not Buffers (an empty Buffer is truthy and hid the error)
  maxBuffer: 64 * 1024 * 1024,
  env: {
    ...process.env,
    CI: process.env.CI || '1',
    WRANGLER_LOG_PATH: logDir
  }
};

const runNpx = (args, stdio = 'inherit') => {
  const options = { ...spawnOptions, stdio };
  const [, ...wranglerArgs] = args;
  return spawnSync(process.execPath, [wranglerEntrypoint, ...wranglerArgs], options);
};

// Reads the newest Wrangler log file so failures are never silent.
const readLatestWranglerLog = () => {
  try {
    const files = fs
      .readdirSync(logDir)
      .filter((f) => f.endsWith('.log'))
      .map((f) => ({ f, t: fs.statSync(path.join(logDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    if (!files.length) return '';
    const content = fs.readFileSync(path.join(logDir, files[0].f), 'utf8');
    return content.split('\n').slice(-40).join('\n').trim();
  } catch {
    return '';
  }
};

const buildFailureDetails = (result) => {
  const parts = [
    result.stderr && String(result.stderr).trim(),
    result.stdout && String(result.stdout).trim(),
    result.error && result.error.message,
    result.signal && `terminated by signal ${result.signal}`,
    result.status != null && `exit code ${result.status}`
  ].filter(Boolean);
  let details = parts.join('\n');
  const log = readLatestWranglerLog();
  if (log) details += `\n--- last wrangler log lines ---\n${log}`;
  return details.trim();
};

const executeSqlFile = (fileName) => {
  const filePath = path.resolve(backendRoot, fileName);
  if (!fs.existsSync(filePath)) throw new Error(`D1 SQL file not found: ${filePath}`);
  const args = ['wrangler', 'd1', 'execute', databaseName, `--file=${filePath}`, `--config=${path.join(backendRoot, 'wrangler.jsonc')}`, '--env', environmentName];
  if (isRemote) args.push('--remote');
  else args.push('--local', `--persist-to=${path.join(backendRoot, '.wrangler', 'state')}`);
  const result = runNpx(args);
  if (result.status !== 0) throw new Error(`Wrangler D1 execution failed for ${fileName}`);
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
      const details = buildFailureDetails(result);
      const preview = String(sql).replace(/\s+/g, ' ').slice(0, 300);
      throw new Error(
        `Wrangler D1 command failed for ${databaseName} (env=${environmentName}, remote=${isRemote})` +
        `${details ? `:\n${details}` : ''}\nSQL: ${preview}`
      );
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

// Fail fast with a clear message if CI credentials are missing for remote runs.
if (isRemote && process.env.CI && (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)) {
  process.stderr.write(
    'Warning: CLOUDFLARE_API_TOKEN and/or CLOUDFLARE_ACCOUNT_ID is not set. ' +
    'Remote D1 commands will fail in CI without them.\n'
  );
}

try {
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
} catch (error) {
  process.stderr.write(`\n${error.message}\n`);
  process.exit(1);
}