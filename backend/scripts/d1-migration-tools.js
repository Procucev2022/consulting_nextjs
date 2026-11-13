const TENANT_OWNED_TABLE_MIGRATIONS = [
  ['ValidationPreCheckRecord', 'idx_val_record_tenant_created', 'tenant_id, created_at DESC, record_id DESC'],
  ['User', 'idx_user_tenant', 'tenant_id'],
  ['SpendCategorySummary', 'idx_category_summary_tenant_spend', 'tenant_id, spend_inr_crores DESC'],
  ['CategoryYearDetail', 'idx_category_year_tenant_rank', 'tenant_id, rank'],
  ['VendorYearDetail', 'idx_vendor_detail_tenant_spend', 'tenant_id, total_3yr_spend_inr_cr DESC'],
  ['LineItemMapping', 'idx_line_mapping_tenant_id', 'tenant_id, mapping_id'],
  ['VendorPriceRank', 'idx_vendor_price_rank_tenant_spend', 'tenant_id, total_spend_inr_cr DESC'],
  ['ConversionFunnelPhase', null, null],
  ['DatasetMetricSummary', null, null],
  ['Module1MonthlySpend', null, null],
  ['Module1CurrencyBreakdown', null, null],
  ['CustomerRecord', 'idx_customer_tenant_status', 'tenant_id, status'],
  ['AssessmentRecord', 'idx_assessment_tenant_created', 'tenant_id, created_at DESC']
];

const LEGACY_INDEXES_TO_DROP = [
  'idx_conversion_funnel_tenant_phase',
  'idx_dataset_metric_tenant_key',
  'idx_module1_monthly_tenant_month',
  'idx_module1_currency_tenant_currency',
  'idx_data_version_assessment'
];

const ASSESSMENT_DATA_VERSION_INDEX_NAME = 'idx_data_version_assessment_number';
const ASSESSMENT_DATA_VERSION_INDEX_DEFINITION =
  'createuniqueindexidx_data_version_assessment_numberonassessmentdataversion(assessment_id,version_number)';

const TENANT_SCOPED_PRIMARY_KEY_MIGRATIONS = [
  {
    tableName: 'VendorPriceRank',
    legacyKey: 'master_id',
    columns: 'vendor_name TEXT NOT NULL, master_id TEXT NOT NULL, tenant_id TEXT NOT NULL DEFAULT \'TNT-GLOBAL-8902\', ' +
      "category TEXT NOT NULL, price_creep_pct REAL DEFAULT 0, total_spend REAL NOT NULL DEFAULT 0, " +
      "total_spend_inr_cr REAL, risk_status TEXT DEFAULT 'ALIGNED', variance_leakage_usd REAL DEFAULT 0, " +
      "variance_leakage_inr_cr REAL, benchmark_index TEXT DEFAULT 'LME', last_36mo_trend TEXT DEFAULT '[]'",
    columnNames: 'vendor_name, master_id, tenant_id, category, price_creep_pct, total_spend, total_spend_inr_cr, ' +
      'risk_status, variance_leakage_usd, variance_leakage_inr_cr, benchmark_index, last_36mo_trend'
  },
  {
    tableName: 'ConversionFunnelPhase',
    legacyKey: 'phase_num',
    columns: "phase_num INTEGER NOT NULL, tenant_id TEXT NOT NULL DEFAULT 'TNT-GLOBAL-8902', " +
      'phase_name TEXT NOT NULL, platform_actionable_focus TEXT NOT NULL, value_outcome_delivered TEXT NOT NULL, ' +
      'commercial_lock_in_metric TEXT NOT NULL, completion_pct REAL NOT NULL DEFAULT 0, ' +
      "status TEXT NOT NULL DEFAULT 'Upcoming', spend_evaluated_cr REAL, count_elements INTEGER, " +
      'percentage_leakage_identified REAL',
    columnNames: 'phase_num, tenant_id, phase_name, platform_actionable_focus, value_outcome_delivered, ' +
      'commercial_lock_in_metric, completion_pct, status, spend_evaluated_cr, count_elements, percentage_leakage_identified'
  },
  {
    tableName: 'DatasetMetricSummary',
    legacyKey: 'metric_key',
    columns: "tenant_id TEXT NOT NULL DEFAULT 'TNT-GLOBAL-8902', metric_key TEXT NOT NULL, metric_value REAL, " +
      'metric_text TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
    columnNames: 'tenant_id, metric_key, metric_value, metric_text, updated_at'
  },
  {
    tableName: 'Module1MonthlySpend',
    legacyKey: 'month_key',
    columns: "tenant_id TEXT NOT NULL DEFAULT 'TNT-GLOBAL-8902', month_key TEXT NOT NULL, spend_inr_cr REAL NOT NULL",
    columnNames: 'tenant_id, month_key, spend_inr_cr'
  },
  {
    tableName: 'Module1CurrencyBreakdown',
    legacyKey: 'currency',
    columns: "tenant_id TEXT NOT NULL DEFAULT 'TNT-GLOBAL-8902', currency TEXT NOT NULL, " +
      'spend_inr_cr REAL NOT NULL, percentage REAL NOT NULL',
    columnNames: 'tenant_id, currency, spend_inr_cr, percentage'
  }
];

