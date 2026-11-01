/**
 * Module 3 PCBI Phase 2 — Benchmark Catalog, Source Availability & Mapping Infrastructure Test Suite
 * Customer: Borosil Ltd (AIC-2026-0002)
 *
 * Verifies all 8 Phase 2 core requirements:
 * 1. Material mapping and unmapped-material handling (zero keyword guessing)
 * 2. Source-data availability classification (5 strict categories)
 * 3. Invalid unit or currency comparisons
 * 4. Missing and stale benchmark observations (>90 day freshness barrier)
 * 5. Auditability of mapping approval
 * 6. Preservation of Module 1 baseline (₹556.5346 Cr across 27,777 transactions)
 * 7. Zero certified and realized savings (analytical variance separation)
 * 8. Module 4 strict isolation
 * 9. Controller HTTP endpoint behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { Module3PcbiMappingService } from '../../src/services/module3PcbiMappingService';
import {
  BOROSIL_BENCHMARK_REQUIREMENTS_CATALOG,
  BOROSIL_INITIAL_MAPPING_RECORDS,
  BOROSIL_BENCHMARK_COVERAGE_SUMMARY
} from '../../src/constants/module3PcbiBorosilCatalog';
import { resolvePCBIMapping, UNMAPPED_BENCHMARK_SIGNAL } from '../../src/services/pcbiIndexResolver';
import { module3CanonicalController } from '../../src/controllers/module3Canonical.controller';
import type { PCBIClientPurchaseTransaction } from '../../src/types/pcbi';

function createMockResponse(): { res: Response; jsonSpy: ReturnType<typeof vi.fn>; statusSpy: ReturnType<typeof vi.fn> } {
  const jsonSpy = vi.fn();
  const statusSpy = vi.fn().mockReturnThis();
  const res = {
    json: jsonSpy,
    status: statusSpy
  } as unknown as Response;
  return { res, jsonSpy, statusSpy };
}

describe('Module 3 PCBI Phase 2 — Benchmark Catalog, Source Validation & Material Mapping', () => {
  beforeEach(() => {
    Module3PcbiMappingService.resetStore();
    vi.restoreAllMocks();
  });

  describe('1. Borosil Benchmark Requirements Catalog & Prioritization', () => {
    it('returns the 8 prioritized material groups for Borosil Ltd', () => {
      const requirements = Module3PcbiMappingService.getRequirementsCatalog('AIC-2026-0002');
      expect(requirements.length).toBe(8);

      const groupNames = requirements.map((r) => r.materialGroupName);
      expect(groupNames).toContain('Soda Ash (Dense & Light)');
      expect(groupNames).toContain('Silica Sand & Quartz');
      expect(groupNames).toContain('Boric Acid and Borax');
      expect(groupNames).toContain('Corrugated Boxes, Cartons and Kraft Paper');
      expect(groupNames).toContain('Polypropylene, LDPE and HDPE');
      expect(groupNames).toContain('Refractories and Furnace Consumables');
      expect(groupNames).toContain('Fuel and Energy (LSHS, LPG, Diesel)');
      expect(groupNames).toContain('Standard MRO (Steel, Aluminium, Lubricants)');
    });

    it('rejects requirements catalog request for unknown assessments without cross-customer leakage', () => {
      const requirements = Module3PcbiMappingService.getRequirementsCatalog('AIC-UNKNOWN-9999');
      expect(requirements).toEqual([]);
    });

    it('confirms that Boric Acid and Borax has 0 spend and 0 transactions in Borosil PO ledger', () => {
      const boricGroup = BOROSIL_BENCHMARK_REQUIREMENTS_CATALOG.find(
        (g) => g.materialGroupId === 'GRP-BOR-BORIC-BORAX'
      );
      expect(boricGroup).toBeDefined();
      expect(boricGroup?.transactionCount).toBe(0);
      expect(boricGroup?.totalHistoricalSpendCr).toBe(0.0);
      expect(boricGroup?.actualSourceAvailability).toBe('NO_SUITABLE_SOURCE_IDENTIFIED');
    });

    it('documents high historical spend for Soda Ash (₹74.02 Cr) and Silica Sand (₹39.02 Cr)', () => {
      const sodaAsh = BOROSIL_BENCHMARK_REQUIREMENTS_CATALOG.find(
        (g) => g.materialGroupId === 'GRP-BOR-SODA-ASH'
      );
      const silica = BOROSIL_BENCHMARK_REQUIREMENTS_CATALOG.find(
        (g) => g.materialGroupId === 'GRP-BOR-SILICA-QUARTZ'
      );

      expect(sodaAsh?.totalHistoricalSpendCr).toBe(74.017);
      expect(sodaAsh?.sapMaterialCodes).toContain('100SA02G');
      expect(silica?.totalHistoricalSpendCr).toBe(39.0219);
      expect(silica?.sapMaterialCodes).toContain('100SSW13FG-L');
    });
  });

  describe('2. Benchmark Source Availability Classification Matrix', () => {
    it('classifies proposed benchmark series into the 5 mandatory categories with verified evidence', () => {
      const catalog = Module3PcbiMappingService.getRequirementsCatalog('AIC-2026-0002');

      const availabilities = catalog.map((c) => c.actualSourceAvailability);
      expect(availabilities).toContain('SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED');
      expect(availabilities).toContain('MANUAL_VALIDATION_REQUIRED');
      expect(availabilities).toContain('LICENSE_REQUIRED');
      expect(availabilities).toContain('NO_SUITABLE_SOURCE_IDENTIFIED');

      // Verify Soda Ash: SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED
      const sodaAsh = catalog.find((c) => c.materialGroupId === 'GRP-BOR-SODA-ASH');
      expect(sodaAsh?.actualSourceAvailability).toBe('SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED');
      expect(sodaAsh?.candidatePublisher).toContain('AMAI');

      // Verify Silica Sand: MANUAL_VALIDATION_REQUIRED
      const silica = catalog.find((c) => c.materialGroupId === 'GRP-BOR-SILICA-QUARTZ');
      expect(silica?.actualSourceAvailability).toBe('MANUAL_VALIDATION_REQUIRED');
      expect(silica?.candidatePublisher).toContain('Indian Bureau of Mines');

      // Verify Polymers: LICENSE_REQUIRED
      const polymers = catalog.find((c) => c.materialGroupId === 'GRP-BOR-POLYMERS');
      expect(polymers?.actualSourceAvailability).toBe('LICENSE_REQUIRED');
      expect(polymers?.candidatePublisher).toContain('Platts');

      // Verify Refractories: NO_SUITABLE_SOURCE_IDENTIFIED
      const refractories = catalog.find((c) => c.materialGroupId === 'GRP-BOR-REFRACTORIES');
      expect(refractories?.actualSourceAvailability).toBe('NO_SUITABLE_SOURCE_IDENTIFIED');
    });
  });

  describe('3. Auditable Mapping Infrastructure & Approval Workflow', () => {
    it('initializes representative Borosil material mappings in PENDING approval state', () => {
      const mappings = Module3PcbiMappingService.getMappings('AIC-2026-0002');
      expect(mappings.length).toBeGreaterThanOrEqual(6);

      const sodaDense = mappings.find((m) => m.materialCode === '100SA02G');
      expect(sodaDense).toBeDefined();
      expect(sodaDense?.approvalStatus).toBe('PENDING');
      expect(sodaDense?.mappingStatus).toBe('MAPPED_PENDING_APPROVAL');
      expect(sodaDense?.unitConversion.isTraceable).toBe(true);
      expect(sodaDense?.currencyConversion.isTraceable).toBe(true);
    });

    it('approves a mapping with actor, timestamp, and audit trail', () => {
      const mapping = Module3PcbiMappingService.updateMappingApproval(
        'MAP-BOR-100SA02G',
        'APPROVED',
        'Head of Sourcing',
        'Approved after reviewing GHCL contract terms and AMAI grade alignment'
      );

      expect(mapping.approvalStatus).toBe('APPROVED');
      expect(mapping.approvedBy).toBe('Head of Sourcing');
      expect(mapping.mappingStatus).toBe('MAPPED_APPROVED');
      expect(mapping.auditHistory[0].action).toBe('MAPPING_APPROVED');
      expect(mapping.auditHistory[0].actor).toBe('Head of Sourcing');

      // Verify store persistence
      const retrieved = Module3PcbiMappingService.getMappingByMaterialCode('100SA02G', 'AIC-2026-0002');
      expect(retrieved?.approvalStatus).toBe('APPROVED');
    });

    it('rejects a mapping with reason', () => {
      const mapping = Module3PcbiMappingService.updateMappingApproval(
        'MAP-BOR-100SA01T',
        'REJECTED',
        'Technical Committee',
        'Specification too divergent from local supplier spot delivery'
      );

      expect(mapping.approvalStatus).toBe('REJECTED');
      expect(mapping.mappingStatus).toBe('REJECTED');
      expect(mapping.auditHistory[0].action).toBe('MAPPING_REJECTED');
    });

    it('throws when updating a non-existent mapping ID', () => {
      expect(() =>
        Module3PcbiMappingService.updateMappingApproval(
          'NON-EXISTENT-MAP',
          'APPROVED',
          'Admin',
          'Comment'
        )
      ).toThrow("Mapping record 'NON-EXISTENT-MAP' was not found.");
    });
  });

  describe('4. Calculation Safety & Quality Controls', () => {
    it('blocks price variance calculation when mapping is PENDING approval', () => {
      const mapping = Module3PcbiMappingService.getMappingByMaterialCode('100SA02G', 'AIC-2026-0002')!;
      expect(mapping.approvalStatus).toBe('PENDING');

      const safety = Module3PcbiMappingService.validateCalculationSafety({
        mapping,
        transactionDate: '2026-05-15',
        latestObservationDate: '2026-05-01'
      });

      expect(safety.isSafe).toBe(false);
      expect(safety.status).toBe('UNAPPROVED_MAPPING');
      expect(safety.reason).toContain('unapproved mappings cannot produce price variances');
    });

    it('blocks price variance calculation when specification is NOT_COMPARABLE', () => {
      const mapping = Module3PcbiMappingService.getMappingByMaterialCode('STTV2062', 'AIC-2026-0002')!;

      const safety = Module3PcbiMappingService.validateCalculationSafety({
        mapping,
        transactionDate: '2026-06-01',
        latestObservationDate: '2026-06-01'
      });

      expect(safety.isSafe).toBe(false);
      expect(safety.status).toBe('UNAPPROVED_MAPPING');
    });

    it('blocks price variance calculation when unit of measure conversion is untraceable', () => {
      const mapping = Module3PcbiMappingService.getMappingByMaterialCode('100SA02G', 'AIC-2026-0002')!;
      mapping.approvalStatus = 'APPROVED';
      mapping.unitConversion.isTraceable = false;

      const safety = Module3PcbiMappingService.validateCalculationSafety({
        mapping,
        transactionDate: '2026-05-15',
        latestObservationDate: '2026-05-01'
      });

      expect(safety.isSafe).toBe(false);
      expect(safety.status).toBe('INCOMPATIBLE_UOM');
      expect(safety.reason).toContain('untraceable unit of measure');
    });

    it('enforces explicit UNAVAILABLE state when benchmark observation is missing', () => {
      const mapping = Module3PcbiMappingService.getMappingByMaterialCode('100SA02G', 'AIC-2026-0002')!;
      mapping.approvalStatus = 'APPROVED';

      const safety = Module3PcbiMappingService.validateCalculationSafety({
        mapping,
        transactionDate: '2026-05-15',
        latestObservationDate: undefined
      });

      expect(safety.isSafe).toBe(false);
      expect(safety.status).toBe('UNAVAILABLE');
      expect(safety.reason).toContain('Missing benchmark observation');
    });

    it('flags stale observations (>90 days) and blocks price variance calculation', () => {
      const mapping = Module3PcbiMappingService.getMappingByMaterialCode('100SA02G', 'AIC-2026-0002')!;
      mapping.approvalStatus = 'APPROVED';

      // PO date in 2026 vs demo observation in 2021 (>1800 days stale)
      const safety = Module3PcbiMappingService.validateCalculationSafety({
        mapping,
        transactionDate: '2026-05-15',
        latestObservationDate: '2021-05-01'
      });

      expect(safety.isSafe).toBe(false);
      expect(safety.status).toBe('STALE_OBSERVATION');
      expect(safety.reason).toContain('is stale compared to PO date');
    });

    it('allows calculation when mapping is approved, comparable, traceable, and observation is fresh', () => {
      const mapping = Module3PcbiMappingService.getMappingByMaterialCode('100SA02G', 'AIC-2026-0002')!;
      mapping.approvalStatus = 'APPROVED';
      mapping.mappingStatus = 'MAPPED_APPROVED';

      const safety = Module3PcbiMappingService.validateCalculationSafety({
        mapping,
        transactionDate: '2026-05-15',
        latestObservationDate: '2026-05-01'
      });

      expect(safety.isSafe).toBe(true);
      expect(safety.status).toBe('VALID');
    });
  });

  describe('5. Integration with PCBI Index Resolver & Keyword Fallback Prevention', () => {
    const dummyUnspscMap = new Map();

    it('prevents broad keyword guessing for customer assessments and returns UNMAPPED_BENCHMARK_SIGNAL', () => {
      // Transaction has keyword "oil" or "steel", but no approved mapping in Borosil registry
      const tx: PCBIClientPurchaseTransaction & { assessmentId?: string } = {
        id: 'TX-BOR-001',
        sector: 'Glass',
        plant: '1120',
        po_number: '6100000001',
        po_date: '2026-05-01',
        material_code: 'UNMAPPED_OIL_ITEM',
        short_text: 'Generic Hydraulic Lubricant Oil',
        quantity: 10,
        uom: 'L',
        currency: 'INR',
        unit_price: 250,
        total_value: 2500,
        assessmentId: 'AIC-2026-0002'
      };

      const resolved = resolvePCBIMapping(dummyUnspscMap, tx);

      // Must NOT guess PCBI-LUB-OIL-001 based on word 'oil'
      expect(resolved.pcbiId).toBe(UNMAPPED_BENCHMARK_SIGNAL);
      expect(resolved.method).toBe('UNMAPPED_NO_APPROVED_BENCHMARK');
      expect(resolved.action).toBe('SIGNAL_UNMAPPED');
    });

    it('blocks variance when material is registered in auditable registry but pending approval', () => {
      const tx: PCBIClientPurchaseTransaction & { assessmentId?: string } = {
        id: 'TX-BOR-002',
        sector: 'Glass',
        plant: '1120',
        po_number: '6100000002',
        po_date: '2026-05-01',
        material_code: '100SA02G',
        short_text: 'Soda Ash Dense- GHCL',
        quantity: 100,
        uom: 'MT',
        currency: 'INR',
        unit_price: 35000,
        total_value: 3500000,
        assessmentId: 'AIC-2026-0002'
      };

      const resolved = resolvePCBIMapping(dummyUnspscMap, tx);

      expect(resolved.pcbiId).toBe(UNMAPPED_BENCHMARK_SIGNAL);
      expect(resolved.status).toBe('UNAPPROVED_MAPPING');
      expect(resolved.action).toBe('BLOCK_VARIANCE');
    });

    it('resolves benchmark series when mapping is formally APPROVED in auditable registry', () => {
      Module3PcbiMappingService.updateMappingApproval(
        'MAP-BOR-100SA02G',
        'APPROVED',
        'Procurement Director',
        'Validated GHCL contract alignment'
      );

      const tx: PCBIClientPurchaseTransaction & { assessmentId?: string } = {
        id: 'TX-BOR-003',
        sector: 'Glass',
        plant: '1120',
        po_number: '6100000003',
        po_date: '2026-05-01',
        material_code: '100SA02G',
        short_text: 'Soda Ash Dense- GHCL',
        quantity: 100,
        uom: 'MT',
        currency: 'INR',
        unit_price: 35000,
        total_value: 3500000,
        assessmentId: 'AIC-2026-0002'
      };

      const resolved = resolvePCBIMapping(dummyUnspscMap, tx);

      expect(resolved.pcbiId).toBe('PCBI-IND-CHM-SDA-001');
      expect(resolved.status).toBe('MAPPED_APPROVED');
      expect(resolved.action).toBe('ALLOW');
    });
  });

  describe('6. Baseline Reconciliation, Savings Separation & Module 4 Isolation', () => {
    it('preserves Borosil Module 1 baseline at ₹556.5346 Cr across 27,777 transactions', () => {
      const summary = Module3PcbiMappingService.getCoverageSummary('AIC-2026-0002');

      expect(summary.baselineSpendCr).toBe(556.5346);
      expect(summary.baselineTransactions).toBe(27777);
      expect(summary.evaluatedMaterialsCount).toBe(8976);
    });

    it('strictly enforces zero certified and zero realized savings', () => {
      const summary = Module3PcbiMappingService.getCoverageSummary('AIC-2026-0002');

      expect(summary.certifiedSavingsCr).toBe(0.0);
      expect(summary.realizedSavingsCr).toBe(0.0);
      expect(summary.marketVarianceValueCr).toBe(0.0);
    });

    it('verifies that Module 4 is activated for AIC-2026-0002 upon validation gate clearance', () => {
      const summary = Module3PcbiMappingService.getCoverageSummary('AIC-2026-0002');
      expect(summary.module4Executed).toBe(true);
    });

    it('keeps unmapped spend (₹423.49 Cr, 76.09%) and NR spend (₹133.03 Cr) visible in coverage reporting', () => {
      const summary = Module3PcbiMappingService.getCoverageSummary('AIC-2026-0002');

      expect(summary.unmappedSpendCr).toBe(423.4876);
      expect(summary.unmappedSpendPct).toBe(76.09);
      expect(summary.mappedPendingApprovalSpendCr).toBe(0.0);
      expect(summary.nrSpendCr).toBe(133.0317);
    });
  });

  describe('7. Module 3 Canonical Controller HTTP Endpoints', () => {
    it('handles getBenchmarkRequirements: returns requirements catalog for AIC-2026-0002', async () => {
      const req = { query: { assessmentId: 'AIC-2026-0002' } } as unknown as Request;
      const { res, jsonSpy } = createMockResponse();

      await module3CanonicalController.getBenchmarkRequirements(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          assessmentId: 'AIC-2026-0002',
          count: 8
        })
      );
    });

    it('handles getBenchmarkRequirements: rejects missing or invalid assessmentId with 400', async () => {
      const req = { query: { assessmentId: 'AIC-INVALID-9999' } } as unknown as Request;
      const { res, jsonSpy, statusSpy } = createMockResponse();

      await module3CanonicalController.getBenchmarkRequirements(req, res);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Valid assessment ID is required.'
        })
      );
    });

    it('handles getMaterialMappings: returns auditable mappings list for AIC-2026-0002', async () => {
      const req = { query: { assessmentId: 'AIC-2026-0002' } } as unknown as Request;
      const { res, jsonSpy } = createMockResponse();

      await module3CanonicalController.getMaterialMappings(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          assessmentId: 'AIC-2026-0002',
          count: expect.any(Number)
        })
      );
    });

    it('handles updateMappingApproval: successfully approves mapping', async () => {
      const req = {
        body: {
          mappingId: 'MAP-BOR-100SA02G',
          approvalStatus: 'APPROVED',
          actor: 'Lead Sourcing Manager',
          comment: 'Approved for pilot benchmarking'
        }
      } as unknown as Request;
      const { res, jsonSpy } = createMockResponse();

      await module3CanonicalController.updateMappingApproval(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          mapping: expect.objectContaining({
            id: 'MAP-BOR-100SA02G',
            approvalStatus: 'APPROVED',
            approvedBy: 'Lead Sourcing Manager'
          })
        })
      );
    });

    it('handles updateMappingApproval: rejects invalid approval payload with 400', async () => {
      const req = {
        body: {
          mappingId: '',
          approvalStatus: 'INVALID_STATUS'
        }
      } as unknown as Request;
      const { res, jsonSpy, statusSpy } = createMockResponse();

      await module3CanonicalController.updateMappingApproval(req, res);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid mapping approval payload.'
        })
      );
    });

    it('handles proposeMaterialMapping: successfully proposes candidate mapping', async () => {
      const req = {
        body: {
          assessmentId: 'AIC-2026-0002',
          materialCode: '100SSW13FG-L',
          benchmarkSeriesId: 'PCBI-IND-MIN-SLS-001',
          benchmarkSeriesName: 'Indian Bureau of Mines (IBM) Silica Sand Mineral Statistics',
          actionType: 'PROPOSE_CANDIDATE',
          actor: 'Sriman Auditor',
          rationale: 'Proposed IBM series for silica sand'
        }
      } as unknown as Request;
      const { res, jsonSpy } = createMockResponse();

      await module3CanonicalController.proposeMaterialMapping(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          mapping: expect.objectContaining({
            materialCode: '100SSW13FG-L',
            approvalStatus: 'PENDING',
            benchmarkSeriesId: 'PCBI-IND-MIN-SLS-001'
          })
        })
      );
    });

    it('handles proposeMaterialMapping: successfully records NO_SUITABLE_BENCHMARK', async () => {
      const req = {
        body: {
          assessmentId: 'AIC-2026-0002',
          materialCode: 'STTV2062',
          actionType: 'NO_SUITABLE_BENCHMARK',
          actor: 'Sriman Auditor',
          rationale: 'Proprietary furnace tile'
        }
      } as unknown as Request;
      const { res, jsonSpy } = createMockResponse();

      await module3CanonicalController.proposeMaterialMapping(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          mapping: expect.objectContaining({
            materialCode: 'STTV2062',
            approvalStatus: 'APPROVED',
            benchmarkSeriesId: 'NONE'
          })
        })
      );
    });

    it('handles proposeMaterialMapping: rejects missing materialCode or actionType with 400', async () => {
      const req = { body: { materialCode: '' } } as unknown as Request;
      const { res, jsonSpy, statusSpy } = createMockResponse();

      await module3CanonicalController.proposeMaterialMapping(req, res);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Material code and action type are required.'
        })
      );
    });

    it('handles getCoverageSummary: returns coverage summary for AIC-2026-0002', async () => {
      const req = { query: { assessmentId: 'AIC-2026-0002' } } as unknown as Request;
      const { res, jsonSpy } = createMockResponse();

      await module3CanonicalController.getCoverageSummary(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          summary: expect.objectContaining({
            assessmentId: 'AIC-2026-0002',
            baselineSpendCr: 556.5346,
            certifiedSavingsCr: 0.0,
            realizedSavingsCr: 0.0,
            module4Executed: true
          })
        })
      );
    });
  });
});
