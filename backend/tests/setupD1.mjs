import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
const { splitSeedParts, verifySeedManifest } = require('../scripts/d1-seed-tools.js');
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Every suite receives an isolated, reproducible D1 fixture. A developer's
// Wrangler database is never the unit-test database, including on fresh clones.
export default function setupD1(project) {
  const databasePath = project.config.env.D1_LOCAL_SQLITE_PATH;
  const manifest = verifySeedManifest(backendRoot);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  try {
    database.exec('BEGIN');
    for (const file of ['d1-schema.sql', 'd1-reference-schema.sql']) {
      database.exec(fs.readFileSync(path.join(backendRoot, file), 'utf8'));
    }
    for (const file of manifest.seedFiles) {
      const source = fs.readFileSync(path.join(backendRoot, file), 'utf8');
      for (const part of splitSeedParts(source, 900000)) database.exec(part);
    }
    database.exec('COMMIT');
  } finally {
    database.close();
  }
  return () => { fs.rmSync(databasePath, { force: true }); };
}
