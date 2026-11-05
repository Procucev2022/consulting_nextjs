import { describe, it, expect } from 'vitest';
import type { ZodError } from 'zod';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createAssessmentSchema,
  updateNdaStatusSchema,
  updateDataStatusSchema,
  updateAssessmentStatusSchema,
  uploadDataVersionSchema,
  validateAssessmentDatasetSchema,
  ASSESSMENT_DATA_VERSION_ALLOWED_EXTENSIONS,
  ASSESSMENT_DATA_VERSION_MAX_BYTES,
  ASSESSMENT_DATA_VERSION_MAX_BASE64_LENGTH,
  ASSESSMENT_DATA_VERSION_JSON_MAX_BYTES,
  analystApprovalSchema,
  deliverPackageSchema,
  assessmentDeliverySchema,
  assessmentAcceptanceSchema,
  assessmentReviewGateUpdateSchema
} from '../../src/constants/assessmentValidation';

const issueMessages = (error: ZodError): string[] => error.issues.map((issue) => issue.message);

describe('Assessment Validation Schemas (constants/assessmentValidation.ts)', () => {
  describe('createCustomerSchema', () => {
    const validCustomer = { customerName: 'Acme Industries', industry: 'Manufacturing' };

    it('should accept a minimal customer and blank optional contact fields', () => {
      expect(createCustomerSchema.safeParse(validCustomer).success).toBe(true);
      expect(createCustomerSchema.safeParse({ ...validCustomer, contactEmail: '', companyWebsite: '' }).success).toBe(true);
      expect(
        createCustomerSchema.safeParse({ ...validCustomer, contactEmail: 'buyer@acme.test', companyWebsite: 'https://acme.test' })
          .success
      ).toBe(true);
    });

    it('should reject short names, missing industries, and malformed emails with specific messages', () => {
      const shortName = createCustomerSchema.safeParse({ customerName: 'A', industry: 'Manufacturing' });
      expect(shortName.success).toBe(false);
      if (!shortName.success) {
        expect(issueMessages(shortName.error)).toContain('Customer name must be at least 2 characters');
      }

      const noIndustry = createCustomerSchema.safeParse({ customerName: 'Acme', industry: 'M' });
      expect(noIndustry.success).toBe(false);
      if (!noIndustry.success) {
        expect(issueMessages(noIndustry.error)).toContain('Industry is required');
      }

      const badEmail = createCustomerSchema.safeParse({ ...validCustomer, contactEmail: 'not-an-email' });
      expect(badEmail.success).toBe(false);
      if (!badEmail.success) {
        expect(issueMessages(badEmail.error)).toContain('Invalid email');
      }
    });
  });

  describe('updateCustomerSchema', () => {
    it('should accept an empty update and every listed status', () => {
      expect(updateCustomerSchema.safeParse({}).success).toBe(true);
      expect(updateCustomerSchema.safeParse({ status: 'ARCHIVED' }).success).toBe(true);
      expect(updateCustomerSchema.safeParse({ status: 'ONBOARDING' }).success).toBe(true);
    });

    it('should reject an unknown status, a short name, and a malformed email', () => {
      expect(updateCustomerSchema.safeParse({ status: 'DELETED' }).success).toBe(false);
      expect(updateCustomerSchema.safeParse({ customerName: 'A' }).success).toBe(false);
      expect(updateCustomerSchema.safeParse({ contactEmail: 'bad-email' }).success).toBe(false);
    });
  });

  describe('createAssessmentSchema', () => {
    const baseAssessment = {
      customerName: 'Acme Industries',
      industry: 'Manufacturing',
      assessmentPeriodStart: '2025-04-01',
      assessmentPeriodEnd: '2026-03-31'
    };

    it('should apply analyst, currency, NDA, and test-data defaults', () => {
      const result = createAssessmentSchema.safeParse(baseAssessment);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          assignedAnalyst: 'analyst@procucev.com',
          currency: 'INR',
          ndaStatus: 'PENDING',
          isTestData: false
        });
      }
    });

    it('should accept NOT_REQUIRED NDA status and an explicit analyst email', () => {
      const result = createAssessmentSchema.safeParse({
        ...baseAssessment,
        ndaStatus: 'NOT_REQUIRED',
        assignedAnalyst: 'lead@procucev.com'
      });
      expect(result.success).toBe(true);
    });

    it('should reject short periods, an invalid analyst email, and an unknown NDA status', () => {
      const shortPeriod = createAssessmentSchema.safeParse({ ...baseAssessment, assessmentPeriodStart: '202' });
      expect(shortPeriod.success).toBe(false);
      if (!shortPeriod.success) {
        expect(issueMessages(shortPeriod.error)).toContain('Assessment period start is required');
      }

      const badAnalyst = createAssessmentSchema.safeParse({ ...baseAssessment, assignedAnalyst: 'not-email' });
      expect(badAnalyst.success).toBe(false);
      if (!badAnalyst.success) {
        expect(issueMessages(badAnalyst.error)).toContain('Assigned analyst must be a valid email');
      }

      expect(createAssessmentSchema.safeParse({ ...baseAssessment, ndaStatus: 'REJECTED' }).success).toBe(false);
    });
  });

  describe('updateNdaStatusSchema', () => {
    it('should accept each NDA status with optional notes', () => {
      expect(updateNdaStatusSchema.safeParse({ ndaStatus: 'SIGNED' }).success).toBe(true);
      expect(updateNdaStatusSchema.safeParse({ ndaStatus: 'PENDING', notes: 'Awaiting signature' }).success).toBe(true);
    });

    it('should reject a missing or unknown NDA status', () => {
      expect(updateNdaStatusSchema.safeParse({}).success).toBe(false);
      expect(updateNdaStatusSchema.safeParse({ ndaStatus: 'VOID' }).success).toBe(false);
    });
  });

  describe('updateDataStatusSchema', () => {
    it('should accept listed data statuses and reject unknown ones', () => {
      expect(updateDataStatusSchema.safeParse({ dataStatus: 'VALIDATED' }).success).toBe(true);
      expect(updateDataStatusSchema.safeParse({ dataStatus: 'REQUIRES_CLARIFICATION', notes: 'Missing FX' }).success).toBe(true);
      expect(updateDataStatusSchema.safeParse({ dataStatus: 'PENDING' }).success).toBe(false);
    });
  });

  describe('updateAssessmentStatusSchema', () => {
    it('should accept a listed lifecycle status with an optional reason', () => {
      expect(updateAssessmentStatusSchema.safeParse({ status: 'PCBI_REVIEW', reason: 'Benchmark check' }).success).toBe(true);
      expect(updateAssessmentStatusSchema.safeParse({ status: 'CLOSED' }).success).toBe(true);
    });

    it('should reject an unknown lifecycle status or a missing one', () => {
      expect(updateAssessmentStatusSchema.safeParse({ status: 'UNKNOWN_STATE' }).success).toBe(false);
      expect(updateAssessmentStatusSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('uploadDataVersionSchema', () => {
    const upload = { fileName: 'spend.xlsx', fileSize: 1024, checksum: 'abcdef123456' };

    it('should apply record count, file path, and immediate-analysis defaults', () => {
      const result = uploadDataVersionSchema.safeParse(upload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({ recordCount: 0, filePath: '', runAnalysisImmediately: false });
      }
    });

    it('should reject a blank file name, non-positive size, short checksum, and negative record count', () => {
      const blankName = uploadDataVersionSchema.safeParse({ ...upload, fileName: '' });
      expect(blankName.success).toBe(false);
      if (!blankName.success) {
        expect(issueMessages(blankName.error)).toContain('File name is required');
      }

      const zeroSize = uploadDataVersionSchema.safeParse({ ...upload, fileSize: 0 });
      expect(zeroSize.success).toBe(false);
      if (!zeroSize.success) {
        expect(issueMessages(zeroSize.error)).toContain('File size must be positive');
      }

      const shortChecksum = uploadDataVersionSchema.safeParse({ ...upload, checksum: 'abc' });
      expect(shortChecksum.success).toBe(false);
      if (!shortChecksum.success) {
        expect(issueMessages(shortChecksum.error)).toContain('Valid checksum is required');
      }

      expect(uploadDataVersionSchema.safeParse({ ...upload, recordCount: -1 }).success).toBe(false);
    });
  });

  describe('validateAssessmentDatasetSchema and upload bounds', () => {
    it('accepts an omitted or supplied data version and defines the supported file boundary', () => {
      expect(validateAssessmentDatasetSchema.parse({})).toEqual({});
      expect(validateAssessmentDatasetSchema.parse({ dataVersionId: 'DV-1' })).toEqual({ dataVersionId: 'DV-1' });
      expect(validateAssessmentDatasetSchema.safeParse({ dataVersionId: '' }).success).toBe(false);
      expect(ASSESSMENT_DATA_VERSION_MAX_BYTES).toBe(100 * 1024 * 1024);
      expect(ASSESSMENT_DATA_VERSION_MAX_BASE64_LENGTH).toBe(Math.ceil(ASSESSMENT_DATA_VERSION_MAX_BYTES / 3) * 4);
      expect(ASSESSMENT_DATA_VERSION_JSON_MAX_BYTES).toBeGreaterThan(ASSESSMENT_DATA_VERSION_MAX_BASE64_LENGTH);
      expect(ASSESSMENT_DATA_VERSION_ALLOWED_EXTENSIONS).toEqual(['.xlsx', '.xls', '.csv']);
    });
  });

  describe('analystApprovalSchema', () => {
    it('should accept a comment of at least five characters', () => {
      expect(analystApprovalSchema.safeParse({ approvalComment: 'Approved after review' }).success).toBe(true);
    });

    it('should reject a short approval comment with its specific message', () => {
      const result = analystApprovalSchema.safeParse({ approvalComment: 'ok' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(issueMessages(result.error)).toContain('Approval comment must be at least 5 characters');
      }
    });
  });

  describe('deliverPackageSchema', () => {
    it('should default test delivery to false for a valid recipient', () => {
      const result = deliverPackageSchema.safeParse({ deliveredToEmail: 'client@acme.test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isTestDelivery).toBe(false);
      }
    });

    it('should reject a malformed recipient email with its specific message', () => {
      const result = deliverPackageSchema.safeParse({ deliveredToEmail: 'nobody' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(issueMessages(result.error)).toContain('Valid recipient email required');
      }
    });
  });

  describe('assessmentDeliverySchema', () => {
    it('accepts the frontend recipient shape and the legacy delivered-to shape', () => {
      expect(assessmentDeliverySchema.parse({ recipientEmail: 'client@acme.test', deliveryChannel: 'PORTAL' }))
        .toMatchObject({ recipientEmail: 'client@acme.test', deliveryChannel: 'PORTAL', isTestDelivery: false });
      expect(assessmentDeliverySchema.parse({ deliveredToEmail: 'buyer@acme.test', deliveryNotes: 'Release' }))
        .toMatchObject({ deliveredToEmail: 'buyer@acme.test', deliveryNotes: 'Release' });
    });

    it('rejects missing recipients, invalid email addresses, and unsupported channels', () => {
      expect(assessmentDeliverySchema.safeParse({}).success).toBe(false);
      expect(assessmentDeliverySchema.safeParse({ recipientEmail: 'invalid' }).success).toBe(false);
      expect(assessmentDeliverySchema.safeParse({ recipientEmail: 'client@acme.test', deliveryChannel: 'CHAT' }).success)
        .toBe(false);
    });
  });

  describe('assessmentAcceptanceSchema', () => {
    it('accepts an empty body and optional customer acknowledgement details', () => {
      expect(assessmentAcceptanceSchema.parse({})).toEqual({});
      expect(assessmentAcceptanceSchema.parse({ acceptedBy: 'buyer@acme.test', acceptanceComment: 'Reviewed' }))
        .toEqual({ acceptedBy: 'buyer@acme.test', acceptanceComment: 'Reviewed' });
    });

    it('rejects invalid customer email and overlong acknowledgement comments', () => {
      expect(assessmentAcceptanceSchema.safeParse({ acceptedBy: 'invalid' }).success).toBe(false);
      expect(assessmentAcceptanceSchema.safeParse({ acceptanceComment: 'x'.repeat(2001) }).success).toBe(false);
    });
  });

  describe('assessmentReviewGateUpdateSchema', () => {
    it('accepts pending, passed-with-evidence, and blocked-with-reason reviews', () => {
      expect(assessmentReviewGateUpdateSchema.safeParse({ gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'PENDING' }).success)
        .toBe(true);
      expect(assessmentReviewGateUpdateSchema.safeParse({
        gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'PASSED', evidenceReference: 'D1:DV-1'
      }).success).toBe(true);
      expect(assessmentReviewGateUpdateSchema.safeParse({
        gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'BLOCKED', reviewNote: 'Source data needs review'
      }).success).toBe(true);
    });

    it('rejects unknown gates, unsupported status, missing evidence, missing blocker note, and oversized fields', () => {
      expect(assessmentReviewGateUpdateSchema.safeParse({ gateKey: 'UNKNOWN', status: 'PENDING' }).success).toBe(false);
      expect(assessmentReviewGateUpdateSchema.safeParse({ gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'DONE' }).success)
        .toBe(false);
      expect(assessmentReviewGateUpdateSchema.safeParse({ gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'PASSED' }).success)
        .toBe(false);
      expect(assessmentReviewGateUpdateSchema.safeParse({ gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'BLOCKED' }).success)
        .toBe(false);
      expect(assessmentReviewGateUpdateSchema.safeParse({
        gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'PASSED', evidenceReference: 'x'.repeat(513)
      }).success).toBe(false);
    });
  });
});
