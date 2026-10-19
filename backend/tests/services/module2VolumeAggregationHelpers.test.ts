/**
 * Module 2 — Lever 4: Volume Aggregation Helpers & Ambiguity Regression Tests
 * Tests DemandHelper, ConversionHelper, AdjustmentsHelper, and PlantHelper.
 * Strict >= 90% code coverage, max 300 lines, cyclomatic complexity <= 10.
 */

import { describe, it, expect } from 'vitest';
import { Module2VolumeAggregationDemandHelper } from '../../src/services/module2VolumeAggregationDemandHelper';
import { Module2VolumeAggregationConversionHelper } from '../../src/services/module2VolumeAggregationConversionHelper';
import { Module2VolumeAggregationAdjustmentsHelper } from '../../src/services/module2VolumeAggregationAdjustmentsHelper';
import { Module2VolumeAggregationPlantHelper } from '../../src/services/module2VolumeAggregationPlantHelper';
import {
  VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS,
  VERIFIED_MATERIAL_DENSITY_TABLE,
  VERIFIED_MATERIAL_PACKAGING_TABLE
} from '../../src/constants/module2VolumeAggregation';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

describe('Module2VolumeAggregationDemandHelper (Prompt 444 Section 1)', () => {
  it('returns INSUFFICIENT_HISTORY when transaction list is empty', () => {
    const res = Module2VolumeAggregationDemandHelper.classify([]);
    expect(res.classification).toBe(VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS.INSUFFICIENT_HISTORY);
    expect(res.sourceTransactionDates.length).toBe(0);
    expect(res.evidence).toContain('No transaction history available');
  });

  it('classifies ONE_TIME_PROJECT supported by PO number or capex / project description', () => {
    const txs: StrategicInputTransaction[] = [
      {
        id: 'TX-1',
        po_number: 'CAPEX-2026-001',
        po_date: '2026-01-15',
        material_code: 'M-1',
        material_desc: 'Turbine Erection Assembly',
        quantity: 1,
        uom: 'EA',
        total_spend_inr: 5000000,
        department: 'Projects'
      }
    ];
    const res = Module2VolumeAggregationDemandHelper.classify(txs);
    expect(res.classification).toBe(VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS.ONE_TIME_PROJECT);
    expect(res.sourceTransactionDates).toEqual(['2026-01-15']);
    expect(res.evidence).toContain('CAPEX-2026-001');
  });

  it('classifies PERIODIC_SEASONAL supported by identifiable seasonal / overhaul cycle', () => {
    const txs: StrategicInputTransaction[] = [
      {
        id: 'TX-2',
        po_number: 'PO-888',
        po_date: '2026-06-10',
        material_code: 'M-2',
        material_desc: 'Boiler Annual Overhaul Refractory',
        quantity: 10,
        uom: 'MT',
        total_spend_inr: 200000,
        spend_category: 'Maintenance'
      }
    ];
    const res = Module2VolumeAggregationDemandHelper.classify(txs);
    expect(res.classification).toBe(VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS.PERIODIC_SEASONAL);
    expect(res.evidence).toContain('seasonal or operational-cycle');
  });

  it('classifies RECURRING supported by rate contract or blanket order', () => {
    const txs: StrategicInputTransaction[] = [
      {
        id: 'TX-3',
        po_number: 'BPO-2026-99',
        po_date: '2026-02-01',
        material_code: 'M-3',
        material_desc: 'Annual Rate Contract for Bearings',
        quantity: 50,
        uom: 'EA',
        total_spend_inr: 150000
      }
    ];
    const res = Module2VolumeAggregationDemandHelper.classify(txs);
    expect(res.classification).toBe(VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS.RECURRING);
    expect(res.evidence).toContain('rate contract, blanket PO');
  });

  it('does NOT infer project or recurring demand solely from transaction counts or date spans', () => {
    const txs: StrategicInputTransaction[] = [
      { id: '1', po_number: '101', po_date: '2026-01-01', material_desc: 'Standard Valve', total_spend_inr: 100 },
      { id: '2', po_number: '102', po_date: '2026-02-01', material_desc: 'Standard Valve', total_spend_inr: 100 },
      { id: '3', po_number: '103', po_date: '2026-03-01', material_desc: 'Standard Valve', total_spend_inr: 100 },
      { id: '4', po_number: '104', po_date: '2026-04-01', material_desc: 'Standard Valve', total_spend_inr: 100 }
    ];
    const res = Module2VolumeAggregationDemandHelper.classify(txs);
    expect(res.classification).toBe(VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS.INSUFFICIENT_HISTORY);
    expect(res.sourceTransactionDates.length).toBe(4);
  });
});

