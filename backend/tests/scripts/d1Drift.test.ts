import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { R2_CLEANUP_SQL } from '../../src/constants/r2Cleanup';

const require = createRequire(import.meta.url);
const {
  INTERNAL_TABLE_NAMES,
  TENANT_REFERENCE_TABLES,
  TENANT_SCOPED_PRIMARY_KEYS,
  TENANT_INTEGRITY_TRIGGER_NAMES,
  compactSql,
  buildTableCountSql,
  buildTenantOrphanSql,
  getSchemaTablesSql,
  getSeedLedgerSql,
  getDuplicateTransactionKeysSql,
  getAssessmentDataVersionIntegritySql,
  getUserIntegritySql,
  R2_CLEANUP_INDEX_DEFINITIONS,
  getR2CleanupIndexIntegritySql,
  getOrphanReferenceSql,
  getTenantScopedPrimaryKeySql,
  getTenantIntegrityTriggerSql,
  compareD1Drift
} = require('../../scripts/d1-drift-tools');

const createTenantPrimaryKeyRows = (overrides: Record<string, string[]> = {}) =>
  Object.entries(TENANT_SCOPED_PRIMARY_KEYS).flatMap(([tableName, expectedColumns]) =>
    (overrides[tableName] || expectedColumns).map((columnName, index) => ({
      table_name: tableName,
      column_name: columnName,
      position: index + 1
    })));
const createValidR2CleanupIndexIntegrityRows = () => Object.keys(R2_CLEANUP_INDEX_DEFINITIONS)
  .map((check_name) => ({ check_name, violation_count: 0 }));

