import { describe, it, expect } from 'vitest';
import * as mockData from '../../src/data/mockData';

describe('mockData module', () => {
  it('should export all required mock datasets', () => {
    expect(mockData.mockTenant).toBeDefined();
    expect(mockData.mockTenant.tenant_id).toBe('TNT-GLOBAL-8902');

    expect(mockData.initialIngestionQueue).toBeInstanceOf(Array);
    expect(mockData.initialIngestionQueue.length).toBeGreaterThanOrEqual(0);

    expect(mockData.initialValidationRecords).toBeInstanceOf(Array);
    expect(mockData.initialValidationRecords.length).toBeGreaterThanOrEqual(0);

    expect(mockData.mockSpendCategories).toBeInstanceOf(Array);
    expect(mockData.mockSpendCategories.length).toBeGreaterThanOrEqual(0);

    expect(mockData.mockCategoryYearDetails).toBeInstanceOf(Array);
    expect(mockData.mockCategoryYearDetails.length).toBeGreaterThanOrEqual(0);

    expect(mockData.mockVendorYearDetails).toBeInstanceOf(Array);
    expect(mockData.mockVendorYearDetails.length).toBeGreaterThanOrEqual(0);

    expect(mockData.mockVendorPriceRanks).toBeInstanceOf(Array);
    expect(mockData.mockVendorPriceRanks.length).toBeGreaterThanOrEqual(0);

    expect(mockData.mockSavingsOpportunities).toBeInstanceOf(Array);
    expect(mockData.mockSavingsOpportunities.length).toBeGreaterThanOrEqual(0);

    expect(mockData.mockConversionFunnel).toBeInstanceOf(Array);
    expect(mockData.mockConversionFunnel.length).toBeGreaterThanOrEqual(0);

    expect(mockData.schemaEntities).toBeInstanceOf(Array);
    expect(mockData.schemaEntities.length).toBeGreaterThanOrEqual(0);
  });
});