describe('Module2VolumeAggregationConversionHelper (Prompt 444 & 445 Governance)', () => {
  it('blocks keyword-only matches from physical conversion and sets suggested interpretation for review (Prompt 445)', () => {
    const res = Module2VolumeAggregationConversionHelper.resolveAmbiguousUom(
      100,
      'MT',
      'High Grade Limestone Lump',
      'Raw Materials'
    );
    expect(res).not.toBeNull();
    expect(res?.isCompatible).toBe(false);
    expect(res?.baseUom).toBe('MT');
    expect(res?.convertedQuantity).toBe(0);
    expect(res?.auditRecord.validationStatus).toBe('FURTHER_DATA_REQUIRED');
    expect(res?.auditRecord.suggestedInterpretation).toContain('Physical MASS');
  });

  it('authorizes compatible physical conversion when approved authoritative ERP metadata is provided', () => {
    const approvedMetadata = {
      rawUom: 'MT',
      targetBaseUom: 'MT',
      dimension: 'MASS' as const,
      toBaseFactor: 1.0,
      approvedSource: 'SAP ERP Table T006 UOM Master Record',
      provenanceDocument: 'ERP Customizing Table T006 (ISO code TNE)',
      validationStatus: 'APPROVED' as const
    };
    const res = Module2VolumeAggregationConversionHelper.resolveAmbiguousUom(
      100,
      'MT',
      'High Grade Limestone Lump',
      'Raw Materials',
      { approvedMapping: approvedMetadata }
    );
    expect(res).not.toBeNull();
    expect(res?.isCompatible).toBe(true);
    expect(res?.baseUom).toBe('MT');
    expect(res?.convertedQuantity).toBe(100);
    expect(res?.auditRecord.dimension).toBe('MASS');
    expect(res?.auditRecord.validationStatus).toBe('APPROVED');
    expect(res?.auditRecord.provenanceDocument).toBe('ERP Customizing Table T006 (ISO code TNE)');
  });

  it('blocks cable length keywords without approved metadata and authorizes when approved metadata is supplied', () => {
    // 1. Keyword alone: blocked
    const kwRes = Module2VolumeAggregationConversionHelper.resolveAmbiguousUom(
      250,
      'MT',
      'Armoured Electrical Cable 4-Core',
      'Electrical'
    );
    expect(kwRes?.isCompatible).toBe(false);
    expect(kwRes?.convertedQuantity).toBe(0);
    expect(kwRes?.auditRecord.suggestedInterpretation).toContain('Physical LENGTH');

    // 2. Approved metadata: authorized
    const approvedLength = {
      rawUom: 'MT',
      targetBaseUom: 'M',
      dimension: 'LENGTH' as const,
      toBaseFactor: 1.0,
      approvedSource: 'Oracle EBS UOM Conversions MTL_UOM_CONVERSIONS',
      provenanceDocument: 'ERP Customizing Table MTL_UOM_CLASSES',
      validationStatus: 'APPROVED' as const
    };
    const authRes = Module2VolumeAggregationConversionHelper.resolveAmbiguousUom(
      250,
      'MT',
      'Armoured Electrical Cable 4-Core',
      'Electrical',
      { approvedMapping: approvedLength }
    );
    expect(authRes?.isCompatible).toBe(true);
    expect(authRes?.baseUom).toBe('M');
    expect(authRes?.convertedQuantity).toBe(250);
    expect(authRes?.auditRecord.dimension).toBe('LENGTH');
  });

  it('excludes ambiguous MT from physical aggregation when metadata is inconclusive', () => {
    const res = Module2VolumeAggregationConversionHelper.resolveAmbiguousUom(
      50,
      'MT',
      'General Maintenance Item 44X',
      'Supplies'
    );
    expect(res).not.toBeNull();
    expect(res?.isCompatible).toBe(false);
    expect(res?.baseUom).toBe('MT');
    expect(res?.convertedQuantity).toBe(0);
    expect(res?.exclusionReason).toContain('Ambiguous UOM abbreviation');
  });

  it('returns null for non-ambiguous UOM in resolveAmbiguousUom', () => {
    expect(Module2VolumeAggregationConversionHelper.resolveAmbiguousUom(10, 'KG', 'Test Item')).toBeNull();
  });

  it('preserves native KL volume for High Speed Diesel when density evidence is unverified', () => {
    const res = Module2VolumeAggregationConversionHelper.checkDensityConversion(
      5000,
      'LTR',
      'High Speed Diesel (HSD) Grade A'
    );
    expect(res).not.toBeNull();
    expect(res?.baseUom).toBe('KL');
    expect(res?.convertedQuantity).toBe(5.0);
    expect(res?.densityRecord?.applied).toBe(false);
    expect(res?.densityRecord?.supportingEvidenceAvailable).toBe(false);
    expect(res?.densityRecord?.validationStatus).toBe('TECHNICAL_VALIDATION_REQUIRED');
  });

  it('applies density conversion when actionApplied is enabled with verified evidence', () => {
    const original = VERIFIED_MATERIAL_DENSITY_TABLE.HSD_DIESEL.actionApplied;
    try {
      (VERIFIED_MATERIAL_DENSITY_TABLE.HSD_DIESEL as { actionApplied: boolean }).actionApplied = true;
      const res = Module2VolumeAggregationConversionHelper.checkDensityConversion(
        2000,
        'LTR',
        'High Speed Diesel'
      );
      expect(res).not.toBeNull();
      expect(res?.densityRecord?.applied).toBe(true);
      expect(res?.convertedQuantity).toBe(2 * 0.84);
      expect(res?.baseUom).toBe('MT');
    } finally {
      (VERIFIED_MATERIAL_DENSITY_TABLE.HSD_DIESEL as { actionApplied: boolean }).actionApplied = original;
    }
  });

  it('applies packaging conversion when actionApplied and supportingEvidenceAvailable are true', () => {
    const entry = VERIFIED_MATERIAL_PACKAGING_TABLE.SAFETY_GLOVES_PAIR_PACK as {
      actionApplied: boolean;
      supportingEvidenceAvailable: boolean;
    };
    const origAction = entry.actionApplied;
    const origEvid = entry.supportingEvidenceAvailable;
    try {
      entry.actionApplied = true;
      entry.supportingEvidenceAvailable = true;
      const res = Module2VolumeAggregationConversionHelper.checkPackagingConversion(
        5,
        'PACK',
        'Industrial Safety Gloves Level 4'
      );
      expect(res).not.toBeNull();
      expect(res?.convertedQuantity).toBe(5 * 10);
      expect(res?.baseUom).toBe('PAIR');
      expect(res?.auditRecord.dimension).toBe('PACKAGING_VERIFIED');
    } finally {
      entry.actionApplied = origAction;
      entry.supportingEvidenceAvailable = origEvid;
    }
  });
});