const TABLES_TO_INSPECT = [
  'TenantMaster', 'RawDocumentIngestion', 'AssessmentDataVersion',
  ...new Set(TENANT_OWNED_TABLE_MIGRATIONS.map(([tableName]) => tableName))
];

const INDEX_NAMES_TO_INSPECT = [
  ...TENANT_OWNED_TABLE_MIGRATIONS.map(([, indexName]) => indexName).filter(Boolean),
  ...LEGACY_INDEXES_TO_DROP,
  ASSESSMENT_DATA_VERSION_INDEX_NAME,
  'idx_user_email_normalized',
  'idx_user_email'
];

const USER_NORMALIZED_EMAIL_INDEX_DEFINITION = 'createuniqueindexidx_user_email_normalizedonuser(lower(email))';

const quoteSqlLiteral = (value) => `'${String(value).replace(/'/gu, "''")}'`;

const buildMigrationInventorySql = () => {
  const tableValues = TABLES_TO_INSPECT.map((tableName) => `(${quoteSqlLiteral(tableName)})`).join(', ');
  const tableNames = TABLES_TO_INSPECT.map(quoteSqlLiteral).join(', ');
  const indexNames = INDEX_NAMES_TO_INSPECT.map(quoteSqlLiteral).join(', ');
  const tableRows = `WITH table_inventory(table_name) AS (VALUES ${tableValues})
    SELECT 'table' AS record_type, name AS table_name, NULL AS object_name, NULL AS definition
      FROM sqlite_master WHERE type = 'table' AND name IN (${tableNames})`;
  const columnRows = TABLES_TO_INSPECT.map((tableName) =>
    `SELECT 'column' AS record_type, ${quoteSqlLiteral(tableName)} AS table_name,
      name AS object_name, pk AS definition
    FROM pragma_table_info(${quoteSqlLiteral(tableName)})`
  );
  const indexRows = `SELECT 'index' AS record_type, tbl_name AS table_name, name AS object_name, sql AS definition
    FROM sqlite_master WHERE type = 'index' AND name IN (${indexNames})`;
  return [tableRows, ...columnRows, indexRows].join(';\n') + ';';
};

