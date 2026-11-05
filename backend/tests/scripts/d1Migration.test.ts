import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
const { applyD1CompatibilityMigrations } = require('../../scripts/d1-migration-tools');

const createMigrationExecutor = (database: InstanceType<typeof DatabaseSync>) => {
  const writeCommands: string[] = [];
  const executeSqlCommand = (sql: string, jsonOutput = false): unknown[] => {
    if (jsonOutput) return database.prepare(sql).all() as unknown[];
    database.exec(sql);
    writeCommands.push(sql);
    return [];
  };
  return { executeSqlCommand, writeCommands };
};

const createAggregateTables = (database: InstanceType<typeof DatabaseSync>): void => {
  database.exec(`
    CREATE TABLE SpendCategorySummary (id TEXT PRIMARY KEY, spend_inr_crores REAL);
    CREATE TABLE CategoryYearDetail (id TEXT PRIMARY KEY, rank INTEGER);
    CREATE TABLE VendorYearDetail (id TEXT PRIMARY KEY, total_3yr_spend_inr_cr REAL);
    CREATE TABLE LineItemMapping (mapping_id TEXT PRIMARY KEY);
    CREATE TABLE VendorPriceRank (
      vendor_name TEXT NOT NULL, master_id TEXT PRIMARY KEY NOT NULL, category TEXT NOT NULL,
      price_creep_pct REAL DEFAULT 0, total_spend REAL NOT NULL DEFAULT 0, total_spend_inr_cr REAL,
      risk_status TEXT DEFAULT 'ALIGNED', variance_leakage_usd REAL DEFAULT 0, variance_leakage_inr_cr REAL,
      benchmark_index TEXT DEFAULT 'LME', last_36mo_trend TEXT DEFAULT '[]'
    );
    CREATE TABLE ConversionFunnelPhase (
      phase_num INTEGER PRIMARY KEY NOT NULL, phase_name TEXT NOT NULL, platform_actionable_focus TEXT NOT NULL,
      value_outcome_delivered TEXT NOT NULL, commercial_lock_in_metric TEXT NOT NULL,
      completion_pct REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Upcoming',
      spend_evaluated_cr REAL, count_elements INTEGER, percentage_leakage_identified REAL
    );
    CREATE TABLE DatasetMetricSummary (
      metric_key TEXT PRIMARY KEY NOT NULL, metric_value REAL, metric_text TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE Module1MonthlySpend (month_key TEXT PRIMARY KEY NOT NULL, spend_inr_cr REAL NOT NULL);
    CREATE TABLE Module1CurrencyBreakdown (
      currency TEXT PRIMARY KEY NOT NULL, spend_inr_cr REAL NOT NULL, percentage REAL NOT NULL
    );
    CREATE TABLE CustomerRecord (customer_id TEXT PRIMARY KEY, status TEXT);
    CREATE TABLE AssessmentRecord (assessment_id TEXT PRIMARY KEY, created_at TEXT);
  `);
};

