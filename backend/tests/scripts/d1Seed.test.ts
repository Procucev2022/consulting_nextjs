import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { D1SeedManifest } from '../../src/types/d1Seed';
import type { D1SchemaTableRow } from '../../src/types/d1';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import { loadCanonicalAssessmentFromD1 } from '../../src/services/workerD1Canonical';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
const { splitSqlStatements, splitSeedParts, verifySeedManifest, shouldSeedDatabase } = require('../../scripts/d1-seed-tools');
const backendRoot = path.resolve(__dirname, '../..');

describe('durable D1 migration', () => {
  it('seeds base rows for either the seed or seed-all CLI flag', () => {
    expect(shouldSeedDatabase(['node', 'db-push.js'])).toBe(false);
    expect(shouldSeedDatabase(['node', 'db-push.js', '--seed'])).toBe(true);
    expect(shouldSeedDatabase(['node', 'db-push.js', '--seed-all'])).toBe(true);
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
      statements.find((statement) => /\bINSERT OR IGNORE INTO User\b/iu.test(statement)),
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

  it('restores the complete manifest on a clean database with valid assessment snapshots', async () => {
    const manifest = verifySeedManifest(backendRoot) as D1SeedManifest;
    const database = new DatabaseSync(':memory:');
    const importAllSeeds = (): void => {
      database.exec('BEGIN');
      try {
        for (const file of manifest.seedFiles) {
          const source = fs.readFileSync(path.join(backendRoot, file), 'utf8');
          database.exec(source);
        }
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    };
    try {
      for (const file of ['d1-schema.sql', 'd1-reference-schema.sql']) {
        database.exec(fs.readFileSync(path.join(backendRoot, file), 'utf8'));
      }
      importAllSeeds();
      const schemaTables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as D1SchemaTableRow[];
      expect(schemaTables.map((row) => row.name)).toEqual(Object.keys(manifest.tables).sort());
      for (const [table, expected] of Object.entries(manifest.tables)) {
        expect(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count, table).toBe(expected);
      }
      expect(database.prepare('SELECT COUNT(*) AS count FROM AssessmentStoreEntry WHERE json_valid(payload_json) = 0').get().count).toBe(0);
      expect(database.prepare('SELECT COUNT(*) AS count FROM D1SeedPayloadChunk').get().count).toBe(0);
      for (const upload of manifest.uploads) {
        const stats = database.prepare('SELECT COUNT(*) AS count, SUM(total_inr_raw) AS total FROM ProcurementTransaction WHERE assessment_id = ?').get(upload.assessmentId);
        expect(stats.count).toBe(upload.rowCount);
        expect(stats.total).toBeCloseTo(upload.sumInr, 2);
        const rawRow = database.prepare(
          'SELECT raw_json FROM ProcurementTransaction WHERE assessment_id = ? LIMIT 1'
        ).get(upload.assessmentId);
        const sourceRow = JSON.parse(rawRow.raw_json);
        expect(sourceRow.sourceRaw).toBeDefined();
        expect(sourceRow.sourceChecksum).toBe(upload.sourceChecksum);
      }
      const d1 = { prepare: (sql: string) => ({
        bind: (...values: unknown[]) => ({ all: async () => ({ results: database.prepare(sql).all(...values) }) }),
        all: async () => ({ results: database.prepare(sql).all() })
      }) } as unknown as CloudflareD1Database;
      expect(await loadCanonicalAssessmentFromD1(d1, 'AIC-2026-0001')).toMatchObject({
        assessmentId: 'AIC-2026-0001', dataVersionId: 'DV-001', sourceRowCount: 20505,
        validRowCount: 20241, excludedRowCount: 252, anomalyRowCount: 12,
        validFxNormalizedSpendInr: 40738306838.0198
      });
    } finally {
      database.close();
    }
  });

});
