const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { splitSeedParts, verifySeedManifest } = require('./d1-seed-tools');

const backendRoot = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(backendRoot, '.env') });
const environmentName = process.env.D1_ENV || 'dev';
const databaseName = process.env.D1_DATABASE_NAME || (environmentName === 'dev' ? 'consulting_dev' : 'consulting-db');
const isRemote = process.argv.includes('--remote');
const shouldSeed = process.argv.includes('--seed');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const seedPartLimitBytes = 900000;
const spawnOptions = { cwd: backendRoot, stdio: 'inherit', shell: false, env: { ...process.env, CI: process.env.CI || '1' } };

const runNpx = (args) => {
  if (process.platform !== 'win32') return spawnSync(npxCommand, args, spawnOptions);
  const quote = (value) => value.includes(' ') ? `"${value.replaceAll('"', '\\"')}"` : value;
  const commandLine = [npxCommand, ...args].map(quote).join(' ');
  return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', commandLine], spawnOptions);
};

const executeSqlFile = (fileName) => {
  const filePath = path.resolve(backendRoot, fileName);
  if (!fs.existsSync(filePath)) throw new Error(`D1 SQL file not found: ${filePath}`);
  const args = ['wrangler', 'd1', 'execute', databaseName, `--file=${filePath}`, `--config=${path.join(backendRoot, 'wrangler.jsonc')}`, '--env', environmentName];
  if (isRemote) args.push('--remote');
  else args.push('--local');
  const result = runNpx(args);
  if (result.status !== 0) throw new Error(`Wrangler D1 execution failed for ${fileName}`);
};

const executeGeneratedSeedInParts = (fileName) => {
  const seedPath = path.resolve(backendRoot, fileName);
  const parts = splitSeedParts(fs.readFileSync(seedPath, 'utf8'), seedPartLimitBytes);
  const partFiles = [];
  try {
    for (const [index, part] of parts.entries()) {
      const partName = `d1-reference-seed.part-${String(index + 1).padStart(4, '0')}.sql`;
      fs.writeFileSync(path.join(backendRoot, partName), part, 'utf8');
      partFiles.push(partName);
    }
    for (const partFile of partFiles) executeSqlFile(partFile);
  } finally {
    if (process.env.KEEP_D1_PARTS !== 'true') {
      for (const partFile of partFiles) fs.rmSync(path.join(backendRoot, partFile), { force: true });
    }
  }
};

// Validate the durable migration before making any database changes. Runtime
// sources and workbooks are deliberately unnecessary for deployment or seeding.
const seedManifest = shouldSeed ? verifySeedManifest(backendRoot) : null;
executeSqlFile('d1-schema.sql');
executeSqlFile('d1-reference-schema.sql');
if (shouldSeed) {
  for (const fileName of seedManifest.seedFiles) {
    if (fileName === 'd1-seed.sql') executeSqlFile(fileName);
    else executeGeneratedSeedInParts(fileName);
  }
}
