import { describe, it, expect } from 'vitest';
import { pcbiGapGovernanceService } from '../../src/services/pcbiGapGovernanceService';
import type {
  PCBIClassificationInput,
  PCBIMethodologyRecord,
  PCBISourceValidationRecord,
  PCBIProvenanceChain
} from '../../src/types/pcbiAdmin';

describe('PCBI Gap Governance & Architecture QA Service Unit Tests', () => {
  describe('Module 2 Sole Classification Authority', () => {
    it('allows valid Module 2 classification without conflict', () => {
      const input: PCBIClassificationInput = {
        materialCode: 'MAT-STEEL-001',
        module2Commodity: 'Structural Steel',
        module2Unspsc: '30263601'
      };
      const result = pcbiGapGovernanceService.validateModule2Classification(input);
      expect(result.isValid).toBe(true);
      expect(result.status).toBe('VALIDATED');
      expect(result.action).toBe('ALLOW');
      expect(result.classificationAuthority).toBe('MODULE_2_ONLY');
    });

    it('allows matching Module 3 and Module 2 classifications', () => {
      const input: PCBIClassificationInput = {
        materialCode: 'MAT-STEEL-001',
        module2Commodity: 'Structural Steel',
        module3Commodity: 'Structural Steel'
      };
      const result = pcbiGapGovernanceService.validateModule2Classification(input);
      expect(result.isValid).toBe(true);
      expect(result.status).toBe('VALIDATED');
      expect(result.action).toBe('ALLOW');
    });

    it('blocks and returns CLASSIFICATION_CONFLICT if Module 3 commodity conflicts with Module 2', () => {
      const input: PCBIClassificationInput = {
        materialCode: 'MAT-STEEL-001',
        module2Commodity: 'Structural Steel',
        module3Commodity: 'Stainless Steel Sheet'
      };
      const result = pcbiGapGovernanceService.validateModule2Classification(input);
      expect(result.isValid).toBe(false);
      expect(result.status).toBe('CLASSIFICATION_CONFLICT');
      expect(result.action).toBe('BLOCK');
      expect(result.conflictDetails).toContain('conflicts with Module 2 authority');
    });

    it('blocks and returns CLASSIFICATION_CONFLICT if Module 3 category conflicts with Module 2', () => {
      const input: PCBIClassificationInput = {
        materialCode: 'MAT-CHEM-001',
        module2Commodity: 'Caustic Soda',
        module3Category: 'Petrochemicals'
      };
      const result = pcbiGapGovernanceService.validateModule2Classification(input);
      expect(result.isValid).toBe(false);
      expect(result.status).toBe('CLASSIFICATION_CONFLICT');
      expect(result.action).toBe('BLOCK');
      expect(result.conflictDetails).toContain('conflicts with Module 2 commodity authority');
    });
  });

  describe('Methodology Governance & Removal of Automatic Assumptions', () => {
    it('returns METHODOLOGY_PENDING when no methodology record is provided', () => {
      const result = pcbiGapGovernanceService.validateMethodology(null);
      expect(result.isApproved).toBe(false);
      expect(result.status).toBe('METHODOLOGY_PENDING');
      expect(result.action).toBe('ADMIN_ACTION_REQUIRED');
      expect(result.methodId).toBeNull();
      expect(result.reason).toContain('No documented methodology provided');
    });

    it('blocks unapproved methodology without unique methodId, approval or provenance', () => {
      const incomplete: PCBIMethodologyRecord = {
        methodId: '',
        name: 'Unapproved Scrap Discount',
        commodity: 'Stainless Steel',
        materialType: 'Turnings',
        mathematicalRule: '',
        status: 'METHODOLOGY_PENDING',
        sourceProvenance: ''
      };
      const result = pcbiGapGovernanceService.validateMethodology(incomplete);
      expect(result.isApproved).toBe(false);
      expect(result.status).toBe('METHODOLOGY_PENDING');
      expect(result.reason).toContain('Missing unique METHOD_ID');
      expect(result.reason).toContain('explicit mathematical rule');
      expect(result.reason).toContain('source provenance record');
    });

    it('handles rejected methodology status explicitly', () => {
      const rejected: PCBIMethodologyRecord = {
        methodId: 'METH-REJ-001',
        name: 'Disallowed Fixed Markup',
        commodity: 'Copper',
        materialType: 'Scrap',
        mathematicalRule: 'Price = 0.5 * Base',
        status: 'REJECTED',
        sourceProvenance: 'Internal email'
      };
      const result = pcbiGapGovernanceService.validateMethodology(rejected);
      expect(result.isApproved).toBe(false);
      expect(result.status).toBe('REJECTED');
      expect(result.action).toBe('ADMIN_ACTION_REQUIRED');
    });

    it('approves complete and validated methodology', () => {
      const approved: PCBIMethodologyRecord = {
        methodId: 'METH-FORM-001',
        name: 'Technical Form-Factor Scrap Conversion',
        commodity: 'Stainless Steel',
        materialType: 'Turnings vs Prime',
        mathematicalRule: 'Price = Base * (1 - 0.18)',
        adjustmentPercentage: -18,
        status: 'APPROVED',
        sourceProvenance: 'ASTM Metallurgical Handbook 2024 Table 5.2',
        approvedBy: 'Chief Metallurgist & Lead Economist',
        approvedDate: '2026-02-10'
      };
      const result = pcbiGapGovernanceService.validateMethodology(approved);
      expect(result.isApproved).toBe(true);
      expect(result.status).toBe('APPROVED');
      expect(result.action).toBe('APPLY');
      expect(result.methodId).toBe('METH-FORM-001');
      expect(result.mathematicalRule).toBe('Price = Base * (1 - 0.18)');
      expect(result.adjustmentPercentage).toBe(-18);
    });
  });

  describe('Source Candidate vs Validated Source', () => {
    it('marks source as CANDIDATE or UNDER_VALIDATION if specification equivalence is unproven', () => {
      const candidate: PCBISourceValidationRecord = {
        sourceId: 'SRC-TEST-001',
        sourceName: 'Sample Index',
        commodity: 'Ferro Moly',
        grade: 'Generic',
        specification: 'Standard',
        unit: 'MT',
        geography: 'National',
        frequency: 'MONTHLY',
        historicalCoverageYears: 5,
        priceBasis: 'FOB',
        marketBasis: 'Spot',
        status: 'CANDIDATE',
        equivalenceProven: false,
        notes: 'Equivalence unproven'
      };
      const result = pcbiGapGovernanceService.validateSource(candidate);
      expect(result.status).toBe('CANDIDATE');
      expect(result.isValidated).toBe(false);
      expect(result.rejectionReason).toContain('Specification equivalence has not been demonstrated');
    });

    it('rejects source with status REJECTED', () => {
      const rejected: PCBISourceValidationRecord = {
        sourceId: 'SRC-REJ-001',
        sourceName: 'Discredited Source',
        commodity: 'Coal',
        grade: 'GCV 3800',
        specification: 'Thermal',
        unit: 'MT',
        geography: 'Global',
        frequency: 'WEEKLY',
        historicalCoverageYears: 4,
        priceBasis: 'CIF',
        marketBasis: 'Broker',
        status: 'REJECTED',
        equivalenceProven: true,
        notes: 'Failed publisher compliance audit'
      };
      const result = pcbiGapGovernanceService.validateSource(rejected);
      expect(result.status).toBe('REJECTED');
      expect(result.isValidated).toBe(false);
      expect(result.rejectionReason).toContain('explicitly rejected');
    });

    it('marks source as UNDER_VALIDATION if any dimensional field is missing or history < 3 years', () => {
      const incomplete: PCBISourceValidationRecord = {
        sourceId: 'SRC-INC-001',
        sourceName: 'Short History Source',
        commodity: 'Nickel',
        grade: 'Cathode',
        specification: '99.8%',
        unit: 'MT',
        geography: 'Domestic',
        frequency: 'WEEKLY',
        historicalCoverageYears: 1, // < 3 years
        priceBasis: 'Ex-Works',
        marketBasis: 'Exchange',
        status: 'UNDER_VALIDATION',
        equivalenceProven: true,
        notes: 'Only 1 year data available'
      };
      const result = pcbiGapGovernanceService.validateSource(incomplete);
      expect(result.status).toBe('UNDER_VALIDATION');
      expect(result.isValidated).toBe(false);
      expect(result.validatedFields.historicalCoverage).toBe(false);
    });

    it('validates source when all 9 dimensions pass and equivalence is proven', () => {
      const validated: PCBISourceValidationRecord = {
        sourceId: 'SRC-VAL-001',
        sourceName: 'CRU Steel Index',
        commodity: 'Structural Steel',
        grade: 'IS 2062 E250',
        specification: 'Hot Rolled Coils 2.0-8.0mm',
        unit: 'MT',
        geography: 'India National',
        frequency: 'WEEKLY',
        historicalCoverageYears: 6,
        priceBasis: 'Ex-Works',
        marketBasis: 'Physical Domestic Spot',
        status: 'VALIDATED',
        equivalenceProven: true,
        notes: 'Fully audited benchmark index'
      };
      const result = pcbiGapGovernanceService.validateSource(validated);
      expect(result.status).toBe('VALIDATED');
      expect(result.isValidated).toBe(true);
      expect(result.equivalenceProven).toBe(true);
    });
  });

  describe('10-Link Provenance Test', () => {
    it('blocks observation when any link of 10 is missing', () => {
      const brokenChain: Partial<PCBIProvenanceChain> = {
        observationId: 'OBS-001',
        sourceId: 'SRC-001',
        sourceDocument: 'Report_2024.pdf'
        // Missing remaining links
      };
      const result = pcbiGapGovernanceService.validateProvenance(brokenChain);
      expect(result.isValid).toBe(false);
      expect(result.validationStatus).toBe('BLOCKED');
      expect(result.missingLinks.length).toBeGreaterThan(0);
      expect(result.missingLinks).toContain('pageTableRow');
      expect(result.missingLinks).toContain('originalValue');
      expect(result.missingLinks).toContain('approvalRecordId');
    });

    it('validates observation when all 10 links are proven', () => {
      const completeChain: Partial<PCBIProvenanceChain> = {
        observationId: 'OBS-002',
        sourceId: 'SRC-PLATTS-001',
        sourceDocument: 'Platts_Metal_Daily_2024_05_18.pdf',
        pageTableRow: 'Page 14, Table 3, Row 8',
        originalValue: 56500,
        originalUnit: 'INR/MT',
        originalFrequency: 'DAILY',
        transformationRuleId: 'RULE-DAILY-TO-WEEKLY-AVG',
        standardizedValue: 56500,
        approvalRecordId: 'APPR-OBS-20240518-09'
      };
      const result = pcbiGapGovernanceService.validateProvenance(completeChain);
      expect(result.isValid).toBe(true);
      expect(result.validationStatus).toBe('VALIDATED');
      expect(result.missingLinks.length).toBe(0);
    });
  });

  describe('Preview Safety Test', () => {
    it('executes in isolated sandbox with 0 production writes and Module 4 disconnected', () => {
      const safety = pcbiGapGovernanceService.executePreviewSandbox();
      expect(safety.mode).toBe('SIMULATION_ONLY');
      expect(safety.productionStatus).toBe('NOT_PRODUCTION');
      expect(safety.approvalStatus).toBe('NOT_APPROVED');
      expect(safety.pcbiObservationsWritten).toBe(0);
      expect(safety.pcbiMasterCatalogWritten).toBe(0);
      expect(safety.savingsEngineWritten).toBe(0);
      expect(safety.module4Connected).toBe(false);
      expect(safety.sandboxIsolated).toBe(true);
    });
  });

  describe('12 Synthetic Test Cases Architecture QA', () => {
    it('executes all 12 synthetic architecture QA tests and passes every single test', () => {
      const testCases = pcbiGapGovernanceService.runSyntheticTestCases();
      expect(testCases.length).toBe(12);

      for (const t of testCases) {
        expect(t.passed).toBe(true);
        expect(t.actual).toBe(t.expected);
      }

      // Verify specific test expectations
      expect(testCases[0].testId).toBe('TEST 01');
      expect(testCases[0].expected).toBe('READY_FOR_VALIDATION');

      expect(testCases[1].testId).toBe('TEST 02');
      expect(testCases[1].expected).toBe('HISTORY_REQUIRED');

      expect(testCases[2].testId).toBe('TEST 03');
      expect(testCases[2].expected).toBe('PCBI_MISSING');

      expect(testCases[3].testId).toBe('TEST 04');
      expect(testCases[3].expected).toBe('SPECIFICATION_REVIEW');

      expect(testCases[4].testId).toBe('TEST 05');
      expect(testCases[4].expected).toBe('UNIT_MISMATCH');

      expect(testCases[5].testId).toBe('TEST 06');
      expect(testCases[5].expected).toBe('SOURCE_UNDER_VALIDATION');

      expect(testCases[6].testId).toBe('TEST 07');
      expect(testCases[6].expected).toBe('FREQUENCY_MISMATCH / METHODOLOGY_REQUIRED');

      expect(testCases[7].testId).toBe('TEST 08');
      expect(testCases[7].expected).toBe('eligible for normalization');

      expect(testCases[8].testId).toBe('TEST 09');
      expect(testCases[8].expected).toBe('BLOCKED');

      expect(testCases[9].testId).toBe('TEST 10');
      expect(testCases[9].expected).toBe('SANDBOX ONLY');

      expect(testCases[10].testId).toBe('TEST 11');
      expect(testCases[10].expected).toBe('CLASSIFICATION_CONFLICT / BLOCK');

      expect(testCases[11].testId).toBe('TEST 12');
      expect(testCases[11].expected).toBe('VALIDATION_FAILED');
    });
  });

  describe('Formal PCBI Gap Matrix Generation', () => {
    it('generates rows with evaluated readiness and action required', () => {
      const rows = pcbiGapGovernanceService.generateGapMatrix([
        {
          material: 'Test Steel Plate',
          module2Commodity: 'Structural Steel',
          unspsc: '30263601',
          definitionStatus: 'DEFINED',
          dataStatus: 'COMPLETE',
          sourceStatus: 'VALIDATED',
          methodologyStatus: 'APPROVED',
          specificationMatch: 'MATCH',
          geographyMatch: 'MATCH',
          unitMatch: 'MATCH'
        },
        {
          material: 'Custom Machine Part',
          module2Commodity: 'Special Equipment',
          unspsc: '40150000',
          definitionStatus: 'MISSING'
        },
        {
          // Test with completely empty object to test all defaults
        }
      ]);

      expect(rows.length).toBe(3);
      expect(rows[0].readinessStatus).toBe('READY_FOR_VALIDATION');
      expect(rows[1].readinessStatus).toBe('PCBI_MISSING');
      expect(rows[2].material).toBe('Generic Material');
    });

    it('returns SPECIFICATION_REVIEW when geography is not matched', () => {
      const result = pcbiGapGovernanceService.evaluateMaterialReadiness({
        material: 'Imported Coal',
        module2Commodity: 'Thermal Coal',
        unspsc: '15101500',
        spend: 1000000,
        transactions: 5,
        pcbiId: 'PCBI-COAL-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'COMPLETE',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'APPROVED',
        historicalStartRequired: '2020-04-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2020-04-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MISMATCH', // Mismatch!
        unitMatch: 'MATCH'
      });
      expect(result.readinessStatus).toBe('SPECIFICATION_REVIEW');
      expect(result.isReady).toBe(false);
    });

    it('handles methodology with undefined adjustment percentage', () => {
      const meth = pcbiGapGovernanceService.validateMethodology({
        methodId: 'METH-NO-PCT-001',
        name: 'Pass-through methodology',
        commodity: 'Steel',
        materialType: 'Prime',
        mathematicalRule: 'Price = Base',
        status: 'APPROVED',
        sourceProvenance: 'Contract Spec 2024'
      });
      expect(meth.isApproved).toBe(true);
      expect(meth.adjustmentPercentage).toBeNull();
    });
  });
});

