import type { DatabaseSync } from 'node:sqlite';

const TEST_TENANT_IDS = [
  'T1', 'T2', 'T3', 'T4',
  'C-LIFECYCLE',
  'TENANT-2', 'TENANT-A', 'TENANT-B',
  'TNT-1', 'TNT-2', 'TNT-9', 'TNT-GLOBAL-8902', 'TNT-OTHER', 'TNT-TEST', 'TNT-UPLOAD-1',
  'tenant-id'
] as const;

export const seedTestTenantRegistry = (db: DatabaseSync): void => {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?)'
  );
  for (const tenantId of TEST_TENANT_IDS) insert.run(tenantId, `Test fixture ${tenantId}`);
};
