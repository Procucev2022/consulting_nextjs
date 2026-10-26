import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import {
  Module2MaterialMappingRegister,
  getStrategicTransactionMaterialId
} from '../../src/services/module2MaterialMappingRegister';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

describe('Module2MaterialMappingRegister', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStrategicTransactionMaterialId', () => {
    it('resolves correct material identifier across all fallback scenarios', () => {
      const tx1: StrategicInputTransaction = {
        id: '1', material_code: 'MAT-9901', material_desc: 'Laboratory Beaker',
        vendor_code: 'V01', vendor_name: 'Vendor A', total_spend_inr: 50000
      };
      const tx2: StrategicInputTransaction = {
        id: '2', material_code: '', material_desc: 'Raw Chemical Solution',
        vendor_code: 'V02', vendor_name: 'Vendor B', total_spend_inr: 25000
      };
      const tx3: StrategicInputTransaction = {
        id: 'TX-777', material_code: undefined, material_desc: undefined,
        vendor_code: 'V03', vendor_name: 'Vendor C', total_spend_inr: 10000
      };
      const tx4 = { total_spend_inr: 5000 } as unknown as StrategicInputTransaction;

      expect(getStrategicTransactionMaterialId(tx1)).toBe('MAT-9901');
      expect(getStrategicTransactionMaterialId(tx2)).toBe('UNCODED_Raw Chemical Solution');
      expect(getStrategicTransactionMaterialId(tx3)).toBe('TX_TX-777');
      expect(getStrategicTransactionMaterialId(tx4)).toBe('TX_UNKNOWN');
    });
  });

  describe('classifyMaterials', () => {
    it('handles empty transaction list gracefully', () => {
      const result = Module2MaterialMappingRegister.classifyMaterials([]);
      expect(result.register).toHaveLength(0);
      expect(result.coverage.totalMaterialsCount).toBe(0);
      expect(result.exceptions).toHaveLength(0);
      expect(result.materialCodeToMapping.size).toBe(0);
    });

    it('classifies exact 8-digit UNSPSC code (Tier 1b)', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: '10',
          material_code: 'M-EXACT-01',
          material_desc: 'Borosilicate Glass Tube 100ml',
          spend_category: 'Labware',
          vendor_code: 'V_SUPP_1',
          vendor_name: 'Alpha Lab Supplies',
          unspsc_code: '41112614',
          unspsc_commodity: 'Borosilicate Glassware',
          total_spend_inr: 2500000
        }
      ];

      const result = Module2MaterialMappingRegister.classifyMaterials(txs);
      expect(result.register).toHaveLength(1);
      const entry = result.register[0];
      expect(entry.assignedUnspscCode).toBe('41112614');
      expect(entry.mappingMethod).toBe('EXACT_IDENTIFIER');
      expect(entry.reviewStatus).toBe('TAXONOMY_VERIFIED');
      expect(entry.confidenceScore).toBe(98);
      expect(result.materialCodeToMapping.get('M-EXACT-01')).toBeDefined();
    });

    it('classifies description match via verified taxonomy rules (Tier 2, score >= 95)', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: '11',
          material_code: 'M-HSD-02',
          material_desc: 'high speed diesel for power generators',
          spend_category: 'Fuel',
          vendor_code: 'V_FUEL_1',
          vendor_name: 'Indian Oil Corp',
          total_spend_inr: 1500000
        }
      ];

      const result = Module2MaterialMappingRegister.classifyMaterials(txs);
      expect(result.register).toHaveLength(1);
      const entry = result.register[0];
      expect(entry.mappingMethod).toBe('MATERIAL_DESCRIPTION_MATCH');
      expect(entry.confidenceScore).toBeGreaterThanOrEqual(95);
      expect(entry.reviewStatus).toBe('TAXONOMY_VERIFIED');
    });

    it('classifies description match with provisional status when score < 95', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: '11b',
          material_code: 'M-CARTON-03',
          material_desc: 'Packaging Carton Box',
          spend_category: 'Packaging',
          vendor_code: 'V_PACK_1',
          vendor_name: 'Box Makers',
          total_spend_inr: 500000
        }
      ];

      const result = Module2MaterialMappingRegister.classifyMaterials(txs);
      expect(result.register).toHaveLength(1);
      const entry = result.register[0];
      expect(entry.mappingMethod).toBe('MATERIAL_DESCRIPTION_MATCH');
      expect(entry.confidenceScore).toBeLessThan(95);
      expect(entry.reviewStatus).toBe('PROVISIONAL');
    });

    it('flags unclassified materials for manual review (Tier 4)', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: '12',
          material_code: 'M-UNMATCHED-99',
          material_desc: 'XYZ-OBSCURE-UNLISTED-PROPRIETARY-PART',
          spend_category: 'Miscellaneous',
          vendor_code: 'V_SPEC_1',
          vendor_name: 'Specialist Co',
          total_spend_inr: 800000
        }
      ];

      const result = Module2MaterialMappingRegister.classifyMaterials(txs);
      expect(result.register).toHaveLength(1);
      const entry = result.register[0];
      expect(entry.mappingMethod).toBe('MANUAL_REVIEW_REQUIRED');
      expect(entry.reviewStatus).toBe('AWAITING_REVIEW');
      expect(entry.confidenceScore).toBe(0);
      expect(result.exceptions).toHaveLength(1);
      expect(result.exceptions[0].sourceMaterialId).toBe('M-UNMATCHED-99');
    });

    it('aggregates multiple transactions for the same material code', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: '20',
          material_code: 'M-COMMON-01',
          material_desc: 'Standard Pipette',
          vendor_code: 'V1',
          total_spend_inr: 100000
        },
        {
          id: '21',
          material_code: 'M-COMMON-01',
          material_desc: 'Standard Pipette',
          vendor_code: 'V2',
          total_spend_inr: 200000
        }
      ];

      const result = Module2MaterialMappingRegister.classifyMaterials(txs);
      expect(result.register).toHaveLength(1);
      const entry = result.register[0];
      expect(entry.transactionCount).toBe(2);
      expect(entry.totalSpendInr).toBe(300000);
      expect(entry.qualifyingSuppliersCount).toBe(2);
    });
  });

  describe('updateMapping and getMapping', () => {
    it('updates and retrieves mapping with assessmentId scope', () => {
      const updated = Module2MaterialMappingRegister.updateMapping(
        'MAT-CUSTOM-001',
        {
          unspsc_code: '41121805',
          reviewStatus: 'CLIENT_APPROVED',
          reviewedBy: 'ChiefEngineer',
          auditNotes: 'Verified against plant blueprint'
        },
        'ASSESSMENT_BOROSIL_01'
      );

      expect(updated.sourceMaterialId).toBe('MAT-CUSTOM-001');
      expect(updated.assignedUnspscCode).toBe('41121805');
      expect(updated.reviewStatus).toBe('CLIENT_APPROVED');
      expect(updated.reviewedBy).toBe('ChiefEngineer');

      const retrieved = Module2MaterialMappingRegister.getMapping('MAT-CUSTOM-001', 'ASSESSMENT_BOROSIL_01');
      expect(retrieved).toBeDefined();
      expect(retrieved?.assignedUnspscCode).toBe('41121805');
    });

    it('updates mapping using UpdateMaterialMappingPayload object', () => {
      const updated = Module2MaterialMappingRegister.updateMapping({
        sourceMaterialId: 'MAT-PAYLOAD-002',
        unspscCode: '24112403',
        reviewStatus: 'APPROVED',
        reviewedBy: 'ProcurementDirector'
      });

      expect(updated.sourceMaterialId).toBe('MAT-PAYLOAD-002');
      expect(updated.assignedUnspscCode).toBe('24112403');
      expect(updated.reviewedBy).toBe('ProcurementDirector');

      const retrieved = Module2MaterialMappingRegister.getMapping('MAT-PAYLOAD-002');
      expect(retrieved).toBeDefined();
      expect(retrieved?.sourceMaterialId).toBe('MAT-PAYLOAD-002');
    });

    it('uses persisted client approved mapping during classifyMaterials (Tier 1)', () => {
      Module2MaterialMappingRegister.updateMapping(
        'MAT-TIER1-003',
        {
          unspsc_code: '41112614',
          reviewStatus: 'CLIENT_APPROVED',
          reviewedBy: 'Auditor'
        },
        'ASSESSMENT_TIER1_TEST'
      );

      const txs: StrategicInputTransaction[] = [
        { id: '50', material_code: 'MAT-TIER1-003', material_desc: 'Custom Tube', total_spend_inr: 500000 }
      ];

      const result = Module2MaterialMappingRegister.classifyMaterials(txs, 'ASSESSMENT_TIER1_TEST');
      expect(result.register).toHaveLength(1);
      expect(result.register[0].reviewStatus).toBe('CLIENT_APPROVED');
      expect(result.register[0].assignedUnspscCode).toBe('41112614');
    });

    it('uses persisted APPROVED mapping during classifyMaterials (Tier 1)', () => {
      Module2MaterialMappingRegister.updateMapping('MAT-TIER1-APP', {
        unspsc_code: '41112614',
        reviewStatus: 'APPROVED'
      });
      const txs: StrategicInputTransaction[] = [
        { id: '51', material_code: 'MAT-TIER1-APP', total_spend_inr: 100000 }
      ];
      const result = Module2MaterialMappingRegister.classifyMaterials(txs);
      expect(result.register[0].reviewStatus).toBe('TAXONOMY_VERIFIED');
    });

    it('falls back to unspsc_category and default title when commodity missing', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: '52',
          material_code: 'MAT-FALLBACK-01',
          unspsc_code: '12345678',
          unspsc_category: 'Category Fallback',
          total_spend_inr: 50000
        }
      ];
      const result = Module2MaterialMappingRegister.classifyMaterials(txs);
      expect(result.register[0].assignedUnspscTitle).toBe('Category Fallback');
    });

    it('ignores 00000000 code and returns undefined for unknown scoped getMapping', () => {
      const txs: StrategicInputTransaction[] = [
        { id: '53', material_code: 'MAT-ZERO-01', unspsc_code: '00000000', total_spend_inr: 10000 }
      ];
      const result = Module2MaterialMappingRegister.classifyMaterials(txs);
      expect(result.register[0].reviewStatus).toBe('AWAITING_REVIEW');
      expect(Module2MaterialMappingRegister.getMapping('NON_EXISTENT_MAT', 'ASSESSMENT_X')).toBeUndefined();
    });

    it('sets reviewStatus to PROVISIONAL for rule with confidence < 95 and handles TX_UNKNOWN fallback', () => {
      const txs: StrategicInputTransaction[] = [
        { material_desc: 'Packaging Carton Box', total_spend_inr: 5000 } as unknown as StrategicInputTransaction
      ];
      const result = Module2MaterialMappingRegister.classifyMaterials(txs);
      expect(result.register[0].reviewStatus).toBe('PROVISIONAL');
      expect(getStrategicTransactionMaterialId({} as unknown as StrategicInputTransaction)).toBe('TX_UNKNOWN');
    });

    it('gracefully handles initialize and persistStore filesystem errors', () => {
      (Module2MaterialMappingRegister as unknown as { isInitialized: boolean }).isInitialized = false;
      vi.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
      vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
        throw new Error('Read error');
      });
      expect(() => Module2MaterialMappingRegister.initialize()).not.toThrow();

      vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {
        throw new Error('Disk full');
      });
      expect(() => Module2MaterialMappingRegister.persistStore()).not.toThrow();
    });
  });
});
