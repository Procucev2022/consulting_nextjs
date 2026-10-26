/**
 * Module 2 — Lever 4: Volume Aggregation Calculators & Helpers Unit Tests
 * Strict >= 90% per-file code coverage, max 300 lines, complexity <= 10
 */

import { describe, it, expect } from 'vitest';
import { Module2VolumeAggregationCalculators } from '../../src/services/module2VolumeAggregationCalculators';
import {
  VERIFIED_MATERIAL_DENSITY_TABLE,
  VERIFIED_MATERIAL_PACKAGING_TABLE
} from '../../src/constants/module2VolumeAggregation';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

describe('Module2VolumeAggregationCalculators', () => {
  it('converts standard mass, count, volume, length, and area UOMs', () => {
    const kgRes = Module2VolumeAggregationCalculators.convertUom(5000, 'KG', 'Steel Plates');
    expect(kgRes.isCompatible).toBe(true);
    expect(kgRes.baseUom).toBe('MT');
    expect(kgRes.convertedQuantity).toBe(5);
    expect(kgRes.auditRecord?.dimension).toBe('MASS');

    const eaRes = Module2VolumeAggregationCalculators.convertUom(25, 'NOS', 'Valves');
    expect(eaRes.isCompatible).toBe(true);
    expect(eaRes.baseUom).toBe('EA');
    expect(eaRes.convertedQuantity).toBe(25);
    expect(eaRes.auditRecord?.dimension).toBe('COUNT');

    const klRes = Module2VolumeAggregationCalculators.convertUom(3000, 'LTR', 'Chemicals');
    expect(klRes.isCompatible).toBe(true);
    expect(klRes.baseUom).toBe('KL');
    expect(klRes.convertedQuantity).toBe(3);

    const cftRes = Module2VolumeAggregationCalculators.convertUom(100, 'CFT', 'Timber Runner');
    expect(cftRes.isCompatible).toBe(true);
    expect(cftRes.baseUom).toBe('KL');
    expect(cftRes.convertedQuantity).toBeCloseTo(2.83168, 4);

    const ftRes = Module2VolumeAggregationCalculators.convertUom(100, 'FT', 'Cables');
    expect(ftRes.isCompatible).toBe(true);
    expect(ftRes.baseUom).toBe('M');
    expect(ftRes.convertedQuantity).toBeCloseTo(30.48);
  });

  it('keeps packaging units in distinct dimensions and does not assume EA interchangeability', () => {
    const boxRes = Module2VolumeAggregationCalculators.convertUom(10, 'BOX', 'Generic Hardware Parts');
    expect(boxRes.isCompatible).toBe(true);
    expect(boxRes.baseUom).toBe('BOX');
    expect(boxRes.convertedQuantity).toBe(10);
    expect(boxRes.auditRecord?.dimension).toBe('PACKAGING_BOX');

    const bagRes = Module2VolumeAggregationCalculators.convertUom(50, 'BAG', 'Refractory Mortar');
    expect(bagRes.isCompatible).toBe(true);
    expect(bagRes.baseUom).toBe('BAG');
    expect(bagRes.convertedQuantity).toBe(50);
    expect(bagRes.auditRecord?.dimension).toBe('PACKAGING_BAG');

    const drumRes = Module2VolumeAggregationCalculators.convertUom(4, 'DRUM', 'Specialty Lubricant');
    expect(drumRes.isCompatible).toBe(true);
    expect(drumRes.baseUom).toBe('DRUM');
    expect(drumRes.convertedQuantity).toBe(4);
    expect(drumRes.auditRecord?.dimension).toBe('PACKAGING_DRUM');
  });

  it('strictly blocks keyword-only UOM conversions and authorizes only via approved metadata (Prompt 445)', () => {
    // 1. Keyword-only match: MUST NOT independently authorize conversion; suggests interpretation for review
    const keywordOnlyRes = Module2VolumeAggregationCalculators.convertUom(
      100,
      'MT',
      'Imported Thermal Coal 5500 GAR',
      'Fuel & Energy'
    );
    expect(keywordOnlyRes.isCompatible).toBe(false);
    expect(keywordOnlyRes.convertedQuantity).toBe(0);
    expect(keywordOnlyRes.baseUom).toBe('MT'); // Preserves raw UOM
    expect(keywordOnlyRes.exclusionReason).toContain('FURTHER_DATA_REQUIRED');
    expect(keywordOnlyRes.auditRecord?.validationStatus).toBe('FURTHER_DATA_REQUIRED');
    expect(keywordOnlyRes.auditRecord?.suggestedInterpretation).toContain('Suggested interpretation for human review: Physical MASS');

    // 2. Length keyword-only match: Also blocked from conversion; suggests length for review
    const cableKeywordRes = Module2VolumeAggregationCalculators.convertUom(
      500,
      'MT',
      'Armoured Power Cable 4CX16',
      'Electrical Cables'
    );
    expect(cableKeywordRes.isCompatible).toBe(false);
    expect(cableKeywordRes.convertedQuantity).toBe(0);
    expect(cableKeywordRes.baseUom).toBe('MT');
    expect(cableKeywordRes.auditRecord?.suggestedInterpretation).toContain('Suggested interpretation for human review: Physical LENGTH');

    // 3. Approved authoritative source metadata: Authorizes compatible conversion
    const approvedMassMetadata = {
      rawUom: 'MT',
      targetBaseUom: 'MT',
      dimension: 'MASS',
      toBaseFactor: 1.0,
      approvedSource: 'SAP ERP Table T006 UOM Master Record',
      provenanceDocument: 'ERP Customizing Table T006 (ISO code TNE)',
      validationStatus: 'APPROVED' as const
    };
    const authorizedMassRes = Module2VolumeAggregationCalculators.convertUom(
      100,
      'MT',
      'Imported Thermal Coal 5500 GAR',
      'Fuel & Energy',
      { approvedMapping: approvedMassMetadata }
    );
    expect(authorizedMassRes.isCompatible).toBe(true);
    expect(authorizedMassRes.baseUom).toBe('MT');
    expect(authorizedMassRes.convertedQuantity).toBe(100);
    expect(authorizedMassRes.auditRecord?.dimension).toBe('MASS');
    expect(authorizedMassRes.auditRecord?.validationStatus).toBe('APPROVED');
    expect(authorizedMassRes.auditRecord?.provenanceDocument).toBe('ERP Customizing Table T006 (ISO code TNE)');

    // 4. Inconclusive metadata without keywords: flagged as inconclusive
    const ambigRes = Module2VolumeAggregationCalculators.convertUom(50, 'MT', 'General Workshop Hardware', 'General Procurement');
    expect(ambigRes.isCompatible).toBe(false);
    expect(ambigRes.baseUom).toBe('MT');
    expect(ambigRes.convertedQuantity).toBe(0);
    expect(ambigRes.exclusionReason).toContain('FURTHER_DATA_REQUIRED');
    expect(ambigRes.auditRecord?.suggestedInterpretation).toContain('Inconclusive');

    // 5. Test alias M.T
    const dotAmbig = Module2VolumeAggregationCalculators.convertUom(20, 'M.T', 'Unspecified Supply');
    expect(dotAmbig.isCompatible).toBe(false);
    expect(dotAmbig.baseUom).toBe('M.T');
  });

  it('preserves native packaging unit when supporting evidence is unavailable in repository', () => {
    const glovesRes = Module2VolumeAggregationCalculators.convertUom(25, 'PACK', 'Leather Safety Gloves Industrial');
    expect(glovesRes.isCompatible).toBe(true);
    expect(glovesRes.baseUom).toBe('PACK');
    expect(glovesRes.convertedQuantity).toBe(25);
    expect(glovesRes.auditRecord?.conversionSource).toContain('Unverified');

    const entry = VERIFIED_MATERIAL_PACKAGING_TABLE.SAFETY_GLOVES_PAIR_PACK;
    if (entry) {
      entry.actionApplied = true;
      entry.supportingEvidenceAvailable = true;
      const vRes = Module2VolumeAggregationCalculators.convertUom(25, 'PACK', 'Leather Safety Gloves Industrial');
      expect(vRes.isCompatible).toBe(true);
      expect(vRes.baseUom).toBe('PAIR');
      expect(vRes.convertedQuantity).toBe(250);
      entry.actionApplied = false;
      entry.supportingEvidenceAvailable = false;
    }
  });

  it('preserves native volume in KL and flags HSD density for validation without supporting evidence', () => {
    const dRes = Module2VolumeAggregationCalculators.convertUom(10000, 'LTR', 'High Speed Diesel Fuel IS 1460');
    expect(dRes.isCompatible).toBe(true);
    expect(dRes.baseUom).toBe('KL');
    expect(dRes.convertedQuantity).toBe(10);
    expect(dRes.densityRecord?.applied).toBe(false);
    expect(dRes.densityRecord?.supportingEvidenceAvailable).toBe(false);
    expect(dRes.densityRecord?.validationStatus).toBe('TECHNICAL_VALIDATION_REQUIRED');
    expect(dRes.densityRecord?.standardSource).toContain('IS 1460');

    const entry = VERIFIED_MATERIAL_DENSITY_TABLE.HSD_DIESEL;
    if (entry) {
      entry.actionApplied = true;
      const vRes = Module2VolumeAggregationCalculators.convertUom(10000, 'LTR', 'High Speed Diesel Fuel IS 1460');
      expect(vRes.isCompatible).toBe(true);
      expect(vRes.baseUom).toBe('MT');
      expect(vRes.convertedQuantity).toBe(8.4);
      expect(vRes.densityRecord?.applied).toBe(true);
      entry.actionApplied = false;
    }
  });

  it('rejects unknown or incompatible UOMs cleanly with audit trail', () => {
    const badRes = Module2VolumeAggregationCalculators.convertUom(10, 'BARRELS_XYZ', 'Unknown Commodity');
    expect(badRes.isCompatible).toBe(false);
    expect(badRes.convertedQuantity).toBe(0);
    expect(badRes.exclusionReason).toContain('Incompatible or unverified');
    expect(badRes.auditRecord?.isCompatible).toBe(false);
  });

  it('classifies demand recurrence accurately per evidence-based taxonomy (Prompt 444)', () => {
    expect(Module2VolumeAggregationCalculators.classifyDemandRecurrence([]).classification).toBe('INSUFFICIENT_HISTORY');

    const singleOrder: StrategicInputTransaction[] = [
      { vendor_name: 'V1', material_desc: 'M1', quantity: 1, unit_price: 100, total_spend_inr: 100, po_date: '2024-01-15' }
    ];
    expect(Module2VolumeAggregationCalculators.classifyDemandRecurrence(singleOrder).classification).toBe('INSUFFICIENT_HISTORY');

    // Several purchases in one month without project proof must NOT be inferred as project
    const oneMonthOrders: StrategicInputTransaction[] = [
      { vendor_name: 'V1', material_desc: 'Standard Hardware M1', quantity: 1, unit_price: 100, total_spend_inr: 100, po_date: '2024-01-10' },
      { vendor_name: 'V1', material_desc: 'Standard Hardware M1', quantity: 2, unit_price: 100, total_spend_inr: 200, po_date: '2024-01-25' }
    ];
    expect(Module2VolumeAggregationCalculators.classifyDemandRecurrence(oneMonthOrders).classification).toBe('INSUFFICIENT_HISTORY');

    // Supported by discrete project identifier
    const projectOrders: StrategicInputTransaction[] = [
      { po_number: 'PRJ-EXPANSION-001', vendor_name: 'V1', material_desc: 'Discrete Project Turbine', quantity: 1, unit_price: 100, total_spend_inr: 100, po_date: '2024-01-10' }
    ];
    const prjRes = Module2VolumeAggregationCalculators.classifyDemandRecurrence(projectOrders);
    expect(prjRes.classification).toBe('ONE_TIME_PROJECT');
    expect(prjRes.evidence).toContain('PRJ-EXPANSION-001');
    expect(prjRes.sourceTransactionDates).toContain('2024-01-10');

    // Supported by seasonal evidence
    const seasonalOrders: StrategicInputTransaction[] = [
      { vendor_name: 'V1', material_desc: 'Annual Monsoon Shutdown Maintenance Gaskets', quantity: 1, unit_price: 100, total_spend_inr: 100, po_date: '2024-02-01' }
    ];
    const seaRes = Module2VolumeAggregationCalculators.classifyDemandRecurrence(seasonalOrders);
    expect(seaRes.classification).toBe('PERIODIC_SEASONAL');
    expect(seaRes.evidence).toContain('seasonal');

    // Orders spanning 4 months without contract proof must NOT be automatically inferred as recurring
    const fourMonthsNoContract: StrategicInputTransaction[] = [
      { vendor_name: 'V1', material_desc: 'Spot Consumables', quantity: 1, unit_price: 100, total_spend_inr: 100, po_date: '2024-01-15' },
      { vendor_name: 'V1', material_desc: 'Spot Consumables', quantity: 1, unit_price: 100, total_spend_inr: 100, po_date: '2024-09-05' }
    ];
    expect(Module2VolumeAggregationCalculators.classifyDemandRecurrence(fourMonthsNoContract).classification).toBe('INSUFFICIENT_HISTORY');

    // Supported by documented rate contract or blanket PO
    const recurringContractOrders: StrategicInputTransaction[] = [
      { po_number: 'BPO-2024-ANNUAL', vendor_name: 'V1', material_desc: 'Standing Rate Contract Delivery', quantity: 1, unit_price: 100, total_spend_inr: 100, po_date: '2024-01-15' }
    ];
    const recRes = Module2VolumeAggregationCalculators.classifyDemandRecurrence(recurringContractOrders);
    expect(recRes.classification).toBe('RECURRING');
    expect(recRes.evidence).toContain('rate contract');
  });

  it('computes plant volume dispersion index as a descriptive metric', () => {
    const singlePlant = new Map([['1000', 500]]);
    expect(Module2VolumeAggregationCalculators.computePlantVolumeDispersionIndex(singlePlant, 500)).toBe(0.0);

    const multiPlant = new Map([
      ['1000', 300],
      ['2200', 200]
    ]);
    const index = Module2VolumeAggregationCalculators.computePlantVolumeDispersionIndex(multiPlant, 500);
    expect(index).toBe(0.4);
  });

  it('isolates unmatched adjustments and credit notes without corrupting regular volume', () => {
    const mixed: StrategicInputTransaction[] = [
      { id: 'TX-1', vendor_name: 'V1', material_desc: 'M1', quantity: 10, unit_price: 100, total_spend_inr: 1000 },
      { id: 'ADJ-1', vendor_name: 'V1', material_desc: 'M1', quantity: -2, unit_price: 100, total_spend_inr: -200 }
    ];
    const proc = Module2VolumeAggregationCalculators.processAdjustmentsAndCreditNotes(mixed);
    expect(proc.regularTransactions.length).toBe(1);
    expect(proc.unmatchedAdjustments.length).toBe(1);
    expect(proc.unmatchedAdjustments[0].spendInr).toBe(-200);
    expect(proc.netAdjustmentSpendInr).toBe(-200);
  });

  it('handles unknown or incompatible UOMs by excluding quantity and flagging', () => {
    const res = Module2VolumeAggregationCalculators.convertUom(100, 'CUSTOM_UNVERIFIED_XYZ', 'Special Item');
    expect(res.isCompatible).toBe(false);
    expect(res.convertedQuantity).toBe(0);
    expect(res.baseUom).toBe('CUSTOM_UNVERIFIED_XYZ');
    expect(res.exclusionReason).toContain('Incompatible or unverified unit of measure');
  });

  it('handles zero or negative total quantity in computePlantVolumeDispersionIndex', () => {
    const plants = new Map([['P1', 0]]);
    expect(Module2VolumeAggregationCalculators.computePlantVolumeDispersionIndex(plants, 0)).toBe(0.0);
  });
});
