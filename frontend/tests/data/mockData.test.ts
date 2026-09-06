import { describe, it, expect } from 'vitest';
import * as mockData from '../../src/data/mockData';

describe('mockData module', () => {
  it('should export all required mock datasets', () => {
    expect(mockData.mockTenant).toBeDefined();
    expect(mockData.mockTenant.tenant_id).toBe('TNT-GLOBAL-8902');

    expect(mockData.initialIngestionQueue).toBeInstanceOf(Array);
    expect(mockData.initialIngestionQueue.length).toBeGreaterThan(0);

    expect(mockData.initialValidationRecords).toBeInstanceOf(Array);
    expect(mockData.initialValidationRecords.length).toBeGreaterThan(0);

    expect(mockData.mockSpendCategories).toBeInstanceOf(Array);
    expect(mockData.mockSpendCategories.length).toBeGreaterThan(0);

    expect(mockData.mockCategoryYearDetails).toBeInstanceOf(Array);
    expect(mockData.mockCategoryYearDetails.length).toBeGreaterThan(0);

    expect(mockData.mockVendorYearDetails).toBeInstanceOf(Array);
    expect(mockData.mockVendorYearDetails.length).toBeGreaterThan(0);

    expect(mockData.mockVendorPriceRanks).toBeInstanceOf(Array);
    expect(mockData.mockVendorPriceRanks.length).toBeGreaterThan(0);

    expect(mockData.mockSavingsOpportunities).toBeInstanceOf(Array);
    expect(mockData.mockSavingsOpportunities.length).toBeGreaterThan(0);

    expect(mockData.mockConversionFunnel).toBeInstanceOf(Array);
    expect(mockData.mockConversionFunnel.length).toBeGreaterThan(0);

    expect(mockData.schemaEntities).toBeInstanceOf(Array);
    expect(mockData.schemaEntities.length).toBeGreaterThan(0);
  });
});
