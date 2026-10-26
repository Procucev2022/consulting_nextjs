import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { Module2SpecificationRationalisationMatcher } from '../../src/services/module2SpecificationRationalisationMatcher';
import { Module2SpecificationRationalisationEngine } from '../../src/services/module2SpecificationRationalisationEngine';
import { Module2SpecificationRationalisationExcelBuilder } from '../../src/services/module2SpecificationRationalisationExcelBuilder';
import { Module2SpecificationRationalisationController } from '../../src/controllers/module2SpecificationRationalisation.controller';
import {
  SPECIFICATION_REVIEW_STATUSES,
  SPECIFICATION_IDENTIFICATION_TYPES,
  SPECIFICATION_FINANCIAL_DISCLOSURES,
  SPECIFICATION_EXCEL_SHEETS
} from '../../src/constants/module2SpecificationRationalisation';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';

describe('Module 2 — Lever 8: Specification Rationalisation (Phase 1)', () => {
  beforeAll(async () => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    await Module2SpecificationRationalisationEngine.calculateSpecificationRationalisation('AIC-2026-0002');
  }, 180000);

  describe('1. Normalisation and Token Matching', () => {
    it('normalises descriptions by standardising units, symbols, and whitespace', () => {
      const raw = '  Stainless   Steel  304   10  MMS   100  KILOGRAMS  ';
      const norm = Module2SpecificationRationalisationMatcher.normalizeDescription(raw);
      expect(norm).toBe('stainless steel 304 10 mm 100 kg');
    });

    it('handles empty or null string gracefully in normalizeDescription', () => {
      expect(Module2SpecificationRationalisationMatcher.normalizeDescription('')).toBe('');
      expect(Module2SpecificationRationalisationMatcher.normalizeDescription(null as unknown as string)).toBe('');
    });

    it('computes token similarity accurately for exact, partial, and disjoint strings', () => {
      const str1 = 'bearing 6205 zz skf';
      const str2 = 'bearing 6205 2rs fag';
      const sim = Module2SpecificationRationalisationMatcher.computeTokenSimilarity(str1, str2);
      expect(sim).toBeGreaterThan(0.2);
      expect(sim).toBeLessThan(1.0);

      expect(Module2SpecificationRationalisationMatcher.computeTokenSimilarity('bolt hex m10', 'bolt hex m10')).toBe(1.0);
      expect(Module2SpecificationRationalisationMatcher.computeTokenSimilarity('', 'bolt hex')).toBe(0);
      expect(Module2SpecificationRationalisationMatcher.computeTokenSimilarity('alpha beta', 'gamma delta')).toBe(0);
    });
  });

  describe('2. Technical Attribute Extraction and Comparison Matrix', () => {
    it('extracts dimensions, weights, grades, and ratings accurately', () => {
      const desc = 'SS304 HEX BOLT 12MM GRADE A2 DIN933 50BAR 150GSM';
      const attrs = Module2SpecificationRationalisationMatcher.extractTechnicalAttributes(desc);
      expect(attrs.dimension).toBe('12mm');
      expect(attrs.materialGrade).toBe('ss304');
      expect(attrs.rating).toBe('50bar');
      expect(attrs.weightDensity).toBe('150gsm');
    });

    it('identifies identical and conflicting technical attributes', () => {
      const attrsA = { dimension: '10mm', materialGrade: 'ss304', rating: '100bar' };
      const attrsB = { dimension: '12mm', materialGrade: 'ss304' };

      const { comparisons, differences, missingFields } =
        Module2SpecificationRationalisationMatcher.compareAttributes(attrsA, attrsB);

      expect(differences.some((d) => d.includes('Dimensions / Sizing variance'))).toBe(true);
      expect(comparisons.find((c) => c.attributeName === 'Material Grade / Spec')?.matchStatus).toBe('MATCH');
      expect(missingFields.some((m) => m.includes('Technical Rating / Tolerance present in primary'))).toBe(true);
    });

    it('flags data gaps when attributes are missing on source or candidate', () => {
      const attrsA = { rating: '50bar' };
      const attrsB = { dimension: '10mm' };

      const { comparisons, missingFields } =
        Module2SpecificationRationalisationMatcher.compareAttributes(attrsA, attrsB);

      expect(comparisons.find((c) => c.attributeName === 'Dimensions / Sizing')?.matchStatus).toBe('SOURCE_MISSING');
      expect(comparisons.find((c) => c.attributeName === 'Technical Rating / Tolerance')?.matchStatus).toBe('CANDIDATE_MISSING');
      expect(comparisons.find((c) => c.attributeName === 'Weight / Density / Gauge')?.matchStatus).toBe('BOTH_MISSING');
      expect(missingFields.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('3. Identification Types and Prevention of Automated Approval', () => {
    const baseItemA = {
      code: 'MAT-101',
      description: 'POLYESTER YARN 150D/48F DTY',
      normalizedDescription: 'polyester yarn 150d 48f dty',
      plant: 'Plant 1',
      department: 'Spinning',
      totalSpendInr: 500000,
      totalQuantity: 1000,
      uom: 'kg',
      transactionCount: 5,
      suppliersCount: 2
    };

    const baseItemB = {
      code: 'MAT-101',
      description: 'POLYESTER YARN 150 DENIER DTY WHITE',
      normalizedDescription: 'polyester yarn 150 d dty white',
      plant: 'Plant 1',
      department: 'Spinning',
      totalSpendInr: 300000,
      totalQuantity: 600,
      uom: 'kg',
      transactionCount: 3,
      suppliersCount: 1
    };

    it('identifies duplicate code with differing text', () => {
      const result = Module2SpecificationRationalisationMatcher.determineIdentificationType(baseItemA, baseItemB, ['color variance']);
      expect(result.type).toBe(SPECIFICATION_IDENTIFICATION_TYPES.DUPLICATE_CODE);
      expect(result.reviewStatus).toBe(SPECIFICATION_REVIEW_STATUSES.AWAITING_TECHNICAL_REVIEW);
      expect(result.reviewStatus).not.toBe(SPECIFICATION_REVIEW_STATUSES.TECHNICALLY_VERIFIED);
    });

    it('identifies cross-plant variation when plants differ', () => {
      const itemPlantB = { ...baseItemB, code: 'MAT-102', plant: 'Plant 2' };
      const result = Module2SpecificationRationalisationMatcher.determineIdentificationType(baseItemA, itemPlantB, []);
      expect(result.type).toBe(SPECIFICATION_IDENTIFICATION_TYPES.CROSS_PLANT_VARIATION);
      expect(result.reviewStatus).toBe(SPECIFICATION_REVIEW_STATUSES.AWAITING_TECHNICAL_REVIEW);
    });

    it('identifies equivalent specification when extracted attributes have no differences', () => {
      const itemDifferentCode = { ...baseItemB, code: 'MAT-102', plant: 'Plant 1' };
      const result = Module2SpecificationRationalisationMatcher.determineIdentificationType(baseItemA, itemDifferentCode, []);
      expect(result.type).toBe(SPECIFICATION_IDENTIFICATION_TYPES.EQUIVALENT_SPECIFICATION);
      expect(result.reviewStatus).toBe(SPECIFICATION_REVIEW_STATUSES.AWAITING_TECHNICAL_REVIEW);
    });

    it('identifies similar description with differences as POTENTIAL_MATCH', () => {
      const itemDifferentCode = { ...baseItemB, code: 'MAT-102', plant: 'Plant 1' };
      const result = Module2SpecificationRationalisationMatcher.determineIdentificationType(baseItemA, itemDifferentCode, ['Dimension variance']);
      expect(result.type).toBe(SPECIFICATION_IDENTIFICATION_TYPES.SIMILAR_DESCRIPTION);
      expect(result.reviewStatus).toBe(SPECIFICATION_REVIEW_STATUSES.POTENTIAL_MATCH);
    });
  });

  describe('4. Engine Execution, Financial Governance & Reconciliation', () => {
    it('executes specification rationalisation for Borosil Ltd (AIC-2026-0002)', async () => {
      const res = await Module2SpecificationRationalisationEngine.calculateSpecificationRationalisation('AIC-2026-0002');
      expect(res.assessmentId).toBe('AIC-2026-0002');
      expect(res.customerName).toBe('Borosil Ltd');
      expect(res.candidates.length).toBeGreaterThan(0);

      // Financial Governance Assertions
      expect(res.summary.financialBenefitStatus).toBe(SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS);
      expect(res.summary.commercialSavingsQuantifiedInr).toBe(0);
      expect(res.summary.commercialSavingsQuantifiedCr).toBe(0);

      // Verify expenditure under review is positive and arithmetically derived
      expect(res.summary.totalExpenditureUnderReviewInr).toBeGreaterThan(0);
      expect(res.summary.totalExpenditureUnderReviewCr).toBeGreaterThan(0);

      // Check status summary counts reconcile
      const { summary, candidates } = res;
      const computedAwaiting = candidates.filter((c) => c.reviewStatus === 'AWAITING_TECHNICAL_REVIEW').length;
      const computedVerified = candidates.filter((c) => c.reviewStatus === 'TECHNICALLY_VERIFIED').length;
      const computedRejected = candidates.filter((c) => c.reviewStatus === 'REJECTED').length;
      const computedPotential = candidates.filter((c) => c.reviewStatus === 'POTENTIAL_MATCH').length;

      expect(summary.awaitingTechnicalReviewCount).toBe(computedAwaiting);
      expect(summary.technicallyVerifiedCount).toBe(computedVerified);
      expect(summary.rejectedCount).toBe(computedRejected);
      expect(summary.potentialMatchCount).toBe(computedPotential);
      expect(
        summary.awaitingTechnicalReviewCount +
          summary.technicallyVerifiedCount +
          summary.rejectedCount +
          summary.potentialMatchCount
      ).toBe(summary.totalCandidatesIdentifiedCount);
    });

    it('resolves fallback customer name for unknown assessment IDs', async () => {
      vi.spyOn(Module2CanonicalService, 'getCanonicalTransactions').mockResolvedValueOnce([]);
      const res = await Module2SpecificationRationalisationEngine.calculateSpecificationRationalisation('CUSTOM-TENANT-999');
      expect(res.customerName).toBe('Enterprise Client (CUSTOM-TENANT-999)');
      expect(res.candidates).toEqual([]);
      expect(res.summary.totalCandidatesIdentifiedCount).toBe(0);
    });

    it('applies technical review overrides and updates nextRequiredAction accordingly', async () => {
      const candidateId = 'SPEC-RAT-RawMater-1';
      const options = {
        reviews: {
          [candidateId]: {
            reviewId: 'REV-001',
            reviewerName: 'Chief Metallurgist',
            reviewerRole: 'Quality Lead',
            reviewDate: '2026-10-19',
            status: SPECIFICATION_REVIEW_STATUSES.TECHNICALLY_VERIFIED,
            technicalJustification: 'Approved standard ASTM grade 304 interchangeability'
          }
        }
      };

      const res = await Module2SpecificationRationalisationEngine.calculateSpecificationRationalisation('AIC-2026-0002', options);
      const reviewed = res.candidates.find((c) => c.candidateId === candidateId);
      if (reviewed) {
        expect(reviewed.reviewStatus).toBe(SPECIFICATION_REVIEW_STATUSES.TECHNICALLY_VERIFIED);
        expect(reviewed.nextRequiredAction).toContain('Technical equivalence approved');
        expect(res.summary.technicallyVerifiedCount).toBeGreaterThanOrEqual(1);
      }
    });

    it('handles rejected candidate override correctly', async () => {
      const candidateId = 'SPEC-RAT-RawMater-1';
      const options = {
        reviews: {
          [candidateId]: {
            reviewId: 'REV-002',
            reviewerName: 'Engineering Reviewer',
            reviewDate: '2026-10-19',
            status: SPECIFICATION_REVIEW_STATUSES.REJECTED,
            technicalJustification: 'Rejected due to thermal variation',
            rejectionReason: 'Thermal limits exceeded'
          }
        }
      };

      const res = await Module2SpecificationRationalisationEngine.calculateSpecificationRationalisation('AIC-2026-0002', options);
      const reviewed = res.candidates.find((c) => c.candidateId === candidateId);
      if (reviewed) {
        expect(reviewed.reviewStatus).toBe(SPECIFICATION_REVIEW_STATUSES.REJECTED);
        expect(reviewed.nextRequiredAction).toContain('Candidate rejected by technical reviewer');
      }
    });
  });

  describe('5. Excel Workbook Generation & Reconciliation', () => {
    it('builds an authoritative 6-sheet Excel workbook with matching metrics', async () => {
      const res = await Module2SpecificationRationalisationEngine.calculateSpecificationRationalisation('AIC-2026-0002');
      const buffer = Module2SpecificationRationalisationExcelBuilder.buildWorkbook(res);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);

      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain(SPECIFICATION_EXCEL_SHEETS.SHEET_1_EXECUTIVE);
      expect(workbook.SheetNames).toContain(SPECIFICATION_EXCEL_SHEETS.SHEET_2_CANDIDATES);
      expect(workbook.SheetNames).toContain(SPECIFICATION_EXCEL_SHEETS.SHEET_3_ATTRIBUTES);
      expect(workbook.SheetNames).toContain(SPECIFICATION_EXCEL_SHEETS.SHEET_4_DATA_GAPS);
      expect(workbook.SheetNames).toContain(SPECIFICATION_EXCEL_SHEETS.SHEET_5_REVIEW_HISTORY);
      expect(workbook.SheetNames).toContain(SPECIFICATION_EXCEL_SHEETS.SHEET_6_METHODOLOGY);

      const execSheet = workbook.Sheets[SPECIFICATION_EXCEL_SHEETS.SHEET_1_EXECUTIVE];
      const execData = XLSX.utils.sheet_to_json<string[]>(execSheet, { header: 1 });
      const disclaimerRow = execData.find((row) => row[0] === 'Financial Benefit Status');
      expect(disclaimerRow?.[1]).toBe(SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS);
    });
  });

  describe('6. Controller Endpoints and Validation', () => {
    beforeAll(() => {
      Module2SpecificationRationalisationController.clearReviews();
    });

    it('handles GET /specification-rationalisation with 200 response', async () => {
      const req = {
        query: { assessmentId: 'AIC-2026-0002' }
      } as unknown as Request;

      let statusCode = 0;
      let jsonPayload: unknown = null;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (payload: unknown) => {
              jsonPayload = payload;
            }
          };
        }
      } as unknown as Response;

      await Module2SpecificationRationalisationController.getSpecificationRationalisation(req, res);
      expect(statusCode).toBe(200);
      expect((jsonPayload as { success: boolean }).success).toBe(true);
    });

    it('rejects invalid query parameters on GET with HTTP 400', async () => {
      const req = {
        query: { similarityThreshold: 5.0 } // Exceeds max 1.0
      } as unknown as Request;

      let statusCode = 0;
      let jsonPayload: unknown = null;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (payload: unknown) => {
              jsonPayload = payload;
            }
          };
        }
      } as unknown as Response;

      await Module2SpecificationRationalisationController.getSpecificationRationalisation(req, res);
      expect(statusCode).toBe(400);
      expect((jsonPayload as { success: boolean }).success).toBe(false);
    });

    it('records technical review via POST /specification-rationalisation/review', async () => {
      const req = {
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId: 'SPEC-RAT-RawMater-1',
          status: 'TECHNICALLY_VERIFIED',
          reviewerName: 'Dr. Tech Reviewer',
          technicalJustification: 'Validated mechanical tolerances'
        }
      } as unknown as Request;

      let statusCode = 0;
      let jsonPayload: unknown = null;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (payload: unknown) => {
              jsonPayload = payload;
            }
          };
        }
      } as unknown as Response;

      await Module2SpecificationRationalisationController.submitTechnicalReview(req, res);
      expect(statusCode).toBe(200);
      expect((jsonPayload as { success: boolean }).success).toBe(true);

      const cached = Module2SpecificationRationalisationController.getReviewsForAssessment('AIC-2026-0002');
      expect(cached['SPEC-RAT-RawMater-1']?.[0]?.status).toBe('TECHNICALLY_VERIFIED');
    });

    it('rejects review with status REJECTED when rejectionReason is missing', async () => {
      const req = {
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId: 'SPEC-RAT-RawMater-1',
          status: 'REJECTED',
          reviewerName: 'Lead Engineer',
          technicalJustification: 'Incompatible grade tolerances'
          // Missing rejectionReason
        }
      } as unknown as Request;

      let statusCode = 0;
      let jsonPayload: unknown = null;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (payload: unknown) => {
              jsonPayload = payload;
            }
          };
        }
      } as unknown as Response;

      await Module2SpecificationRationalisationController.submitTechnicalReview(req, res);
      expect(statusCode).toBe(400);
      expect((jsonPayload as { success: boolean }).success).toBe(false);
    });

    it('appends multiple reviews to history without silently overwriting', async () => {
      const candidateId = 'SPEC-RAT-Multi-1';
      Module2SpecificationRationalisationController.setReviewForAssessment('AIC-2026-0002', {
        candidateId,
        reviewId: 'REV-001',
        reviewerName: 'First Reviewer',
        reviewDate: '2026-10-18',
        status: 'AWAITING_TECHNICAL_REVIEW',
        technicalJustification: 'Needs metallurgical lab test'
      });
      Module2SpecificationRationalisationController.setReviewForAssessment('AIC-2026-0002', {
        candidateId,
        reviewId: 'REV-002',
        reviewerName: 'Senior Metallurgist',
        reviewDate: '2026-10-19',
        status: 'TECHNICALLY_VERIFIED',
        technicalJustification: 'Lab test approved equivalence'
      });

      const cached = Module2SpecificationRationalisationController.getReviewsForAssessment('AIC-2026-0002');
      const history = cached[candidateId];
      expect(history).toBeDefined();
      expect(history.length).toBe(2);
      expect(history[0].reviewerName).toBe('First Reviewer');
      expect(history[1].reviewerName).toBe('Senior Metallurgist');
      expect(history[1].status).toBe('TECHNICALLY_VERIFIED');
    });

    it('rejects invalid review payload on POST with HTTP 400', async () => {
      const req = {
        body: {
          // Missing mandatory fields: candidateId, reviewerName, technicalJustification
          status: 'INVALID_STATUS'
        }
      } as unknown as Request;

      let statusCode = 0;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return { json: vi.fn() };
        }
      } as unknown as Response;

      await Module2SpecificationRationalisationController.submitTechnicalReview(req, res);
      expect(statusCode).toBe(400);
    });

    it('exports Excel file via GET /export-excel', async () => {
      const req = {
        query: { assessmentId: 'AIC-2026-0002' }
      } as unknown as Request;

      let statusCode = 0;
      let sentBuffer: Buffer | null = null;
      const headers: Record<string, string> = {};
      const res = {
        status: (code: number) => {
          statusCode = code;
          return {
            send: (buf: Buffer) => {
              sentBuffer = buf;
            }
          };
        },
        setHeader: (name: string, value: string) => {
          headers[name] = value;
        }
      } as unknown as Response;

      await Module2SpecificationRationalisationController.exportExcel(req, res);
      expect(statusCode).toBe(200);
      expect(sentBuffer).toBeDefined();
      expect(headers['Content-Type']).toContain('spreadsheetml.sheet');
    });

    it('handles export Excel validation failure with HTTP 400', async () => {
      const req = {
        query: { similarityThreshold: 10.0 }
      } as unknown as Request;

      let statusCode = 0;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return { json: vi.fn() };
        }
      } as unknown as Response;

      await Module2SpecificationRationalisationController.exportExcel(req, res);
      expect(statusCode).toBe(400);
    });

    it('handles unexpected calculation failure with HTTP 500', async () => {
      vi.spyOn(Module2SpecificationRationalisationEngine, 'calculateSpecificationRationalisation')
        .mockRejectedValueOnce(new Error('Simulated database disruption'));

      const req = {
        query: { assessmentId: 'AIC-2026-0002' }
      } as unknown as Request;

      let statusCode = 0;
      let jsonPayload: unknown = null;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (payload: unknown) => {
              jsonPayload = payload;
            }
          };
        }
      } as unknown as Response;

      await Module2SpecificationRationalisationController.getSpecificationRationalisation(req, res);
      expect(statusCode).toBe(500);
      expect((jsonPayload as { message: string }).message).toContain('Internal server error');
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
    AssessmentStore.resetInstance();
  });
});
