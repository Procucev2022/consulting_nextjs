const INTERNAL_TABLE_NAMES = new Set(['D1SeedFileLedger']);
const TENANT_REFERENCE_TABLES = Object.freeze([
  'AssessmentRecord',
  'CategoryYearDetail',
  'ConversionFunnelPhase',
  'CustomerRecord',
  'DatasetMetricSummary',
  'LineItemMapping',
  'Module1CurrencyBreakdown',
  'Module1MonthlySpend',
  'ObjectMetadata',
  'OrchestrationAcknowledgement',
  'OrchestrationAuditEvent',
  'OrchestrationCorrectionRequest',
  'OrchestrationNotification',
  'ProcurementTransaction',
  'RawDocumentIngestion',
  'R2ObjectCleanupOutbox',
  'SpendCategorySummary',
  'SubscriptionAuditEvent',
  'SubscriptionRecord',
  'ValidationPreCheckRecord',
  'VendorPriceRank',
  'VendorYearDetail'
]);
const TENANT_SCOPED_PRIMARY_KEYS = Object.freeze({
  VendorPriceRank: ['tenant_id', 'master_id'],
  ConversionFunnelPhase: ['tenant_id', 'phase_num'],
  DatasetMetricSummary: ['tenant_id', 'metric_key'],
  Module1MonthlySpend: ['tenant_id', 'month_key'],
  Module1CurrencyBreakdown: ['tenant_id', 'currency']
});
const tenantReferenceTriggerNames = TENANT_REFERENCE_TABLES.flatMap((tableName) => {
  const normalizedTableName = tableName.replace(/([a-z0-9])([A-Z])/gu, '$1_$2').toLowerCase();
  return [
    `trg_tenant_integrity_${normalizedTableName}_insert`,
    `trg_tenant_integrity_${normalizedTableName}_update`
  ];
});
const TENANT_INTEGRITY_TRIGGER_NAMES = Object.freeze([
  ...tenantReferenceTriggerNames,
  'trg_tenant_master_identity_immutable',
  'trg_tenant_master_soft_delete_only',
  'trg_subscription_customer_tenant_match',
  'trg_subscription_update_customer_tenant_match',
  'trg_user_requires_tenant_on_active_insert',
  'trg_user_requires_tenant_on_active_update'
]);

const compactSql = (sql) => String(sql).trim().replace(/\s+/gu, '/**/');

const buildTableCountSql = (tableNames) => {
  if (!Array.isArray(tableNames) || tableNames.length === 0) {
    throw new Error('D1 drift count query requires at least one table');
  }
  const statements = tableNames.map((tableName) => {
    if (typeof tableName !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/u.test(tableName)) {
      throw new Error('D1 drift manifest contains an invalid table name');
    }
    return `SELECT '${tableName}' AS table_name, COUNT(*) AS row_count FROM ${tableName}`;
  });
  return compactSql(statements.join(' UNION ALL '));
};

const getSchemaTablesSql = () => compactSql(
  "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT GLOB '_cf_*' ORDER BY name"
);

const getSeedLedgerSql = () => compactSql(
  'SELECT seed_file, source_checksum FROM D1SeedFileLedger ORDER BY seed_file'
);

const getDuplicateTransactionKeysSql = () => compactSql(`
  SELECT COUNT(*) AS duplicate_key_groups FROM (
    SELECT tenant_id, assessment_id, source_document_id, source_row_number
    FROM ProcurementTransaction
    WHERE assessment_id IS NOT NULL
      AND source_document_id IS NOT NULL
      AND source_row_number IS NOT NULL
    GROUP BY tenant_id, assessment_id, source_document_id, source_row_number
    HAVING COUNT(*) > 1
  )
`);

const getAssessmentDataVersionIntegritySql = () => compactSql(`
  SELECT 'duplicate_assessment_data_version_groups' AS check_name, COUNT(*) AS violation_count
  FROM (
    SELECT assessment_id, version_number
    FROM AssessmentDataVersion
    GROUP BY assessment_id, version_number
    HAVING COUNT(*) > 1
  )
  UNION ALL
  SELECT 'assessment_data_version_index_invalid' AS check_name,
    CASE WHEN EXISTS (
      SELECT 1 FROM sqlite_schema
      WHERE type = 'index' AND name = 'idx_data_version_assessment_number'
        AND lower(replace(replace(replace(replace(sql, char(32), ''), char(9), ''), char(10), ''), char(13), '')) =
          'createuniqueindexidx_data_version_assessment_numberonassessmentdataversion(assessment_id,version_number)'
    ) THEN 0 ELSE 1 END AS violation_count
`);