describe('D1 drift diagnostics', () => {
  it('builds compact read-only table, seed ledger, duplicate, and orphan queries', () => {
    expect(compactSql(' SELECT 1\n FROM table_name ')).toBe('SELECT/**/1/**/FROM/**/table_name');
    expect(buildTableCountSql(['AssessmentRecord', 'CustomerRecord'])).toBe(
      "SELECT/**/'AssessmentRecord'/**/AS/**/table_name,/**/COUNT(*)/**/AS/**/row_count/**/FROM/**/AssessmentRecord/**/UNION/**/ALL/**/SELECT/**/'CustomerRecord'/**/AS/**/table_name,/**/COUNT(*)/**/AS/**/row_count/**/FROM/**/CustomerRecord"
    );
    expect(() => buildTableCountSql([])).toThrow(/at least one table/);
    expect(() => buildTableCountSql(['AssessmentRecord; DROP TABLE User'])).toThrow(/invalid table name/);
    expect(() => buildTenantOrphanSql([])).toThrow(/requires at least one table/);
    expect(() => buildTenantOrphanSql(['AssessmentRecord; DROP TABLE User'])).toThrow(/invalid table name/);
    expect(getSchemaTablesSql()).toContain('sqlite_schema');
    expect(getSchemaTablesSql()).toContain("NOT/**/GLOB/**/'_cf_*'");
    expect(getSeedLedgerSql()).toContain('D1SeedFileLedger');
    expect(getDuplicateTransactionKeysSql()).toContain('GROUP/**/BY/**/tenant_id');
    expect(getDuplicateTransactionKeysSql()).toContain('WHERE/**/assessment_id/**/IS/**/NOT/**/NULL');
    expect(getDuplicateTransactionKeysSql()).toContain('source_document_id/**/IS/**/NOT/**/NULL');
    expect(getDuplicateTransactionKeysSql()).toContain('source_row_number/**/IS/**/NOT/**/NULL');
    expect(getAssessmentDataVersionIntegritySql()).toContain('GROUP/**/BY/**/assessment_id,/**/version_number');
    expect(getAssessmentDataVersionIntegritySql()).toContain('idx_data_version_assessment_number');
    expect(getUserIntegritySql()).toContain('GROUP/**/BY/**/lower(email)');
    expect(getUserIntegritySql()).toContain('idx_user_email_normalized');
    expect(getUserIntegritySql()).toContain('lower(email))');
    expect(getUserIntegritySql()).toContain('char(32)');
    expect(getUserIntegritySql()).not.toContain("'/**/'");
    expect(getR2CleanupIndexIntegritySql()).toContain('idx_r2_cleanup_created');
    expect(getR2CleanupIndexIntegritySql()).toContain('idx_r2_cleanup_tenant_created');
    expect(getR2CleanupIndexIntegritySql()).toContain('sqlite_schema');
    expect(getOrphanReferenceSql()).toContain('assessment_customer_orphans');
    expect(getOrphanReferenceSql()).toContain('transaction_tenant_orphans');
    expect(getTenantScopedPrimaryKeySql()).toContain("pragma_table_info('VendorPriceRank')");
    expect(getTenantScopedPrimaryKeySql()).toContain("pragma_table_info('Module1CurrencyBreakdown')");
    expect(getTenantIntegrityTriggerSql()).toContain('sqlite_schema');
    expect(TENANT_INTEGRITY_TRIGGER_NAMES).toHaveLength(50);
    expect(new Set(TENANT_INTEGRITY_TRIGGER_NAMES).size).toBe(50);
    expect(Object.keys(TENANT_SCOPED_PRIMARY_KEYS)).toHaveLength(5);
    expect(TENANT_REFERENCE_TABLES).toHaveLength(22);
    expect(TENANT_REFERENCE_TABLES).toContain('R2ObjectCleanupOutbox');
    expect(new Set(TENANT_REFERENCE_TABLES).size).toBe(TENANT_REFERENCE_TABLES.length);
    for (const tableName of TENANT_REFERENCE_TABLES) {
      expect(getOrphanReferenceSql()).toContain(`FROM/**/${tableName}/**/AS/**/scoped`);
    }
    expect(INTERNAL_TABLE_NAMES.has('D1SeedFileLedger')).toBe(true);
  });

  it('counts tenant references that do not resolve to a tenant master row', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(`
        CREATE TABLE TenantMaster (tenant_id TEXT PRIMARY KEY);
        CREATE TABLE AssessmentRecord (tenant_id TEXT NOT NULL);
        INSERT INTO TenantMaster VALUES ('tenant-a');
        INSERT INTO AssessmentRecord VALUES ('tenant-a');
        INSERT INTO AssessmentRecord VALUES ('tenant-missing');
      `);
      const rows = db.prepare(buildTenantOrphanSql(['AssessmentRecord'])).all();
      expect(rows).toEqual([{ check_name: 'tenant_id_orphans_AssessmentRecord', violation_count: 1 }]);
    } finally {
      db.close();
    }
  });

  it('uses the partial source-key index and excludes incomplete legacy keys from duplicate counts', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(`
        CREATE TABLE ProcurementTransaction (
          tenant_id TEXT NOT NULL,
          assessment_id TEXT,
          source_document_id TEXT,
          source_row_number INTEGER
        );
        CREATE UNIQUE INDEX idx_procurement_tx_source_row_unique
          ON ProcurementTransaction(tenant_id, assessment_id, source_document_id, source_row_number)
          WHERE assessment_id IS NOT NULL AND source_document_id IS NOT NULL AND source_row_number IS NOT NULL;
        INSERT INTO ProcurementTransaction VALUES ('tenant-a', NULL, NULL, 1);
        INSERT INTO ProcurementTransaction VALUES ('tenant-a', NULL, NULL, 1);
      `);

      const plan = db.prepare(`EXPLAIN QUERY PLAN ${getDuplicateTransactionKeysSql()}`).all();
      expect(plan.some((row) => String(row.detail).includes('USING COVERING INDEX idx_procurement_tx_source_row_unique'))).toBe(true);
      expect(db.prepare(getDuplicateTransactionKeysSql()).get()).toEqual({ duplicate_key_groups: 0 });
    } finally {
      db.close();
    }
  });

  it('detects duplicate assessment version keys and verifies the matching unique index', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(`
        CREATE TABLE AssessmentDataVersion (
          data_version_id TEXT PRIMARY KEY, assessment_id TEXT NOT NULL, version_number INTEGER NOT NULL
        );
        INSERT INTO AssessmentDataVersion VALUES ('DV-A', 'A-1', 1), ('DV-B', 'A-1', 1);
      `);
      expect(db.prepare(getAssessmentDataVersionIntegritySql()).all()).toEqual([
        { check_name: 'duplicate_assessment_data_version_groups', violation_count: 1 },
        { check_name: 'assessment_data_version_index_invalid', violation_count: 1 }
      ]);

      db.prepare("DELETE FROM AssessmentDataVersion WHERE data_version_id = 'DV-B'").run();
      db.exec('CREATE UNIQUE INDEX idx_data_version_assessment_number ON AssessmentDataVersion(assessment_id, version_number)');
      expect(db.prepare(getAssessmentDataVersionIntegritySql()).all()).toEqual([
        { check_name: 'duplicate_assessment_data_version_groups', violation_count: 0 },
        { check_name: 'assessment_data_version_index_invalid', violation_count: 0 }
      ]);
    } finally {
      db.close();
    }
  });

  it('validates both R2 cleanup queue indexes and their ordered query plans', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(`
        CREATE TABLE R2ObjectCleanupOutbox (
          cleanup_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, object_key TEXT NOT NULL,
          reason TEXT NOT NULL, attempt_count INTEGER NOT NULL DEFAULT 0,
          next_attempt_at TEXT NOT NULL, created_at TEXT NOT NULL,
          UNIQUE (tenant_id, object_key)
        );
      `);

      const missingIndexRows = db.prepare(getR2CleanupIndexIntegritySql()).all();
      const missingIndexReport = compareD1Drift({ r2CleanupIndexIntegrityRows: missingIndexRows });
      expect(missingIndexReport).toMatchObject({
        ok: false,
        r2CleanupIndexesValid: false,
        missingR2CleanupIndexes: Object.keys(R2_CLEANUP_INDEX_DEFINITIONS)
      });

      db.exec(`
        CREATE INDEX idx_r2_cleanup_created
          ON R2ObjectCleanupOutbox(next_attempt_at, created_at, cleanup_id);
        CREATE INDEX idx_r2_cleanup_tenant_created
          ON R2ObjectCleanupOutbox(tenant_id, next_attempt_at, created_at, cleanup_id);
      `);

      const validIndexRows = db.prepare(getR2CleanupIndexIntegritySql()).all();
      const validIndexReport = compareD1Drift({ r2CleanupIndexIntegrityRows: validIndexRows });
      expect(validIndexReport).toMatchObject({
        r2CleanupIndexesValid: true,
        missingR2CleanupIndexes: []
      });

      const globalPlan = db.prepare(`EXPLAIN QUERY PLAN ${R2_CLEANUP_SQL.selectAll}`).all(50);
      const tenantPlan = db.prepare(`EXPLAIN QUERY PLAN ${R2_CLEANUP_SQL.selectTenant}`).all('tenant-a', 50);
      expect(globalPlan.some((row) => String(row.detail).includes('idx_r2_cleanup_created'))).toBe(true);
      expect(tenantPlan.some((row) => String(row.detail).includes('idx_r2_cleanup_tenant_created'))).toBe(true);
    } finally {
      db.close();
    }
  });

  it('reads tenant-scoped primary key order from SQLite metadata', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(`
        CREATE TABLE VendorPriceRank (tenant_id TEXT, master_id TEXT, PRIMARY KEY (tenant_id, master_id));
        CREATE TABLE ConversionFunnelPhase (tenant_id TEXT, phase_num INTEGER, PRIMARY KEY (tenant_id, phase_num));
        CREATE TABLE DatasetMetricSummary (tenant_id TEXT, metric_key TEXT, PRIMARY KEY (tenant_id, metric_key));
        CREATE TABLE Module1MonthlySpend (tenant_id TEXT, month_key TEXT, PRIMARY KEY (tenant_id, month_key));
        CREATE TABLE Module1CurrencyBreakdown (tenant_id TEXT, currency TEXT, PRIMARY KEY (tenant_id, currency));
      `);

      const rows = db.prepare(getTenantScopedPrimaryKeySql()).all();
      const report = compareD1Drift({
        expectedTables: Object.keys(TENANT_SCOPED_PRIMARY_KEYS),
        actualTables: Object.keys(TENANT_SCOPED_PRIMARY_KEYS),
        tenantPrimaryKeyRows: rows
      });

      expect(report.tenantPrimaryKeyMismatches).toEqual([]);
    } finally {
      db.close();
    }
  });

  it('detects missing tenant integrity triggers from SQLite metadata', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec('CREATE TABLE trigger_target (tenant_id TEXT)');
      for (const triggerName of TENANT_INTEGRITY_TRIGGER_NAMES) {
        db.exec(`CREATE TRIGGER ${triggerName} BEFORE INSERT ON trigger_target BEGIN SELECT 1; END`);
      }

      const rows = db.prepare(getTenantIntegrityTriggerSql()).all();
      expect(rows).toHaveLength(TENANT_INTEGRITY_TRIGGER_NAMES.length);
      const completeReport = compareD1Drift({
        tenantIntegrityTriggerNames: rows.map((row) => row.trigger_name),
        r2CleanupIndexIntegrityRows: createValidR2CleanupIndexIntegrityRows()
      });
      const incompleteReport = compareD1Drift({
        tenantIntegrityTriggerNames: rows
          .filter((row) => row.trigger_name !== TENANT_INTEGRITY_TRIGGER_NAMES[0])
          .map((row) => row.trigger_name)
      });

      expect(completeReport.missingTenantIntegrityTriggers).toEqual([]);
      expect(incompleteReport.ok).toBe(false);
      expect(incompleteReport.missingTenantIntegrityTriggers).toEqual([TENANT_INTEGRITY_TRIGGER_NAMES[0]]);
    } finally {
      db.close();
    }
  });

  it('accepts a clean schema, row inventory, checksum ledger, and integrity report', () => {
    const report = compareD1Drift({
      expectedTables: ['AssessmentRecord', 'D1SeedFileLedger'],
      actualTables: ['AssessmentRecord', 'D1SeedFileLedger'],
      expectedCounts: { AssessmentRecord: 3, D1SeedFileLedger: 0 },
      actualCounts: [{ table_name: 'AssessmentRecord', row_count: 3 }],
      expectedSeedChecksums: { 'd1-seed.sql': 'base', 'reference.sql': 'abc' },
      actualSeedLedgerRows: [
        { seed_file: 'd1-seed.sql', source_checksum: 'base' },
        { seed_file: 'reference.sql', source_checksum: 'abc' }
      ],
      duplicateKeyGroups: 0,
      duplicateUserEmailGroups: 0,
      normalizedUserEmailIndexValid: true,
      r2CleanupIndexIntegrityRows: createValidR2CleanupIndexIntegrityRows(),
      orphanCounts: { transaction_assessment_orphans: 0 },
      foreignKeyViolations: 0,
      tenantPrimaryKeyRows: createTenantPrimaryKeyRows(),
      tenantIntegrityTriggerNames: TENANT_INTEGRITY_TRIGGER_NAMES
    });
    expect(report).toMatchObject({
      ok: true,
      missingTables: [],
      extraTables: [],
      rowCountMismatches: [],
      seedLedger: { missingFiles: [], checksumMismatches: [], unexpectedFiles: [] },
      duplicateTransactionKeyGroups: 0,
      duplicateAssessmentDataVersionGroups: 0,
      assessmentDataVersionIndexValid: true,
      duplicateUserEmailGroups: 0,
      normalizedUserEmailIndexValid: true,
      orphanCounts: { transaction_assessment_orphans: 0 },
      foreignKeyViolations: 0,
      tenantPrimaryKeyMismatches: [],
      missingTenantIntegrityTriggers: []
    });
  });

  it('reports schema, count, ledger, duplicate, orphan, and foreign key drift without row data', () => {
    const report = compareD1Drift({
      expectedTables: ['AssessmentRecord', 'CustomerRecord', 'D1SeedFileLedger'],
      actualTables: ['AssessmentRecord', 'D1SeedFileLedger', 'UnexpectedTable'],
      expectedCounts: { AssessmentRecord: 3, CustomerRecord: 7, D1SeedFileLedger: 0 },
      actualCounts: [{ table_name: 'AssessmentRecord', row_count: 2 }],
      expectedSeedChecksums: { 'd1-seed.sql': 'base', 'reference.sql': 'abc', 'feature.sql': 'def' },
      actualSeedLedgerRows: [
        { seed_file: 'reference.sql', source_checksum: 'wrong' },
        { seed_file: 'unexpected.sql', source_checksum: 'extra' }
      ],
      duplicateKeyGroups: 2,
      duplicateUserEmailGroups: 3,
      normalizedUserEmailIndexValid: false,
      orphanCounts: { transaction_assessment_orphans: 1, assessment_customer_orphans: 0 },
      foreignKeyViolations: 4
    });
    expect(report).toMatchObject({
      ok: false,
      missingTables: ['CustomerRecord'],
      extraTables: ['UnexpectedTable'],
      rowCountMismatches: [{ tableName: 'AssessmentRecord', expected: 3, actual: 2 }],
      seedLedger: {
        missingFiles: ['d1-seed.sql', 'feature.sql'],
        checksumMismatches: ['reference.sql'],
        unexpectedFiles: ['unexpected.sql']
      },
      duplicateTransactionKeyGroups: 2,
      duplicateUserEmailGroups: 3,
      normalizedUserEmailIndexValid: false,
      orphanCounts: { assessment_customer_orphans: 0, transaction_assessment_orphans: 1 },
      foreignKeyViolations: 4
    });
    expect(JSON.stringify(report)).not.toContain('transaction_id');
  });

  it('reports missing counts and an absent checksum ledger as drift', () => {
    const report = compareD1Drift({
      expectedTables: ['AssessmentRecord', 'D1SeedFileLedger'],
      actualTables: ['AssessmentRecord'],
      expectedCounts: { AssessmentRecord: 0, D1SeedFileLedger: 0 },
      actualCounts: [],
      expectedSeedChecksums: { 'd1-seed.sql': 'base', 'reference.sql': 'abc' }
    });
    expect(report.ok).toBe(false);
    expect(report.missingTables).toEqual(['D1SeedFileLedger']);
    expect(report.rowCountMismatches).toEqual([]);
    expect(report.seedLedger.missingFiles).toEqual(['d1-seed.sql', 'reference.sql']);
  });

  it('fails closed when normalized user email integrity is missing or duplicated', () => {
    const missingIndex = compareD1Drift({
      expectedTables: ['User'],
      actualTables: ['User'],
      expectedCounts: { User: 1 },
      actualCounts: [{ table_name: 'User', row_count: 1 }],
      duplicateUserEmailGroups: 0,
      normalizedUserEmailIndexValid: false
    });
    const duplicateAccounts = compareD1Drift({
      expectedTables: ['User'],
      actualTables: ['User'],
      expectedCounts: { User: 2 },
      actualCounts: [{ table_name: 'User', row_count: 2 }],
      duplicateUserEmailGroups: 1,
      normalizedUserEmailIndexValid: true
    });

    expect(missingIndex).toMatchObject({ ok: false, normalizedUserEmailIndexValid: false });
    expect(duplicateAccounts).toMatchObject({ ok: false, duplicateUserEmailGroups: 1 });
  });

  it('fails closed when assessment version numbering is duplicated or lacks the unique index', () => {
    const report = compareD1Drift({
      expectedTables: ['AssessmentDataVersion'],
      actualTables: ['AssessmentDataVersion'],
      duplicateAssessmentDataVersionGroups: 1,
      assessmentDataVersionIndexValid: false
    });

    expect(report).toMatchObject({
      ok: false,
      duplicateAssessmentDataVersionGroups: 1,
      assessmentDataVersionIndexValid: false
    });
  });

  it('reports globally keyed tenant aggregates as schema drift', () => {
    const report = compareD1Drift({
      expectedTables: Object.keys(TENANT_SCOPED_PRIMARY_KEYS),
      actualTables: Object.keys(TENANT_SCOPED_PRIMARY_KEYS),
      normalizedUserEmailIndexValid: true,
      tenantPrimaryKeyRows: createTenantPrimaryKeyRows({ Module1CurrencyBreakdown: ['currency'] })
    });

    expect(report.ok).toBe(false);
    expect(report.tenantPrimaryKeyMismatches).toEqual([{
      tableName: 'Module1CurrencyBreakdown',
      expected: ['tenant_id', 'currency'],
      actual: ['currency']
    }]);
  });
});
