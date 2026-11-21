import { describe, it, expect } from 'vitest';
import type { ZodError } from 'zod';
import {
  consolidatedSavingsQuerySchema,
  updateOpportunityCommercialApprovalSchema
} from '../../src/constants/module2SavingsDeduplicationValidation';

const issueMessages = (error: ZodError): string[] => error.issues.map((issue) => issue.message);

describe('Module 2 Savings Deduplication Validation (constants/module2SavingsDeduplicationValidation.ts)', () => {
  describe('consolidatedSavingsQuerySchema', () => {
    it('should default refresh and allowUnverifiedIncremental to false when omitted', () => {
      const result = consolidatedSavingsQuerySchema.safeParse({ assessmentId: 'AIC-1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ assessmentId: 'AIC-1', refresh: false, allowUnverifiedIncremental: false });
      }
    });

    it('should transform the string "true" to a boolean true for both flags', () => {
      const result = consolidatedSavingsQuerySchema.safeParse({
        assessmentId: 'AIC-1',
        refresh: 'true',
        allowUnverifiedIncremental: 'true'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refresh).toBe(true);
        expect(result.data.allowUnverifiedIncremental).toBe(true);
      }
    });

    it('should treat any other flag text as false', () => {
      const result = consolidatedSavingsQuerySchema.safeParse({
        assessmentId: 'AIC-1',
        refresh: 'yes',
        allowUnverifiedIncremental: 'TRUE'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refresh).toBe(false);
        expect(result.data.allowUnverifiedIncremental).toBe(false);
      }
    });

    it('should accept documentId without assessmentId', () => {
      const result = consolidatedSavingsQuerySchema.safeParse({ documentId: 'DOC-123' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ documentId: 'DOC-123', refresh: false, allowUnverifiedIncremental: false });
      }
    });

    it('should allow empty payload with defaulted boolean flags', () => {
      const empty = consolidatedSavingsQuerySchema.safeParse({});
      expect(empty.success).toBe(true);
      if (empty.success) {
        expect(empty.data.refresh).toBe(false);
        expect(empty.data.allowUnverifiedIncremental).toBe(false);
      }
    });
  });

  describe('updateOpportunityCommercialApprovalSchema', () => {
    const approval = {
      assessmentId: 'AIC-1',
      opportunityId: 'OPP-1',
      approvalStatus: 'APPROVED',
      approvedSavingsInr: 250000,
      approverComments: 'Approved by finance'
    };

    it('should accept a complete approval and a minimal pending review', () => {
      expect(updateOpportunityCommercialApprovalSchema.safeParse(approval).success).toBe(true);
      expect(
        updateOpportunityCommercialApprovalSchema.safeParse({
          assessmentId: 'AIC-1',
          opportunityId: 'OPP-1',
          approvalStatus: 'PENDING_REVIEW'
        }).success
      ).toBe(true);
    });

    it('should reject unknown approval statuses and negative approved savings', () => {
      expect(updateOpportunityCommercialApprovalSchema.safeParse({ ...approval, approvalStatus: 'REJECTED' }).success).toBe(
        false
      );
      expect(updateOpportunityCommercialApprovalSchema.safeParse({ ...approval, approvedSavingsInr: -1 }).success).toBe(false);
    });

    it('should reject blank assessment and opportunity identifiers with specific messages', () => {
      const noAssessment = updateOpportunityCommercialApprovalSchema.safeParse({ ...approval, assessmentId: '' });
      expect(noAssessment.success).toBe(false);
      if (!noAssessment.success) {
        expect(issueMessages(noAssessment.error)).toContain('Assessment identifier is required');
      }

      const noOpportunity = updateOpportunityCommercialApprovalSchema.safeParse({ ...approval, opportunityId: '' });
      expect(noOpportunity.success).toBe(false);
      if (!noOpportunity.success) {
        expect(issueMessages(noOpportunity.error)).toContain('Opportunity identifier is required');
      }
    });
  });
});
