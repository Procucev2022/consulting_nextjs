/**
 * Module 2 — Lever 4: Volume Aggregation Calculators & Helpers
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import { UOM_STANDARD_CONVERSIONS } from '../constants/module2VolumeAggregation';
import { Module2VolumeAggregationConversionHelper } from './module2VolumeAggregationConversionHelper';
import { Module2VolumeAggregationDemandHelper } from './module2VolumeAggregationDemandHelper';
import { Module2VolumeAggregationAdjustmentsHelper } from './module2VolumeAggregationAdjustmentsHelper';
import type {
  VerifiedDensityConversionRecord,
  UomConversionAuditRecord,
  UnmatchedAdjustmentItem,
  DemandRecurrenceResult
} from '../types/module2VolumeAggregation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

export interface UomConversionResult {
  convertedQuantity: number;
  baseUom: string;
  isCompatible: boolean;
  exclusionReason?: string;
  densityRecord?: VerifiedDensityConversionRecord;
  auditRecord?: UomConversionAuditRecord;
}

export class Module2VolumeAggregationCalculators {
  /**
   * Evaluates UOM compatibility and converts quantity to standard base unit.
   * Enforces Prompt 444 safeguards: resolves ambiguous UOMs and verifies packaging/density evidence.
   */
  public static convertUom(
    quantity: number,
    rawUom: string,
    materialDesc: string,
    category?: string,
    sourceMetadata?: {
      erpDimension?: string;
      approvedMapping?: import('../types/module2VolumeAggregation').ApprovedAuthoritativeUomMapping;
    }
  ): UomConversionResult {
    const uom = (rawUom || 'EA').trim().toUpperCase();

    // 1. Check for audited material density (Prompt 440 Section 3)
    const densityRes = Module2VolumeAggregationConversionHelper.checkDensityConversion(quantity, uom, materialDesc);
    if (densityRes) return densityRes;

    // 2. Check for verified material packaging (Prompt 444 Section 3)
    const packRes = Module2VolumeAggregationConversionHelper.checkPackagingConversion(quantity, uom, materialDesc);
    if (packRes) return packRes;

    // 3. Resolve ambiguous UOM abbreviations (Prompt 445 Section 1)
    const ambigRes = Module2VolumeAggregationConversionHelper.resolveAmbiguousUom(
      quantity,
      uom,
      materialDesc,
      category,
      sourceMetadata
    );
    if (ambigRes) return ambigRes;

    // 4. Standard intra-dimensional conversion (unambiguous abbreviations)
    const standard = UOM_STANDARD_CONVERSIONS[uom];
    if (standard) {
      const converted = quantity * standard.toBaseRatio;
      return {
        convertedQuantity: converted,
        baseUom: standard.baseUom,
        isCompatible: true,
        auditRecord: {
          originalUom: uom,
          convertedUom: standard.baseUom,
          conversionFactor: standard.toBaseRatio,
          conversionSource: `Standard intra-dimensional mapping (${standard.dimension})`,
          conversionFormula: `${quantity} ${uom} * ${standard.toBaseRatio} = ${converted} ${standard.baseUom}`,
          dimension: standard.dimension,
          isCompatible: true
        }
      };
    }

    // Incompatible or unverified cross-dimensional UOM
    const reason = `Incompatible or unverified unit of measure: ${uom}`;
    return {
      convertedQuantity: 0,
      baseUom: uom,
      isCompatible: false,
      exclusionReason: reason,
      auditRecord: {
        originalUom: uom,
        convertedUom: uom,
        conversionFactor: 0,
        conversionSource: 'Unverified Unit Registry',
        conversionFormula: 'None (Conversion unverified)',
        dimension: 'UNKNOWN',
        isCompatible: false,
        exclusionReason: reason
      }
    };
  }

  /**
   * Classifies demand recurrence per Prompt 444 evidence-based taxonomy:
   * RECURRING, PERIODIC_SEASONAL, ONE_TIME_PROJECT, INSUFFICIENT_HISTORY.
   */
  public static classifyDemandRecurrence(
    transactions: StrategicInputTransaction[]
  ): DemandRecurrenceResult {
    return Module2VolumeAggregationDemandHelper.classify(transactions);
  }

  /**
   * Computes plant volume dispersion index (Descriptive indicator only, 0 to 1).
   */
  public static computePlantVolumeDispersionIndex(plantVolumes: Map<string, number>, totalQuantity: number): number {
    if (totalQuantity <= 0 || plantVolumes.size <= 1) {
      return 0.0;
    }
    let maxPlantVol = 0;
    for (const vol of plantVolumes.values()) {
      if (vol > maxPlantVol) maxPlantVol = vol;
    }
    const ratio = maxPlantVol / totalQuantity;
    return Math.max(0.0, Math.min(1.0, Number((1.0 - ratio).toFixed(4))));
  }

  /**
   * Isolates returns and credit notes. Links matching adjustments or records unmatched items.
   */
  public static processAdjustmentsAndCreditNotes(
    transactions: StrategicInputTransaction[]
  ): {
    regularTransactions: StrategicInputTransaction[];
    unmatchedAdjustments: UnmatchedAdjustmentItem[];
    netAdjustmentSpendInr: number;
  } {
    return Module2VolumeAggregationAdjustmentsHelper.processAdjustmentsAndCreditNotes(transactions);
  }
}