const getUserIntegritySql = () => compactSql(`
  SELECT 'duplicate_user_email_groups' AS check_name, COUNT(*) AS violation_count
  FROM (
    SELECT lower(email) AS normalized_email
    FROM User
    GROUP BY lower(email)
    HAVING COUNT(*) > 1
  )
  UNION ALL
  SELECT 'normalized_user_email_index_invalid' AS check_name,
    CASE WHEN EXISTS (
      SELECT 1 FROM sqlite_schema
      WHERE type = 'index' AND name = 'idx_user_email_normalized'
        AND lower(replace(replace(replace(replace(sql, char(32), ''), char(9), ''), char(10), ''), char(13), '')) =
          'createuniqueindexidx_user_email_normalizedonuser(lower(email))'
    ) THEN 0 ELSE 1 END AS violation_count
`);

const buildTenantOrphanValues = (tableNames) => {
  if (!Array.isArray(tableNames) || tableNames.length === 0) {
    throw new Error('D1 tenant orphan query requires at least one table');
  }
  return tableNames.map((tableName) => {
    if (typeof tableName !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/u.test(tableName)) {
      throw new Error('D1 tenant orphan query contains an invalid table name');
    }
    const checkName = tableName === 'ProcurementTransaction'
      ? 'transaction_tenant_orphans'
      : `tenant_id_orphans_${tableName}`;
    return `('${checkName}', (SELECT COUNT(*) FROM ${tableName} AS scoped WHERE NOT EXISTS (SELECT 1 FROM TenantMaster AS tenant WHERE tenant.tenant_id = scoped.tenant_id)))`;
  });
};

const buildTenantOrphanSql = (tableNames) => compactSql(`
  WITH tenant_orphan_checks(check_name, violation_count) AS (
    VALUES ${buildTenantOrphanValues(tableNames).join(', ')}
  )
  SELECT check_name, violation_count FROM tenant_orphan_checks
`);

const getOrphanReferenceSql = () => {
  const values = [
    ...buildTenantOrphanValues(TENANT_REFERENCE_TABLES),
    `('transaction_assessment_orphans', (SELECT COUNT(*) FROM ProcurementTransaction AS tx WHERE tx.assessment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM AssessmentRecord AS assessment WHERE assessment.assessment_id = tx.assessment_id)))`,
    `('assessment_customer_orphans', (SELECT COUNT(*) FROM AssessmentRecord AS assessment WHERE NOT EXISTS (SELECT 1 FROM CustomerRecord AS customer WHERE customer.customer_id = assessment.customer_id)))`
  ];
  return compactSql(`
    WITH orphan_checks(check_name, violation_count) AS (VALUES ${values.join(', ')})
    SELECT check_name, violation_count FROM orphan_checks
  `);
};

const getTenantScopedPrimaryKeySql = () => compactSql(Object.keys(TENANT_SCOPED_PRIMARY_KEYS)
  .map((tableName) => `SELECT '${tableName}' AS table_name, name AS column_name, pk AS position FROM pragma_table_info('${tableName}')`)
  .join(' UNION ALL '));

const getTenantIntegrityTriggerSql = () => compactSql(`
  SELECT name AS trigger_name
  FROM sqlite_schema
  WHERE type = 'trigger'
    AND name IN (${TENANT_INTEGRITY_TRIGGER_NAMES.map((name) => `'${name}'`).join(', ')})
  ORDER BY name
`);