describe('Module2VolumeAggregationAdjustmentsHelper', () => {
  it('correctly separates regular transactions and negative adjustments', () => {
    const txs: StrategicInputTransaction[] = [
      { id: 'REG-1', quantity: 10, total_spend_inr: 50000, po_number: 'PO-1' },
      { id: 'ADJ-1', quantity: -2, total_spend_inr: -10000, po_number: 'CN-1' },
      { id: 'REG-2', quantity: 5, total_spend_inr: 25000, po_number: 'PO-2' }
    ];
    const res = Module2VolumeAggregationAdjustmentsHelper.processAdjustmentsAndCreditNotes(txs);
    expect(res.regularTransactions.length).toBe(2);
    expect(res.unmatchedAdjustments.length).toBe(1);
    expect(res.unmatchedAdjustments[0].spendInr).toBe(-10000);
    expect(res.netAdjustmentSpendInr).toBe(-10000);
  });
});

describe('Module2VolumeAggregationPlantHelper', () => {
  it('builds plant profiles and material profiles with full dispersion and demand evidence', () => {
    const txs: StrategicInputTransaction[] = [
      { id: 'T1', plant: 'P101', material_code: 'MAT-A', material_desc: 'Oil', spend_category: 'Lube', quantity: 100, uom: 'LTR', total_spend_inr: 20000, vendor_name: 'Shell', po_date: '2026-03-01' },
      { id: 'T2', plant: 'P102', material_code: 'MAT-A', material_desc: 'Oil', spend_category: 'Lube', quantity: 200, uom: 'LTR', total_spend_inr: 40000, vendor_name: 'Castrol', po_date: '2026-04-01' }
    ];

    const plants = Module2VolumeAggregationPlantHelper.buildPlantProfiles(txs, 60000);
    expect(plants.length).toBe(2);
    expect(plants[0].totalSpendInr).toBe(40000);

    const matMap = new Map<string, StrategicInputTransaction[]>([['MAT-A', txs]]);
    const materials = Module2VolumeAggregationPlantHelper.buildMaterialProfiles(matMap);
    expect(materials.length).toBe(1);
    expect(materials[0].materialCode).toBe('MAT-A');
    expect(materials[0].plantCount).toBe(2);
    expect(materials[0].supplierCount).toBe(2);
    expect(materials[0].demandClassification).toBeDefined();
    expect(materials[0].demandClassificationEvidence).toBeDefined();
  });
});
