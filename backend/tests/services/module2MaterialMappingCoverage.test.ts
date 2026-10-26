import { describe, it, expect } from 'vitest';
import {
  extractMappingUpdate,
  calculateMappingCoverage
} from '../../src/services/module2MaterialMappingCoverage';
import type { MaterialMappingEntry, UpdateMaterialMappingPayload } from '../../src/types/module2MaterialMapping';

describe('module2MaterialMappingCoverage', () => {
  describe('extractMappingUpdate', () => {
    it('handles string payload with object extra and assessmentIdParam', () => {
      const extra: Partial<MaterialMappingEntry> = {
        unspsc_code: '41112614',
        reviewStatus: 'TAXONOMY_VERIFIED',
        reviewedBy: 'Auditor1',
        auditNotes: 'Verified against catalog'
      };

      const result = extractMappingUpdate('MAT_001', extra, 'ASM_100');

      expect(result.sourceMaterialId).toBe('MAT_001');
      expect(result.unspscCode).toBe('41112614');
      expect(result.reviewStatus).toBe('TAXONOMY_VERIFIED');
      expect(result.reviewedBy).toBe('Auditor1');
      expect(result.auditNotes).toBe('Verified against catalog');
      expect(result.assessmentId).toBe('ASM_100');
      expect(result.extra).toBe(extra);
    });

    it('falls back to assignedUnspscCode and default reviewStatus CLIENT_APPROVED', () => {
      const extra: Partial<MaterialMappingEntry> = {
        assignedUnspscCode: '24112403'
      };

      const result = extractMappingUpdate('MAT_002', extra);

      expect(result.sourceMaterialId).toBe('MAT_002');
      expect(result.unspscCode).toBe('24112403');
      expect(result.reviewStatus).toBe('CLIENT_APPROVED');
      expect(result.assessmentId).toBeUndefined();
    });

    it('extracts assessmentId from partialOrAssessmentId when it is a string', () => {
      const result = extractMappingUpdate('MAT_003', 'ASM_200');

      expect(result.sourceMaterialId).toBe('MAT_003');
      expect(result.unspscCode).toBe('');
      expect(result.reviewStatus).toBe('CLIENT_APPROVED');
      expect(result.assessmentId).toBe('ASM_200');
      expect(result.extra).toEqual({});
    });

    it('handles object payload (UpdateMaterialMappingPayload) without assessmentId', () => {
      const payload: UpdateMaterialMappingPayload = {
        sourceMaterialId: 'MAT_004',
        unspscCode: '31162300',
        reviewStatus: 'PROVISIONAL',
        reviewedBy: 'ReviewerB',
        auditNotes: 'Pending supplier specs'
      };

      const result = extractMappingUpdate(payload);

      expect(result.sourceMaterialId).toBe('MAT_004');
      expect(result.unspscCode).toBe('31162300');
      expect(result.reviewStatus).toBe('PROVISIONAL');
      expect(result.reviewedBy).toBe('ReviewerB');
      expect(result.auditNotes).toBe('Pending supplier specs');
      expect(result.assessmentId).toBeUndefined();
      expect(result.extra).toEqual({});
    });

    it('handles object payload with assessmentId passed as string in second parameter', () => {
      const payload: UpdateMaterialMappingPayload = {
        sourceMaterialId: 'MAT_005',
        unspscCode: '50101500',
        reviewStatus: 'APPROVED',
        reviewedBy: 'ManagerC'
      };

      const result = extractMappingUpdate(payload, 'ASM_300');

      expect(result.sourceMaterialId).toBe('MAT_005');
      expect(result.unspscCode).toBe('50101500');
      expect(result.reviewStatus).toBe('APPROVED');
      expect(result.assessmentId).toBe('ASM_300');
    });
  });

  describe('calculateMappingCoverage', () => {
    it('returns zero summary for an empty register', () => {
      const summary = calculateMappingCoverage([]);

      expect(summary.totalMaterialsCount).toBe(0);
      expect(summary.totalSpendInr).toBe(0);
      expect(summary.totalSpendCr).toBe(0);
      expect(summary.workflowCoveragePct).toBe(0);
      expect(summary.clientApprovedCount).toBe(0);
      expect(summary.taxonomyVerifiedCount).toBe(0);
      expect(summary.approvedCount).toBe(0);
      expect(summary.provisionalCount).toBe(0);
      expect(summary.awaitingReviewCount).toBe(0);
    });

    it('correctly aggregates counts and spend across all review status categories', () => {
      const register: MaterialMappingEntry[] = [
        {
          sourceMaterialId: 'M1',
          sourceDescription: 'Item 1',
          sourceCategory: 'Cat A',
          assignedUnspscCode: '10000000',
          assignedFamily: 'Family A',
          assignedClass: 'Class A',
          assignedCommodity: 'Commodity A',
          confidenceScore: 0.95,
          totalSpendInr: 10000000, // 1 Cr
          transactionCount: 5,
          suppliersCount: 2,
          suppliersList: ['Sup1', 'Sup2'],
          reviewStatus: 'CLIENT_APPROVED',
          taxonomyVersion: 'UNv260801'
        },
        {
          sourceMaterialId: 'M2',
          sourceDescription: 'Item 2',
          sourceCategory: 'Cat B',
          assignedUnspscCode: '20000000',
          assignedFamily: 'Family B',
          assignedClass: 'Class B',
          assignedCommodity: 'Commodity B',
          confidenceScore: 0.85,
          totalSpendInr: 20000000, // 2 Cr
          transactionCount: 10,
          suppliersCount: 1,
          suppliersList: ['Sup1'],
          reviewStatus: 'TAXONOMY_VERIFIED',
          taxonomyVersion: 'UNv260801'
        },
        {
          sourceMaterialId: 'M3',
          sourceDescription: 'Item 3',
          sourceCategory: 'Cat C',
          assignedUnspscCode: '30000000',
          assignedFamily: 'Family C',
          assignedClass: 'Class C',
          assignedCommodity: 'Commodity C',
          confidenceScore: 0.88,
          totalSpendInr: 5000000, // 0.5 Cr
          transactionCount: 2,
          suppliersCount: 1,
          suppliersList: ['Sup2'],
          reviewStatus: 'APPROVED',
          taxonomyVersion: 'UNv260801'
        },
        {
          sourceMaterialId: 'M4',
          sourceDescription: 'Item 4',
          sourceCategory: 'Cat D',
          assignedUnspscCode: '40000000',
          assignedFamily: 'Family D',
          assignedClass: 'Class D',
          assignedCommodity: 'Commodity D',
          confidenceScore: 0.7,
          totalSpendInr: 10000000, // 1 Cr
          transactionCount: 4,
          suppliersCount: 1,
          suppliersList: ['Sup3'],
          reviewStatus: 'PROVISIONAL',
          taxonomyVersion: 'UNv260801'
        },
        {
          sourceMaterialId: 'M5',
          sourceDescription: 'Item 5',
          sourceCategory: 'Cat E',
          assignedUnspscCode: '50000000',
          assignedFamily: 'Family E',
          assignedClass: 'Class E',
          assignedCommodity: 'Commodity E',
          confidenceScore: 0.5,
          totalSpendInr: 5000000, // 0.5 Cr
          transactionCount: 1,
          suppliersCount: 1,
          suppliersList: ['Sup4'],
          reviewStatus: 'AWAITING_REVIEW',
          taxonomyVersion: 'UNv260801'
        }
      ];

      const summary = calculateMappingCoverage(register);

      expect(summary.totalMaterialsCount).toBe(5);
      expect(summary.totalSpendInr).toBe(50000000);
      expect(summary.totalSpendCr).toBe(5.0);
      expect(summary.workflowCoveragePct).toBe(100.0);

      // Client Approved: 1 item, 1 Cr, 20%, 20%
      expect(summary.clientApprovedCount).toBe(1);
      expect(summary.clientApprovedSpendInr).toBe(10000000);
      expect(summary.clientApprovedSpendCr).toBe(1.0);
      expect(summary.clientApprovedMaterialPct).toBe(20.0);
      expect(summary.clientApprovedSpendPct).toBe(20.0);

      // Taxonomy Verified + Approved: M2 (2 Cr) + M3 (0.5 Cr) = 2 items, 2.5 Cr (50% spend, 40% count)
      expect(summary.taxonomyVerifiedCount).toBe(2);
      expect(summary.taxonomyVerifiedSpendInr).toBe(25000000);
      expect(summary.taxonomyVerifiedSpendCr).toBe(2.5);
      expect(summary.taxonomyVerifiedMaterialPct).toBe(40.0);
      expect(summary.taxonomyVerifiedSpendPct).toBe(50.0);

      // Provisional: 1 item, 1 Cr, 20% count, 20% spend
      expect(summary.provisionalCount).toBe(1);
      expect(summary.provisionalSpendInr).toBe(10000000);
      expect(summary.provisionalSpendCr).toBe(1.0);
      expect(summary.provisionalMaterialPct).toBe(20.0);
      expect(summary.provisionalSpendPct).toBe(20.0);

      // Awaiting Review: 1 item, 0.5 Cr, 20% count, 10% spend
      expect(summary.awaitingReviewCount).toBe(1);
      expect(summary.awaitingReviewSpendInr).toBe(5000000);
      expect(summary.awaitingReviewSpendCr).toBe(0.5);
      expect(summary.awaitingReviewMaterialPct).toBe(20.0);
      expect(summary.awaitingReviewSpendPct).toBe(10.0);
    });
  });
});