const normalizeIndexDefinition = (sql) => String(sql || '').toLowerCase().replace(/["`\s]/gu, '');

const applyD1CompatibilityMigrations = (executeSqlCommand) => {
  const inventoryRows = executeSqlCommand(buildMigrationInventorySql(), true);
  const tableNames = new Set(inventoryRows
    .filter((row) => row.record_type === 'table')
    .map((row) => row.table_name));
  const columnsByTable = new Map();
  const primaryKeyPositionsByTable = new Map();
  for (const row of inventoryRows.filter((entry) => entry.record_type === 'column')) {
    if (!columnsByTable.has(row.table_name)) columnsByTable.set(row.table_name, new Set());
    columnsByTable.get(row.table_name).add(row.object_name);
    if (Number(row.definition) > 0) {
      if (!primaryKeyPositionsByTable.has(row.table_name)) primaryKeyPositionsByTable.set(row.table_name, []);
      primaryKeyPositionsByTable.get(row.table_name).push({ position: Number(row.definition), name: row.object_name });
    }
  }
  const indexesByName = new Map(inventoryRows
    .filter((row) => row.record_type === 'index')
    .map((row) => [row.object_name, row]));
  const statements = [];
  const migratedTables = new Set();
  const addedTenantColumns = new Set();
  let metadataQueries = 1;

  const hasColumn = (tableName, columnName) => columnsByTable.get(tableName)?.has(columnName) || false;
  const addTenantColumn = (tableName) => {
    if (hasColumn(tableName, 'tenant_id') || addedTenantColumns.has(tableName)) return false;
    const statement = tableName === 'User'
      ? 'ALTER TABLE User ADD COLUMN tenant_id TEXT REFERENCES TenantMaster(tenant_id) ON DELETE RESTRICT;'
      : `ALTER TABLE ${tableName} ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'TNT-GLOBAL-8902';`;
    statements.push(statement);
    addedTenantColumns.add(tableName);
    migratedTables.add(tableName);
    return true;
  };

  const primaryKeyColumns = (tableName) => (primaryKeyPositionsByTable.get(tableName) || [])
    .sort((left, right) => left.position - right.position)
    .map(({ name }) => name);

  const validationNeedsBackfill = tableNames.has('ValidationPreCheckRecord') &&
    !hasColumn('ValidationPreCheckRecord', 'tenant_id');
  if (validationNeedsBackfill) addTenantColumn('ValidationPreCheckRecord');
  if (validationNeedsBackfill && tableNames.has('RawDocumentIngestion')) {
    statements.push(`UPDATE ValidationPreCheckRecord AS validation
      SET tenant_id = (
        SELECT ingestion.tenant_id FROM RawDocumentIngestion AS ingestion
        WHERE SUBSTR(validation.record_id, 1, LENGTH('REC-' || ingestion.doc_id || '-ROW-')) =
          'REC-' || ingestion.doc_id || '-ROW-'
        ORDER BY LENGTH(ingestion.doc_id) DESC LIMIT 1
      )
      WHERE EXISTS (
        SELECT 1 FROM RawDocumentIngestion AS ingestion
        WHERE SUBSTR(validation.record_id, 1, LENGTH('REC-' || ingestion.doc_id || '-ROW-')) =
          'REC-' || ingestion.doc_id || '-ROW-'
      );`);
  }

  const userExists = tableNames.has('User');
  if (userExists && !hasColumn('User', 'email')) {
    throw new Error('Cannot enforce normalized user email uniqueness: User.email is missing.');
  }
  if (userExists && !hasColumn('User', 'tenant_id') && !tableNames.has('TenantMaster')) {
    throw new Error('Cannot add User.tenant_id because the TenantMaster table is missing.');
  }

  const normalizedIndex = indexesByName.get('idx_user_email_normalized');
  const legacyEmailIndexExists = indexesByName.has('idx_user_email');
  if (normalizedIndex && normalizeIndexDefinition(normalizedIndex.definition) !== USER_NORMALIZED_EMAIL_INDEX_DEFINITION) {
    throw new Error('Cannot enforce normalized user email uniqueness: idx_user_email_normalized has an unexpected definition.');
  }
  if (userExists && !normalizedIndex) {
    const duplicateRows = executeSqlCommand(
      'SELECT COUNT(*) AS duplicate_groups FROM (SELECT lower(email) FROM User GROUP BY lower(email) HAVING COUNT(*) > 1);',
      true
    );
    metadataQueries += 1;
    const duplicateGroups = Number(duplicateRows[0]?.duplicate_groups || 0);
    if (duplicateGroups > 0) {
      throw new Error(
        `Cannot enforce normalized user email uniqueness: ${duplicateGroups} case-insensitive duplicate group(s) exist. Resolve account identities before syncing the schema.`
      );
    }
  }

  const dataVersionIndex = indexesByName.get(ASSESSMENT_DATA_VERSION_INDEX_NAME);
  if (dataVersionIndex && normalizeIndexDefinition(dataVersionIndex.definition) !== ASSESSMENT_DATA_VERSION_INDEX_DEFINITION) {
    throw new Error('Cannot enforce unique assessment data version numbering: the index has an unexpected definition.');
  }
  if (tableNames.has('AssessmentDataVersion') && !dataVersionIndex) {
    const versionColumns = columnsByTable.get('AssessmentDataVersion');
    if (!versionColumns?.has('assessment_id') || !versionColumns.has('version_number')) {
      throw new Error('Cannot enforce unique assessment data version numbering: required key columns are missing.');
    }
    const duplicateRows = executeSqlCommand(
      'SELECT COUNT(*) AS duplicate_groups FROM (SELECT assessment_id, version_number FROM AssessmentDataVersion GROUP BY assessment_id, version_number HAVING COUNT(*) > 1);',
      true
    );
    metadataQueries += 1;
    const duplicateGroups = Number(duplicateRows[0]?.duplicate_groups || 0);
    if (duplicateGroups > 0) {
      throw new Error(
        `Cannot enforce unique assessment data version numbering: ${duplicateGroups} duplicate assessment/version group(s) exist. Resolve version identities before syncing the schema.`
      );
    }
    statements.push(
      `CREATE UNIQUE INDEX IF NOT EXISTS ${ASSESSMENT_DATA_VERSION_INDEX_NAME} ON AssessmentDataVersion(assessment_id, version_number);`
    );
  }

  for (const [tableName, indexName, indexColumns] of TENANT_OWNED_TABLE_MIGRATIONS) {
    if (!tableNames.has(tableName)) continue;
    addTenantColumn(tableName);
  }

  for (const migration of TENANT_SCOPED_PRIMARY_KEY_MIGRATIONS) {
    const { tableName, legacyKey, columns, columnNames } = migration;
    if (!tableNames.has(tableName)) continue;
    const currentKey = primaryKeyColumns(tableName);
    const scopedKey = ['tenant_id', legacyKey];
    if (currentKey.join(',') === scopedKey.join(',')) continue;
    if (currentKey.length !== 1 || currentKey[0] !== legacyKey) {
      throw new Error(`Cannot safely migrate ${tableName}: unexpected primary key (${currentKey.join(', ') || 'none'}).`);
    }
    const temporaryName = `__D1_MIGRATION_${tableName}_TENANT_KEY`;
    statements.push(
      `CREATE TABLE ${temporaryName} (${columns}, PRIMARY KEY (tenant_id, ${legacyKey}));`,
      `INSERT INTO ${temporaryName} (${columnNames}) SELECT ${columnNames} FROM ${tableName};`,
      `DROP TABLE ${tableName};`,
      `ALTER TABLE ${temporaryName} RENAME TO ${tableName};`
    );
    migratedTables.add(tableName);
  }

  for (const [tableName, indexName, indexColumns] of TENANT_OWNED_TABLE_MIGRATIONS) {
    if (tableNames.has(tableName) && indexName && (!indexesByName.has(indexName) || migratedTables.has(tableName))) {
      statements.push(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${indexColumns});`);
    }
  }

  for (const indexName of LEGACY_INDEXES_TO_DROP) {
    if (indexesByName.has(indexName)) statements.push(`DROP INDEX IF EXISTS ${indexName};`);
  }

  if (userExists && !normalizedIndex) {
    statements.push('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_normalized ON User(lower(email));');
  }
  if (userExists && legacyEmailIndexExists) statements.push('DROP INDEX IF EXISTS idx_user_email;');

  if (statements.length > 0) executeSqlCommand(statements.join('\n'), false);

  return {
    metadataQueries,
    writeCommands: statements.length > 0 ? 1 : 0,
    statements: statements.length,
    migratedTables: migratedTables.size
  };
};

module.exports = { applyD1CompatibilityMigrations, buildMigrationInventorySql };
