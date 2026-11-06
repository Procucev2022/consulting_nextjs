import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { TENANT_REFERENCE_TABLES } = require('../../scripts/d1-drift-tools');
const schemaPath = fileURLToPath(new URL('../../d1-schema.sql', import.meta.url));

describe('D1 tenant integrity triggers', () => {
  it('enforces tenant existence on inserts and tenant changes for every tenant-scoped table', () => {
    const schema = readFileSync(schemaPath, 'utf8');
    const tenantTriggers = [...schema.matchAll(/CREATE TRIGGER IF NOT EXISTS trg_tenant_integrity_[\s\S]*?\nEND;/gu)]
      .map(([sql]) => sql);
    const masterTriggers = [...schema.matchAll(/CREATE TRIGGER IF NOT EXISTS trg_tenant_master_[\s\S]*?\nEND;/gu)]
      .map(([sql]) => sql);
    const tablesWithoutTenantForeignKeys = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([\s\S]*?)\n\);/gu)]
      .filter(([, tableName, body]) => tableName !== 'TenantMaster' && /^\s*tenant_id\s+/imu.test(body) && !(
        /FOREIGN KEY\s*\(\s*tenant_id\s*\)\s*REFERENCES\s+TenantMaster/iu.test(body) ||
        /^\s*tenant_id\s+[^,\n]*\bREFERENCES\s+TenantMaster/imu.test(body)
      ))
      .map(([, tableName]) => tableName)
      .sort();
    const db = new DatabaseSync(':memory:');

    try {
      db.exec('CREATE TABLE TenantMaster (tenant_id TEXT PRIMARY KEY NOT NULL);');
      for (const tableName of TENANT_REFERENCE_TABLES) {
        db.exec(`CREATE TABLE ${tableName} (tenant_id TEXT NOT NULL);`);
      }
      db.exec(tenantTriggers.join('\n'));
      db.exec(masterTriggers.join('\n'));
      db.prepare('INSERT INTO TenantMaster (tenant_id) VALUES (?)').run('tenant-valid');

      expect(tenantTriggers).toHaveLength(TENANT_REFERENCE_TABLES.length * 2);
      expect(masterTriggers).toHaveLength(2);
      expect([...TENANT_REFERENCE_TABLES].sort()).toEqual(tablesWithoutTenantForeignKeys);
      for (const tableName of TENANT_REFERENCE_TABLES) {
        db.prepare(`INSERT INTO ${tableName} (tenant_id) VALUES (?)`).run('tenant-valid');
        expect(() => db.prepare(`INSERT INTO ${tableName} (tenant_id) VALUES (?)`).run('tenant-missing'))
          .toThrow(/TENANT_ID_NOT_FOUND/u);
        expect(() => db.prepare(`UPDATE ${tableName} SET tenant_id = ?`).run('tenant-missing'))
          .toThrow(/TENANT_ID_NOT_FOUND/u);
      }
      expect(() => db.prepare('UPDATE TenantMaster SET tenant_id = ?').run('tenant-renamed'))
        .toThrow(/TENANT_ID_IMMUTABLE/u);
      expect(() => db.prepare('DELETE FROM TenantMaster').run())
        .toThrow(/TENANT_MASTER_SOFT_DELETE_ONLY/u);
    } finally {
      db.close();
    }
  });
});
