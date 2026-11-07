import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { D1SeedManifest } from '../../src/types/d1Seed';
import { D1_DEMO_TENANT_ID } from '../../src/constants/d1';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
const {
  splitSqlStatements,
  splitSeedParts,
  verifySeedManifest,
  shouldSeedDatabase,
  getSeedFileLedgerReadSql,
  getSeedFileLedgerWriteSql,
  getWranglerSqlInputArgs,
  parseWranglerJsonOutput,
  isSeedFileApplied
} = require('../../scripts/d1-seed-tools');
const backendRoot = path.resolve(__dirname, '../..');

describe('durable D1 migration', () => {
  it('seeds base rows for either the seed or seed-all CLI flag', () => {
    expect(shouldSeedDatabase(['node', 'db-push.js'])).toBe(false);
    expect(shouldSeedDatabase(['node', 'db-push.js', '--seed'])).toBe(true);
    expect(shouldSeedDatabase(['node', 'db-push.js', '--seed-all'])).toBe(true);
  });

  it('uses the complete manifest seed for the documented seed commands and selects the dev Worker locally', () => {
    const backendPackage = JSON.parse(fs.readFileSync(path.join(backendRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(backendPackage.scripts['cloudflare:dev']).toContain('--env dev');
    expect(backendPackage.scripts['cloudflare:dev']).toContain('--persist-to .wrangler/state');
    expect(backendPackage.scripts['db:seed:d1']).toContain('--seed-all');
    expect(backendPackage.scripts['db:seed:d1:remote']).toContain('--seed-all');
    expect(backendPackage.scripts['db:seed:d1:remote']).toContain('--remote');
    expect(backendPackage.scripts['db:seed:d1:base']).toContain('--seed');
    expect(backendPackage.scripts['db:seed:d1:base']).not.toContain('--seed-all');
    expect(backendPackage.scripts['db:drift']).toContain('d1-drift-check.js');
    expect(backendPackage.scripts['db:drift:remote']).toContain('--remote');
  });

  it('keeps one canonical D1 schema source and avoids an extra reference-schema deployment call', () => {
    const referenceSchema = fs.readFileSync(path.join(backendRoot, 'd1-reference-schema.sql'), 'utf8');
    const migrationScript = fs.readFileSync(path.join(backendRoot, 'scripts/db-push.js'), 'utf8');

    expect(splitSqlStatements(referenceSchema)).toEqual([]);
    expect(migrationScript).toContain("executeSqlFile('d1-schema.sql');");
    expect(migrationScript).not.toContain("executeSqlFile('d1-reference-schema.sql');");
    expect(migrationScript).toContain("executeGeneratedSeedInParts('d1-seed.sql', seedManifest.files['d1-seed.sql']);");
    expect(migrationScript).not.toContain("executeSqlFile('d1-seed.sql');");
  });

  it('splits SQL without changing quoted customer text or comments', () => {
    const sql = "BEGIN TRANSACTION;\nINSERT INTO x VALUES ('customer;\n\nvalue ''quoted''', \"a;b\", `a;b`); -- comment;\n/* block; */ SELECT 2; COMMIT;";
    expect(splitSqlStatements(sql)).toEqual([
      "INSERT INTO x VALUES ('customer;\n\nvalue ''quoted''', \"a;b\", `a;b`);",
      '-- comment;\n/* block; */ SELECT 2;'
    ]);
    expect(splitSqlStatements('-- only a comment')).toEqual([]);
    expect(splitSqlStatements('BEGIN; COMMIT;')).toEqual([]);
    expect(() => splitSqlStatements("SELECT 'unfinished")).toThrow(/unterminated/);
    expect(() => splitSqlStatements('/* unfinished')).toThrow(/unterminated/);
    expect(() => splitSqlStatements('SELECT 1')).toThrow(/terminating semicolon/);
  });

  it('keeps import parts within the UTF-8 byte limit without SQL transaction wrappers', () => {
    expect(splitSeedParts("SELECT '₹'; SELECT 2;", 15)).toEqual(["SELECT '₹';\n\n", 'SELECT 2;\n\n']);
    expect(splitSeedParts('', 20)).toEqual([]);
    expect(splitSeedParts('SELECT 1; SELECT 2;', 50)).toEqual(['SELECT 1;\n\nSELECT 2;\n\n']);
    expect(() => splitSeedParts('SELECT 1;', 0)).toThrow(/positive integer/);
    expect(() => splitSeedParts('SELECT 1;', 5)).toThrow(/exceeds/);
  });

  it('uses a checksum ledger to skip completed seed files and safely reapply changed checksums', () => {
    expect(getSeedFileLedgerReadSql("fixture's-seed.sql")).toBe(
      "SELECT/**/source_checksum/**/FROM/**/D1SeedFileLedger/**/WHERE/**/seed_file='fixture''s-seed.sql';"
    );
    expect(getSeedFileLedgerReadSql('fixture.sql')).not.toMatch(/\s/u);
    expect(getSeedFileLedgerWriteSql('fixture.sql', 'abc123')).toContain(
      "ON CONFLICT(seed_file) DO UPDATE SET source_checksum = excluded.source_checksum"
    );
    expect(isSeedFileApplied([{ source_checksum: 'abc123' }], 'abc123')).toBe(true);
    expect(isSeedFileApplied([{ source_checksum: 'older' }], 'abc123')).toBe(false);
    expect(isSeedFileApplied([], 'abc123')).toBe(false);
    expect(isSeedFileApplied(null, 'abc123')).toBe(false);

    const output = JSON.stringify([{ success: true, results: [{ source_checksum: 'abc123' }] }]);
    const rows = parseWranglerJsonOutput(output);
    expect(rows).toEqual([{ source_checksum: 'abc123' }]);
    expect(parseWranglerJsonOutput(
      'Wrangler progress output\r\n🌀 Executed 1 query\r\n' + output
    )).toEqual([{ source_checksum: 'abc123' }]);
    expect(isSeedFileApplied(rows, 'abc123')).toBe(true);
    expect(parseWranglerJsonOutput('[{"success":true,"results":[]}]')).toEqual([]);
    expect(parseWranglerJsonOutput('[]')).toEqual([]);
    expect(getWranglerSqlInputArgs('SELECT name FROM sqlite_master;', 'query.sql', true)).toEqual([
      '--command', 'SELECT name FROM sqlite_master;'
    ]);
    expect(getWranglerSqlInputArgs('ALTER TABLE x ADD COLUMN y TEXT;', 'migration.sql', false)).toEqual([
      '--file=migration.sql'
    ]);
    expect(() => parseWranglerJsonOutput('not-json')).toThrow(/valid JSON/);
    expect(() => parseWranglerJsonOutput('{}')).toThrow(/invalid result set/);
    expect(() => parseWranglerJsonOutput('[{"success":false,"results":[]}]')).toThrow(/unsuccessful/);
    expect(() => parseWranglerJsonOutput('[{"success":true}]')).toThrow(/unsuccessful/);
  });

  it('records seed file checksums in a dedicated D1 table without mixing them into application entries', () => {
    const manifest = verifySeedManifest(backendRoot) as D1SeedManifest;
    expect(manifest.tables.D1SeedFileLedger).toBe(0);
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(fs.readFileSync(path.join(backendRoot, 'd1-schema.sql'), 'utf8'));
      const initial = database.prepare(getSeedFileLedgerReadSql('d1-reference-seed.sql')).all();
      expect(initial).toEqual([]);

      const appliedSql = getSeedFileLedgerWriteSql('d1-reference-seed.sql', 'seed-checksum-1');
      database.exec(appliedSql);
      const appliedRows = database.prepare(getSeedFileLedgerReadSql('d1-reference-seed.sql')).all();
      expect(isSeedFileApplied(appliedRows, 'seed-checksum-1')).toBe(true);

      database.exec(getSeedFileLedgerWriteSql('d1-reference-seed.sql', 'seed-checksum-2'));
      const changedRows = database.prepare(getSeedFileLedgerReadSql('d1-reference-seed.sql')).all();
      expect(isSeedFileApplied(changedRows, 'seed-checksum-1')).toBe(false);
      expect(isSeedFileApplied(changedRows, 'seed-checksum-2')).toBe(true);
      expect(database.prepare('SELECT COUNT(*) AS count FROM AssessmentStoreEntry').get().count).toBe(0);
    } finally {
      database.close();
    }
  });

  it('rejects modified migration content and invalid manifest paths before seeding', () => {
    const read = vi.spyOn(fs, 'readFileSync');
    read.mockReturnValueOnce(JSON.stringify({ seedFiles: ['seed.sql'], files: { 'seed.sql': 'wrong-hash' } }));
    read.mockReturnValueOnce('SELECT 1;');
    expect(() => verifySeedManifest(backendRoot)).toThrow(/checksum mismatch/);
    read.mockReturnValueOnce(JSON.stringify({ seedFiles: ['../outside.sql'], files: { '../outside.sql': 'anything' } }));
    expect(() => verifySeedManifest(backendRoot)).toThrow(/invalid file path/);
    read.mockReturnValueOnce(JSON.stringify({ files: {} }));
    expect(() => verifySeedManifest(backendRoot)).toThrow(/canonical seed files/);
    read.mockReturnValueOnce(JSON.stringify({ seedFiles: ['missing.sql'], files: {} }));
    expect(() => verifySeedManifest(backendRoot)).toThrow(/invalid file path/);
    read.mockRestore();
  });

  it('replays representative seed statements without overwriting live changes', () => {
    const seedFiles = ['d1-seed.sql', 'd1-reference-seed.sql', 'd1-category-mapping-seed.sql'];
    const statements = seedFiles.flatMap((file) =>
      splitSqlStatements(fs.readFileSync(path.join(backendRoot, file), 'utf8'))
    );
    const liveSeedStatements = [
      statements.find((statement) => /\bINSERT OR IGNORE INTO TenantMaster\b/iu.test(statement)),
      statements.find((statement) => /\bINSERT INTO User\b/iu.test(statement)),
      statements.find((statement) => /\bINSERT OR IGNORE INTO MaterialMappingRegister\b/iu.test(statement)),
      statements.find((statement) => /\bINSERT INTO ProcurementTransaction\b/iu.test(statement))
    ];
    expect(liveSeedStatements.every((statement) => statement !== undefined)).toBe(true);

    const database = new DatabaseSync(':memory:');
    try {
      database.exec(fs.readFileSync(path.join(backendRoot, 'd1-schema.sql'), 'utf8'));
      database.exec(fs.readFileSync(path.join(backendRoot, 'd1-reference-schema.sql'), 'utf8'));
      database.exec('BEGIN');
      for (const statement of liveSeedStatements) database.exec(statement as string);
      database.exec('COMMIT');
      const seededTransactionCount = database.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction').get().count;

      database.prepare('UPDATE User SET name = ? WHERE id = ?').run('Live account name', 'usr-admin-001');
      database.prepare('UPDATE MaterialMappingRegister SET payload_json = ? WHERE source_material_id = ?')
        .run('{"reviewStatus":"CLIENT_APPROVED"}', 'MAT-REV-01');
      const [unchangedLegacy, modifiedLegacy] = database.prepare(
        'SELECT transaction_id FROM ProcurementTransaction ORDER BY transaction_id LIMIT 2'
      ).all();
      database.prepare('UPDATE ProcurementTransaction SET assessment_id = ? WHERE transaction_id = ?')
        .run('AIC-2026-0001', unchangedLegacy.transaction_id);
      database.prepare('UPDATE ProcurementTransaction SET assessment_id = ?, raw_json = ? WHERE transaction_id = ?')
        .run('AIC-2026-0001', '{"modifiedByUser":true}', modifiedLegacy.transaction_id);

      database.exec('BEGIN');
      for (const statement of liveSeedStatements) database.exec(statement as string);
      database.exec('COMMIT');
      expect(database.prepare('SELECT name FROM User WHERE id = ?').get('usr-admin-001').name).toBe('Live account name');
      expect(database.prepare('SELECT payload_json FROM MaterialMappingRegister WHERE source_material_id = ?')
        .get('MAT-REV-01').payload_json).toBe('{"reviewStatus":"CLIENT_APPROVED"}');
      expect(database.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction').get().count)
        .toBe(seededTransactionCount);
      expect(database.prepare('SELECT assessment_id FROM ProcurementTransaction WHERE transaction_id = ?')
        .get(unchangedLegacy.transaction_id).assessment_id).toBeNull();
      expect(database.prepare('SELECT assessment_id, raw_json FROM ProcurementTransaction WHERE transaction_id = ?')
        .get(modifiedLegacy.transaction_id)).toMatchObject({
          assessment_id: 'AIC-2026-0001', raw_json: '{"modifiedByUser":true}'
        });
    } finally {
      database.close();
    }
  });

  it('preserves the forensic PCBI source metadata and monthly prices without activating benchmarks or fabricating weekly indices', () => {
    const manifest = verifySeedManifest(backendRoot) as D1SeedManifest;
    const recovery = manifest.pcbiHistoricalRecovery;
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(fs.readFileSync(path.join(backendRoot, 'd1-schema.sql'), 'utf8'));
      const source = fs.readFileSync(path.join(backendRoot, recovery.seedFile), 'utf8');
      database.exec(source);
      database.exec(source);
      const masters = database.prepare('SELECT * FROM PCBIBenchmarkMaster').all();
      expect(masters).toHaveLength(recovery.masterCount);
      for (const row of masters) {
        const preserved = JSON.parse(row.notes);
        expect(row.pcbi_id).toBe(preserved.sourceRecord.pcbiId);
        expect(row.benchmark_name).toBe(preserved.sourceRecord.benchmarkName);
        expect(row.active).toBe(0);
        expect(row.benchmarkability_percent).toBeNull();
        expect(row.residual_percent).toBeNull();
        expect(preserved.recovery.sourceChecksum).toBe(recovery.sourceMasterChecksum);
        expect(preserved.recovery.sourceGitCommit).toBe(recovery.sourceGitCommit);
      }
      const observations = database.prepare('SELECT * FROM PCBIHistoricalObservation').all();
      expect(observations).toHaveLength(recovery.observationCount);
      for (const row of observations) {
        const preserved = JSON.parse(row.payload_json);
        expect(row).toMatchObject({ pcbi_id: preserved.pcbiId, observation_date: preserved.observationDate,
          value_inr: preserved.valueInr, original_value: preserved.originalValue,
          original_currency: preserved.originalCurrency, fx_rate: preserved.fxRate,
          unit: preserved.unit, source: preserved.source, status: preserved.status,
          observation_frequency: 'MONTHLY', source_checksum: recovery.sourceObservationsChecksum });
      }
      expect(database.prepare('SELECT COUNT(*) AS count FROM PCBIWeeklyReference').get().count).toBe(0);
    } finally { database.close(); }
  });

  it('seeds clearly labeled PCBI demo assignments idempotently without overwriting later assignments', () => {
    const manifest = verifySeedManifest(backendRoot) as D1SeedManifest;
    const seedFile = 'd1-pcbi-research-assignment-demo-seed.sql';
    expect(manifest.seedFiles).toContain(seedFile);
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(fs.readFileSync(path.join(backendRoot, 'd1-schema.sql'), 'utf8'));
      database.exec(fs.readFileSync(path.join(backendRoot, 'd1-reference-schema.sql'), 'utf8'));
      const source = fs.readFileSync(path.join(backendRoot, seedFile), 'utf8');
      database.exec(source);
      database.prepare('UPDATE PCBICommodityResearchAssignment SET assigned_to = ? WHERE pcbi_id = ?')
        .run('analyst@example.test', 'PCBI-BRG-COMP-001');
      database.exec(source);

      const rows = database.prepare(
        'SELECT pcbi_id, assigned_to, assigned_by FROM PCBICommodityResearchAssignment ORDER BY pcbi_id'
      ).all() as Array<{ pcbi_id: string; assigned_to: string; assigned_by: string }>;
      expect(rows).toHaveLength(3);
      expect(rows.find((row) => row.pcbi_id === 'PCBI-BRG-COMP-001')).toMatchObject({
        assigned_to: 'analyst@example.test', assigned_by: 'DEMO SEED'
      });
      expect(rows.filter((row) => row.assigned_to.startsWith('DEMO ONLY -'))).toHaveLength(2);
    } finally { database.close(); }
  });

  it('seeds all assessment demo review gates as pending without inventing evidence', () => {
    const manifest = verifySeedManifest(backendRoot) as D1SeedManifest;
    const seedFile = 'd1-assessment-review-gates-demo-seed.sql';
    expect(manifest.seedFiles).toContain(seedFile);
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(fs.readFileSync(path.join(backendRoot, 'd1-schema.sql'), 'utf8'));
      database.prepare('INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?)')
        .run(D1_DEMO_TENANT_ID, 'Demo Enterprise');
      for (const assessmentId of ['AIC-2026-0001', 'AIC-2026-0002', 'AIC-2026-0003']) {
        database.prepare(`INSERT INTO AssessmentRecord (
          assessment_id, customer_id, customer_name, industry, assessment_owner
        ) VALUES (?, ?, ?, ?, ?)`).run(assessmentId, 'C-DEMO', 'Demo Assessment', 'Manufacturing', 'analyst@example.test');
      }
      const source = fs.readFileSync(path.join(backendRoot, seedFile), 'utf8');
      database.exec(source);
      database.exec(source);

      expect(database.prepare('SELECT COUNT(*) AS count FROM AssessmentReviewGate').get().count).toBe(78);
      expect(database.prepare(`SELECT COUNT(*) AS count FROM AssessmentReviewGate
        WHERE status <> 'PENDING' OR evidence_reference IS NOT NULL OR review_note IS NOT NULL`).get().count).toBe(0);
      expect(database.prepare(`SELECT COUNT(*) AS count FROM AssessmentReviewGate
        WHERE assessment_id = ?`).get('AIC-2026-0001').count).toBe(26);
    } finally {
      database.close();
    }
  });

  it('restores the canonical user tenant assignment from the base seed', () => {
    const manifest = verifySeedManifest(backendRoot) as D1SeedManifest;
    expect(manifest.seedFiles).toContain('d1-seed.sql');
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(fs.readFileSync(path.join(backendRoot, 'd1-schema.sql'), 'utf8'));
      const seed = fs.readFileSync(path.join(backendRoot, 'd1-seed.sql'), 'utf8');
      database.exec(seed);
      expect(database.prepare("SELECT tenant_id FROM User WHERE id = 'usr-user-001'").get()).toEqual({
        tenant_id: 'TNT-GLOBAL-8902'
      });
      expect(database.prepare("SELECT tenant_id FROM User WHERE id = 'usr-user-002'").get()).toEqual({
        tenant_id: 'TNT-GLOBAL-8902'
      });
      expect(database.prepare("SELECT tenant_id FROM User WHERE id = 'usr-admin-001'").get()).toEqual({
        tenant_id: 'TNT-GLOBAL-8902'
      });
      expect(database.prepare("SELECT COUNT(*) AS count FROM User WHERE role = 'ADMIN' AND tenant_id = 'TNT-GLOBAL-8902'").get())
        .toEqual({ count: 3 });

      database.prepare("UPDATE User SET status = 'PENDING', tenant_id = NULL WHERE id = 'usr-user-001'").run();
      database.exec(seed);
      expect(database.prepare("SELECT tenant_id FROM User WHERE id = 'usr-user-001'").get()).toEqual({ tenant_id: 'TNT-GLOBAL-8902' });
    } finally {
      database.close();
    }
  });

});