const compareD1Drift = ({
  expectedTables = [],
  actualTables = [],
  expectedCounts = {},
  actualCounts = [],
  expectedSeedChecksums = {},
  actualSeedLedgerRows = [],
  duplicateKeyGroups = 0,
  duplicateAssessmentDataVersionGroups = 0,
  assessmentDataVersionIndexValid = true,
  duplicateUserEmailGroups = 0,
  normalizedUserEmailIndexValid = false,
  orphanCounts = {},
  foreignKeyViolations = 0,
  tenantPrimaryKeyRows = [],
  tenantIntegrityTriggerNames = []
} = {}) => {
  const expectedTableSet = new Set(expectedTables);
  const actualTableSet = new Set(actualTables);
  const missingTables = [...expectedTableSet].filter((tableName) => !actualTableSet.has(tableName)).sort();
  const extraTables = [...actualTableSet].filter((tableName) => !expectedTableSet.has(tableName)).sort();
  const countByTable = new Map(actualCounts.map((row) => [row.table_name, Number(row.row_count)]));
  const rowCountMismatches = [...expectedTableSet]
    .filter((tableName) => !INTERNAL_TABLE_NAMES.has(tableName) && countByTable.has(tableName))
    .filter((tableName) => Number(expectedCounts[tableName]) !== countByTable.get(tableName))
    .sort()
    .map((tableName) => ({
      tableName,
      expected: Number(expectedCounts[tableName]),
      actual: countByTable.get(tableName)
    }));

  const expectedLedgerFiles = expectedSeedChecksums;
  const actualLedger = new Map(actualSeedLedgerRows.map((row) => [row.seed_file, row.source_checksum]));
  const missingSeedFiles = Object.keys(expectedLedgerFiles)
    .filter((fileName) => !actualLedger.has(fileName)).sort();
  const seedChecksumMismatches = Object.entries(expectedLedgerFiles)
    .filter(([fileName, checksum]) => actualLedger.has(fileName) && actualLedger.get(fileName) !== checksum)
    .map(([fileName]) => fileName).sort();
  const unexpectedSeedFiles = [...actualLedger.keys()]
    .filter((fileName) => !Object.hasOwn(expectedLedgerFiles, fileName)).sort();

  const normalizedOrphanCounts = Object.fromEntries(
    Object.entries(orphanCounts).sort(([left], [right]) => left.localeCompare(right))
      .map(([checkName, count]) => [checkName, Number(count)])
  );
  const duplicateTransactionKeyGroups = Number(duplicateKeyGroups);
  const duplicateAssessmentDataVersionGroupCount = Number(duplicateAssessmentDataVersionGroups);
  const caseFoldedUserEmailGroups = Number(duplicateUserEmailGroups);
  const foreignKeyViolationCount = Number(foreignKeyViolations);
  const tenantPrimaryKeysByTable = new Map();
  for (const row of tenantPrimaryKeyRows) {
    if (!tenantPrimaryKeysByTable.has(row.table_name)) tenantPrimaryKeysByTable.set(row.table_name, []);
    if (Number(row.position) > 0) {
      tenantPrimaryKeysByTable.get(row.table_name).push({
        columnName: row.column_name,
        position: Number(row.position)
      });
    }
  }
  const tenantPrimaryKeyMismatches = Object.entries(TENANT_SCOPED_PRIMARY_KEYS)
    .map(([tableName, expectedColumns]) => {
      const actualColumns = (tenantPrimaryKeysByTable.get(tableName) || [])
        .sort((left, right) => left.position - right.position)
        .map(({ columnName }) => columnName);
      return actualColumns.join(',') === expectedColumns.join(',')
        ? null
        : { tableName, expected: expectedColumns, actual: actualColumns };
    })
    .filter(Boolean);
  const actualTenantIntegrityTriggerNames = new Set(tenantIntegrityTriggerNames);
  const missingTenantIntegrityTriggers = TENANT_INTEGRITY_TRIGGER_NAMES
    .filter((name) => !actualTenantIntegrityTriggerNames.has(name));
  const hasOrphans = Object.values(normalizedOrphanCounts).some((count) => count > 0);
  const ok = missingTables.length === 0 && extraTables.length === 0 && rowCountMismatches.length === 0 &&
    missingSeedFiles.length === 0 && seedChecksumMismatches.length === 0 && unexpectedSeedFiles.length === 0 &&
    duplicateTransactionKeyGroups === 0 && duplicateAssessmentDataVersionGroupCount === 0 &&
    assessmentDataVersionIndexValid && caseFoldedUserEmailGroups === 0 && normalizedUserEmailIndexValid &&
    !hasOrphans && foreignKeyViolationCount === 0 && tenantPrimaryKeyMismatches.length === 0 &&
    missingTenantIntegrityTriggers.length === 0;

  return {
    ok,
    missingTables,
    extraTables,
    rowCountMismatches,
    seedLedger: { missingFiles: missingSeedFiles, checksumMismatches: seedChecksumMismatches, unexpectedFiles: unexpectedSeedFiles },
    duplicateTransactionKeyGroups,
    duplicateAssessmentDataVersionGroups: duplicateAssessmentDataVersionGroupCount,
    assessmentDataVersionIndexValid: Boolean(assessmentDataVersionIndexValid),
    duplicateUserEmailGroups: caseFoldedUserEmailGroups,
    normalizedUserEmailIndexValid: Boolean(normalizedUserEmailIndexValid),
    orphanCounts: normalizedOrphanCounts,
    foreignKeyViolations: foreignKeyViolationCount,
    tenantPrimaryKeyMismatches,
    missingTenantIntegrityTriggers
  };
};

module.exports = {
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
  getOrphanReferenceSql,
  getTenantScopedPrimaryKeySql,
  getTenantIntegrityTriggerSql,
  compareD1Drift
};