describe('batched D1 compatibility migrations', () => {
  it('checks an empty database with one metadata query and no writes', () => {
    const database = new DatabaseSync(':memory:');
    try {
      const { executeSqlCommand, writeCommands } = createMigrationExecutor(database);
      expect(applyD1CompatibilityMigrations(executeSqlCommand)).toEqual({
        metadataQueries: 1,
        writeCommands: 0,
        statements: 0,
        migratedTables: 0
      });
      expect(writeCommands).toHaveLength(0);
    } finally {
      database.close();
    }
  });

  it('backfills validation ownership and creates its index in a single write call', () => {
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(`
        CREATE TABLE RawDocumentIngestion (doc_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL);
        CREATE TABLE ValidationPreCheckRecord (
          record_id TEXT PRIMARY KEY NOT NULL, po_number TEXT NOT NULL, vendor_name TEXT NOT NULL,
          raw_desc TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO RawDocumentIngestion VALUES ('DOC-A', 'TENANT-A'), ('DOC-B', 'TENANT-B');
        INSERT INTO ValidationPreCheckRecord (record_id, po_number, vendor_name, raw_desc)
        VALUES ('REC-DOC-A-ROW-2', 'PO-A', 'Alpha', 'A'),
          ('REC-DOC-B-ROW-3', 'PO-B', 'Beta', 'B'), ('REC-ORPHAN-ROW-4', 'PO-X', 'Other', 'X');
      `);
      const { executeSqlCommand, writeCommands } = createMigrationExecutor(database);

      expect(applyD1CompatibilityMigrations(executeSqlCommand)).toEqual({
        metadataQueries: 1,
        writeCommands: 1,
        statements: 3,
        migratedTables: 1
      });
      expect(writeCommands).toHaveLength(1);
      expect(database.prepare('SELECT record_id, tenant_id FROM ValidationPreCheckRecord ORDER BY record_id').all()).toEqual([
        { record_id: 'REC-DOC-A-ROW-2', tenant_id: 'TENANT-A' },
        { record_id: 'REC-DOC-B-ROW-3', tenant_id: 'TENANT-B' },
        { record_id: 'REC-ORPHAN-ROW-4', tenant_id: 'TNT-GLOBAL-8902' }
      ]);
      expect(database.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_val_record_tenant_created'").get())
        .toEqual({ name: 'idx_val_record_tenant_created' });

      expect(applyD1CompatibilityMigrations(executeSqlCommand)).toEqual({
        metadataQueries: 1,
        writeCommands: 0,
        statements: 0,
        migratedTables: 0
      });
      expect(writeCommands).toHaveLength(1);
    } finally {
      database.close();
    }
  });

  it('adds validation ownership when no source document table exists', () => {
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(`CREATE TABLE ValidationPreCheckRecord (
        record_id TEXT PRIMARY KEY NOT NULL, po_number TEXT NOT NULL, vendor_name TEXT NOT NULL,
        raw_desc TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`);
      const { executeSqlCommand, writeCommands } = createMigrationExecutor(database);

      expect(applyD1CompatibilityMigrations(executeSqlCommand)).toEqual({
        metadataQueries: 1,
        writeCommands: 1,
        statements: 2,
        migratedTables: 1
      });
      expect(writeCommands).toHaveLength(1);
      expect(database.prepare('PRAGMA table_info(ValidationPreCheckRecord)').all())
        .toContainEqual(expect.objectContaining({ name: 'tenant_id' }));
    } finally {
      database.close();
    }
  });

  it('creates user tenant and normalized-email indexes together after duplicate preflight', () => {
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE TenantMaster (tenant_id TEXT PRIMARY KEY);
        CREATE TABLE User (id TEXT PRIMARY KEY, email TEXT NOT NULL, company_name TEXT NOT NULL);
        CREATE INDEX idx_user_email ON User(email);
        INSERT INTO TenantMaster VALUES ('tenant-valid');
        INSERT INTO User VALUES ('user-a', 'a@example.com', 'Alpha');
        INSERT INTO User VALUES ('user-b', 'b@example.com', 'Beta');
      `);
      const { executeSqlCommand, writeCommands } = createMigrationExecutor(database);

      expect(applyD1CompatibilityMigrations(executeSqlCommand)).toEqual({
        metadataQueries: 2,
        writeCommands: 1,
        statements: 4,
        migratedTables: 1
      });
      expect(writeCommands).toHaveLength(1);
      expect(database.prepare('SELECT id, tenant_id FROM User ORDER BY id').all()).toEqual([
        { id: 'user-a', tenant_id: null },
        { id: 'user-b', tenant_id: null }
      ]);
      expect(database.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_user_email_normalized'").get())
        .toEqual({ name: 'idx_user_email_normalized' });
      expect(database.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_user_email'").get())
        .toBeUndefined();
      expect(() => database.prepare('UPDATE User SET tenant_id = ? WHERE id = ?').run('tenant-missing', 'user-a')).toThrow();
      database.prepare('UPDATE User SET tenant_id = ? WHERE id = ?').run('tenant-valid', 'user-a');

      expect(applyD1CompatibilityMigrations(executeSqlCommand)).toEqual({
        metadataQueries: 1,
        writeCommands: 0,
        statements: 0,
        migratedTables: 0
      });
      expect(writeCommands).toHaveLength(1);
    } finally {
      database.close();
    }
  });

  it('drops a redundant email index without rescanning users when the normalized index already exists', () => {
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(`
        CREATE TABLE TenantMaster (tenant_id TEXT PRIMARY KEY);
        CREATE TABLE User (id TEXT PRIMARY KEY, email TEXT NOT NULL, tenant_id TEXT);
        CREATE UNIQUE INDEX idx_user_email_normalized ON User(lower(email));
        CREATE INDEX idx_user_email ON User(email);
      `);
      const { executeSqlCommand, writeCommands } = createMigrationExecutor(database);

      expect(applyD1CompatibilityMigrations(executeSqlCommand)).toEqual({
        metadataQueries: 1,
        writeCommands: 1,
        statements: 2,
        migratedTables: 0
      });
      expect(writeCommands).toHaveLength(1);
      expect(database.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_user_email'").get())
        .toBeUndefined();
      expect(database.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_user_email_normalized'").get())
        .toEqual({ name: 'idx_user_email_normalized' });
    } finally {
      database.close();
    }
  });

  it('refuses case-folded duplicate accounts before writing tenant or email indexes', () => {
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(`
        CREATE TABLE TenantMaster (tenant_id TEXT PRIMARY KEY);
        CREATE TABLE User (id TEXT PRIMARY KEY, email TEXT NOT NULL);
        INSERT INTO User VALUES ('user-a', 'a@example.com'), ('user-b', 'A@EXAMPLE.COM');
      `);
      const { executeSqlCommand, writeCommands } = createMigrationExecutor(database);

      expect(() => applyD1CompatibilityMigrations(executeSqlCommand))
        .toThrow(/1 case-insensitive duplicate group/u);
      expect(writeCommands).toHaveLength(0);
      expect(database.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'index' AND name = 'idx_user_email_normalized'").get())
        .toEqual({ count: 0 });
      expect(database.prepare('SELECT COUNT(*) AS count FROM User').get()).toEqual({ count: 2 });
    } finally {
      database.close();
    }
  });

  it('fails closed when the legacy user table is missing the email field or has a malformed index', () => {
    const missingEmailDatabase = new DatabaseSync(':memory:');
    try {
      missingEmailDatabase.exec('CREATE TABLE User (id TEXT PRIMARY KEY);');
      const { executeSqlCommand, writeCommands } = createMigrationExecutor(missingEmailDatabase);
      expect(() => applyD1CompatibilityMigrations(executeSqlCommand)).toThrow(/User.email is missing/u);
      expect(writeCommands).toHaveLength(0);
    } finally {
      missingEmailDatabase.close();
    }

    const malformedIndexDatabase = new DatabaseSync(':memory:');
    try {
      malformedIndexDatabase.exec(`
        CREATE TABLE TenantMaster (tenant_id TEXT PRIMARY KEY);
        CREATE TABLE User (id TEXT PRIMARY KEY, email TEXT NOT NULL);
        CREATE INDEX idx_user_email_normalized ON User(lower(email));
      `);
      const { executeSqlCommand, writeCommands } = createMigrationExecutor(malformedIndexDatabase);
      expect(() => applyD1CompatibilityMigrations(executeSqlCommand)).toThrow(/unexpected definition/u);
      expect(writeCommands).toHaveLength(0);
    } finally {
      malformedIndexDatabase.close();
    }
  });

  it('adds tenant ownership and scope indexes to legacy aggregates in one write call', () => {
    const database = new DatabaseSync(':memory:');
    try {
      createAggregateTables(database);
      database.exec(`
        INSERT INTO SpendCategorySummary VALUES ('CAT-1', 2.5);
        INSERT INTO CustomerRecord VALUES ('C-LEGACY', 'ACTIVE');
        INSERT INTO AssessmentRecord VALUES ('A-LEGACY', '2026-01-01');
        INSERT INTO VendorPriceRank (vendor_name, master_id, category, total_spend) VALUES ('Legacy Steel', 'V-1', 'Steel', 50);
        INSERT INTO ConversionFunnelPhase (phase_num, phase_name, platform_actionable_focus, value_outcome_delivered, commercial_lock_in_metric)
          VALUES (1, 'Intake', 'Validate', 'Qualified spend', 'Accepted dataset');
        INSERT INTO DatasetMetricSummary (metric_key, metric_value) VALUES ('totalSpendCr', 12.5);
        INSERT INTO Module1MonthlySpend (month_key, spend_inr_cr) VALUES ('2026-01', 12.5);
        INSERT INTO Module1CurrencyBreakdown (currency, spend_inr_cr, percentage) VALUES ('INR', 12.5, 100);
      `);
      const { executeSqlCommand, writeCommands } = createMigrationExecutor(database);

      expect(applyD1CompatibilityMigrations(executeSqlCommand)).toEqual({
        metadataQueries: 1,
        writeCommands: 1,
        statements: 38,
        migratedTables: 11
      });
      expect(writeCommands).toHaveLength(1);
      expect(database.prepare('SELECT tenant_id FROM SpendCategorySummary WHERE id = ?').get('CAT-1'))
        .toEqual({ tenant_id: 'TNT-GLOBAL-8902' });
      expect(database.prepare('SELECT tenant_id FROM CustomerRecord WHERE customer_id = ?').get('C-LEGACY'))
        .toEqual({ tenant_id: 'TNT-GLOBAL-8902' });
      expect(database.prepare('SELECT tenant_id FROM AssessmentRecord WHERE assessment_id = ?').get('A-LEGACY'))
        .toEqual({ tenant_id: 'TNT-GLOBAL-8902' });
      expect(database.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%tenant%' OR name = 'idx_assessment_tenant_created'").get())
        .toEqual({ count: 7 });
      expect(database.prepare('SELECT tenant_id, master_id FROM VendorPriceRank').all())
        .toEqual([{ tenant_id: 'TNT-GLOBAL-8902', master_id: 'V-1' }]);
      database.prepare('INSERT INTO VendorPriceRank (vendor_name, master_id, tenant_id, category) VALUES (?, ?, ?, ?)')
        .run('Other Steel', 'V-1', 'TENANT-B', 'Steel');
      database.prepare('INSERT INTO ConversionFunnelPhase (phase_num, tenant_id, phase_name, platform_actionable_focus, value_outcome_delivered, commercial_lock_in_metric) VALUES (?, ?, ?, ?, ?, ?)')
        .run(1, 'TENANT-B', 'Intake', 'Validate', 'Qualified spend', 'Accepted dataset');
      database.prepare('INSERT INTO DatasetMetricSummary (tenant_id, metric_key, metric_value) VALUES (?, ?, ?)')
        .run('TENANT-B', 'totalSpendCr', 20);
      database.prepare('INSERT INTO Module1MonthlySpend (tenant_id, month_key, spend_inr_cr) VALUES (?, ?, ?)')
        .run('TENANT-B', '2026-01', 20);
      database.prepare('INSERT INTO Module1CurrencyBreakdown (tenant_id, currency, spend_inr_cr, percentage) VALUES (?, ?, ?, ?)')
        .run('TENANT-B', 'INR', 20, 100);

      expect(applyD1CompatibilityMigrations(executeSqlCommand)).toEqual({
        metadataQueries: 1,
        writeCommands: 0,
        statements: 0,
        migratedTables: 0
      });
      expect(writeCommands).toHaveLength(1);
    } finally {
      database.close();
    }
  });
});
