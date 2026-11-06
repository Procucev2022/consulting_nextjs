const fs = require('node:fs');
const path = require('node:path');

const CONFIG_PATH = path.resolve(__dirname, '..', 'wrangler.jsonc');

const readExpectedProductionBinding = (config) => {
  const bindings = config?.env?.prod?.d1_databases;
  if (!Array.isArray(bindings)) throw new Error('Production D1 binding is missing from Wrangler configuration.');

  const binding = bindings.find((candidate) => candidate?.binding === 'DB');
  if (!binding || typeof binding.database_id !== 'string' || !binding.database_id.trim()
    || typeof binding.database_name !== 'string' || !binding.database_name.trim()) {
    throw new Error('Production DB binding must include a database name and ID.');
  }
  return { id: binding.database_id, name: binding.database_name };
};

const verifyProductionD1Binding = (config, databases) => {
  const expected = readExpectedProductionBinding(config);
  if (!Array.isArray(databases)) throw new Error('Cloudflare D1 inventory is not a JSON array.');

  const exists = databases.some((database) =>
    database?.uuid === expected.id && database?.name === expected.name);
  if (!exists) {
    throw new Error(`Configured production D1 (${expected.name} / ${expected.id}) is not present in the authenticated Cloudflare account.`);
  }
  return expected;
};

if (require.main === module) {
  try {
    const inventoryPath = process.argv[2];
    if (!inventoryPath) throw new Error('Pass the JSON output path from wrangler d1 list --json.');
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const databases = JSON.parse(fs.readFileSync(path.resolve(inventoryPath), 'utf8'));
    const binding = verifyProductionD1Binding(config, databases);
    process.stdout.write(`Verified production D1 binding ${binding.name} (${binding.id}) in the authenticated Cloudflare account.\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`::error::${message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { readExpectedProductionBinding, verifyProductionD1Binding };
