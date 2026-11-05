import { describe, expect, it } from 'vitest';
import { readExpectedProductionBinding, verifyProductionD1Binding } from '../../scripts/verify-production-d1';

const validConfig = {
  env: { prod: { d1_databases: [{ binding: 'DB', database_name: 'consulting-db', database_id: 'prod-id' }] } }
};

describe('production D1 deployment preflight', () => {
  it('extracts and verifies the exact configured database name and ID', () => {
    expect(readExpectedProductionBinding(validConfig)).toEqual({ id: 'prod-id', name: 'consulting-db' });
    expect(verifyProductionD1Binding(validConfig, [{ uuid: 'prod-id', name: 'consulting-db' }]))
      .toEqual({ id: 'prod-id', name: 'consulting-db' });
  });

  it.each([
    { databases: [{ uuid: 'other-id', name: 'consulting-db' }] },
    { databases: [{ uuid: 'prod-id', name: 'other-db' }] },
    { databases: [] }
  ])('refuses a Cloudflare inventory without the exact production binding', ({ databases }) => {
    expect(() => verifyProductionD1Binding(validConfig, databases)).toThrow(/not present/u);
  });

  it.each([
    {},
    { env: { prod: { d1_databases: [] } } },
    { env: { prod: { d1_databases: [{ binding: 'DB', database_name: '', database_id: 'prod-id' }] } } },
    { env: { prod: { d1_databases: [{ binding: 'DB', database_name: 'consulting-db', database_id: '' }] } } }
  ])('refuses an incomplete Wrangler production configuration', (config) => {
    expect(() => readExpectedProductionBinding(config)).toThrow(/production D1 binding|database name and ID/iu);
  });

  it('rejects a non-array Cloudflare inventory', () => {
    expect(() => verifyProductionD1Binding(validConfig, null)).toThrow(/not a JSON array/u);
  });
});
