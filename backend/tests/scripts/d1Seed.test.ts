import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { D1SeedManifest, D1SeedUpload } from '../../src/types/d1Seed';
import type { D1SchemaTableRow } from '../../src/types/d1';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import { loadCanonicalAssessmentFromD1 } from '../../src/services/workerD1Canonical';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
const { splitSqlStatements, splitSeedParts, verifySeedManifest } = require('../../scripts/d1-seed-tools');
const backendRoot = path.resolve(__dirname, '../..');

describe('durable D1 migration', () => {
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

  it('imports every dataset from SQL alone and preserves live changes when rerun', () => {
    const manifest = verifySeedManifest(backendRoot) as D1SeedManifest;
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(fs.readFileSync(path.join(backendRoot, 'd1-schema.sql'), 'utf8'));
      database.exec(fs.readFileSync(path.join(backendRoot, 'd1-reference-schema.sql'), 'utf8'));
      const baseline = fs.readFileSync(path.join(backendRoot, 'd1-seed.sql'), 'utf8');
      const reference = fs.readFileSync(path.join(backendRoot, 'd1-reference-seed.sql'), 'utf8');
      const categoryMappings = fs.readFileSync(path.join(backendRoot, 'd1-category-mapping-seed.sql'), 'utf8');
      const referenceSeeds = [reference, categoryMappings];
      expect(referenceSeeds.join('\n')).not.toMatch(/\b(?:BEGIN TRANSACTION|COMMIT);/u);
      expect([baseline, ...referenceSeeds].join('\n')).not.toContain('INSERT OR REPLACE');
      database.exec(baseline);
      for (const seed of referenceSeeds) {
        const parts = splitSeedParts(seed, 900000);
        for (const part of parts) {
          expect(Buffer.byteLength(part, 'utf8')).toBeLessThanOrEqual(900000);
          database.exec(part);
        }
      }
      for (const [table, count] of Object.entries(manifest.tables)) {
        const omittedPopulations: Record<string, number> = {
          ProcurementTransaction: manifest.uploads.reduce((total, upload) => total + upload.rowCount, 0),
          AssessmentStoreEntry: manifest.uploads.filter((upload) => upload.canonicalSnapshotId).length,
          PCBIBenchmarkMaster: manifest.pcbiHistoricalRecovery.masterCount,
          PCBIHistoricalObservation: manifest.pcbiHistoricalRecovery.observationCount
        };
        const expected = count - (omittedPopulations[table] || 0);
        expect(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count, table).toBe(expected);
      }
      expect(manifest.tables.ProcurementTransaction).toBe(95416);
      expect(manifest.tables.UNSPSCCommodity).toBe(1033);
      expect(manifest.tables.PCBIWeeklyReference).toBe(3960);
      expect(manifest.tables.AssessmentStoreEntry).toBe(39);
      expect(manifest.tables.ProcurementCategoryMapping).toBe(262);
      expect(database.prepare('SELECT category_name FROM ProcurementCategoryMapping WHERE material_group_code = ?').get('P06').category_name).toBe('Packing');
      expect(database.prepare('SELECT category_name FROM ProcurementCategoryMapping WHERE material_group_code = ?').get('G31').category_name).toBe('HARDWARES');
      expect(database.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction WHERE assessment_id IS NULL').get().count).toBe(31671);
      expect(database.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction WHERE assessment_id = ?').get('AIC-2026-0001').count).toBe(0);
      const snapshots = database.prepare('SELECT assessment_id, payload_json FROM AssessmentStoreEntry WHERE entry_type = ?').all('assessment');
      for (const row of snapshots) {
        const snapshot = JSON.parse(row.payload_json);
        expect(snapshot.assessmentId).toBe(row.assessment_id);
        const activeRun = database.prepare('SELECT payload_json FROM AssessmentStoreEntry WHERE entry_type = ? AND assessment_id = ? AND entry_id = ?').get('run', row.assessment_id, snapshot.activeAnalysisRunId);
        expect(JSON.parse(activeRun.payload_json).assessmentId).toBe(row.assessment_id);
      }
      // The original store scopes repeated RUN-001 identifiers to each assessment.
      expect(database.prepare('SELECT COUNT(*) AS count FROM AssessmentStoreEntry WHERE entry_type = ? AND entry_id = ?').get('run', 'RUN-001').count).toBe(3);
      database.prepare('UPDATE User SET name = ? WHERE id = ?').run('Live account name', 'usr-admin-001');
      database.prepare('UPDATE MaterialMappingRegister SET payload_json = ? WHERE source_material_id = ?').run('{"reviewStatus":"CLIENT_APPROVED"}', 'MAT-REV-01');
      const [unchangedLegacy, modifiedLegacy] = database.prepare('SELECT transaction_id FROM ProcurementTransaction ORDER BY transaction_id LIMIT 2').all();
      database.prepare('UPDATE ProcurementTransaction SET assessment_id = ? WHERE transaction_id = ?').run('AIC-2026-0001', unchangedLegacy.transaction_id);
      database.prepare('UPDATE ProcurementTransaction SET assessment_id = ?, raw_json = ? WHERE transaction_id = ?').run('AIC-2026-0001', '{"modifiedByUser":true}', modifiedLegacy.transaction_id);
      database.exec(baseline);
      for (const seed of referenceSeeds) database.exec(seed);
      expect(database.prepare('SELECT name FROM User WHERE id = ?').get('usr-admin-001').name).toBe('Live account name');
      expect(database.prepare('SELECT payload_json FROM MaterialMappingRegister WHERE source_material_id = ?').get('MAT-REV-01').payload_json).toBe('{"reviewStatus":"CLIENT_APPROVED"}');
      expect(database.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction').get().count).toBe(31671);
      expect(database.prepare('SELECT assessment_id FROM ProcurementTransaction WHERE transaction_id = ?').get(unchangedLegacy.transaction_id).assessment_id).toBeNull();
      expect(database.prepare('SELECT assessment_id, raw_json FROM ProcurementTransaction WHERE transaction_id = ?').get(modifiedLegacy.transaction_id)).toMatchObject({
        assessment_id: 'AIC-2026-0001', raw_json: '{"modifiedByUser":true}'
      });
    } finally {
      database.close();
    }
  });

  const uploadManifest = JSON.parse(fs.readFileSync(path.join(backendRoot, 'd1-seed-manifest.json'), 'utf8')) as D1SeedManifest;
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

  it.each(uploadManifest.uploads)('imports all uploaded source rows for $assessmentId without a workbook', (upload: D1SeedUpload) => {
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(fs.readFileSync(path.join(backendRoot, 'd1-reference-schema.sql'), 'utf8'));
      const source = fs.readFileSync(path.join(backendRoot, upload.seedFile), 'utf8');
      for (const part of splitSeedParts(source, 900000)) database.exec(part);
      const actual = database.prepare('SELECT COUNT(*) AS count, SUM(total_inr_raw) AS total FROM ProcurementTransaction WHERE assessment_id = ?').get(upload.assessmentId);
      expect(actual.count).toBe(upload.rowCount);
      expect(actual.total).toBeCloseTo(upload.sumInr, 2);
      const row = database.prepare('SELECT raw_json FROM ProcurementTransaction LIMIT 1').get();
      const raw = JSON.parse(row.raw_json);
      expect(raw.sourceRaw).toBeDefined();
      expect(raw.sourceChecksum).toBe(upload.sourceChecksum);
      expect(database.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction WHERE assessment_id <> ?').get(upload.assessmentId).count).toBe(0);
      if (upload.canonicalSnapshotId) {
        const canonical = JSON.parse(database.prepare("SELECT payload_json FROM AssessmentStoreEntry WHERE entry_type = 'canonical_module1' AND assessment_id = ? AND entry_id = ?").get(upload.assessmentId, upload.canonicalSnapshotId).payload_json);
        expect(canonical.assessmentId).toBe(upload.assessmentId);
        expect(canonical.sourceRowCount).toBe(upload.rowCount);
        expect(canonical.validRowCount).toBe(upload.validRowCount);
        expect(canonical.excludedRowCount).toBe(upload.excludedRowCount);
        expect(canonical.anomalyRowCount).toBe(upload.anomalyRowCount);
        expect(canonical.validFxNormalizedSpendInr).toBeCloseTo(upload.normalizedSpendInr as number, 2);
        expect(canonical.migrationProvenance.certifiedEvidenceSha256).toBe(upload.certifiedEvidenceChecksum);
        const validated = database.prepare("SELECT COUNT(*) AS count, SUM(json_extract(raw_json, '$.lineSpendInr')) AS total FROM ProcurementTransaction WHERE json_extract(raw_json, '$.inclusionStatus') = 'VALID'").get();
        expect(validated.count).toBe(upload.validRowCount);
        expect(validated.total).toBeCloseTo(upload.normalizedSpendInr as number, 2);
        expect(database.prepare('SELECT COUNT(*) AS count FROM D1SeedPayloadChunk').get().count).toBe(0);
        database.exec(source);
        expect(database.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction').get().count).toBe(upload.rowCount);
        expect(database.prepare("SELECT COUNT(*) AS count FROM AssessmentStoreEntry WHERE entry_type = 'canonical_module1'").get().count).toBe(1);
      }
    } finally {
      database.close();
    }
  });
});
