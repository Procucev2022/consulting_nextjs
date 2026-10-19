/**
 * Module 2 — Lever 4: Volume Aggregation Conversion & Ambiguity Helper
 * Handles density factors, material packaging conversions, and ambiguous UOM resolution.
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10.
 */

import {
  VERIFIED_MATERIAL_DENSITY_TABLE,
  VERIFIED_MATERIAL_PACKAGING_TABLE,
  AMBIGUOUS_UOM_ABBREVIATIONS,
  APPROVED_AUTHORITATIVE_UOM_MAPPINGS
} from '../constants/module2VolumeAggregation';
import type { UomConversionResult } from './module2VolumeAggregationCalculators';

const MASS_REGEX =
  /\b(ton|tonne|metric\s*tonne|coal|cement|clinker|gypsum|limestone|slag|fly\s*ash|bauxite|iron\s*ore|steel|billet|scrap|bulk\s*solid|powder|chemicals?|fertilizer|aggregate|sand)\b/i;

const MASS_CAT_REGEX = /\b(fuel|raw\s*material|metal|chemical|refractory|mineral)\b/i;

const LENGTH_REGEX =
  /\b(metre|meter|linear|running\s*metre|cable|wire|rope|hose|pipe|conveyor\s*belt|fabric|cloth|tape|extrusion)\b/i;

const LENGTH_CAT_REGEX = /\b(cable|fabric|piping|hose|textile)\b/i;

export class Module2VolumeAggregationConversionHelper {
  public static checkDensityConversion(
    quantity: number,
    uom: string,
    materialDesc: string
  ): UomConversionResult | null {
    if (uom !== 'LTR' && uom !== 'LT' && uom !== 'L' && uom !== 'KL') return null;

    for (const key of Object.keys(VERIFIED_MATERIAL_DENSITY_TABLE)) {
      const entry = VERIFIED_MATERIAL_DENSITY_TABLE[key];
      if (entry.materialNamePattern.test(materialDesc)) {
        const volInKl = uom === 'KL' ? quantity : quantity * 0.001;
        if (!entry.actionApplied) {
          return {
            convertedQuantity: volInKl,
            baseUom: 'KL',
            isCompatible: true,
            densityRecord: {
              applied: false,
              densityFactor: entry.nominalDensityFactor,
              sourceUom: uom,
              targetUom: entry.targetUom,
              standardSource: entry.standardSource,
              effectiveDate: entry.effectiveDate,
              applicableGrade: entry.applicableGrade,
              supportingEvidenceAvailable: entry.supportingEvidenceAvailable,
              assumptionsAndLimitations: entry.assumptionsAndLimitations,
              validationStatus: 'TECHNICAL_VALIDATION_REQUIRED',
              formula: entry.formula
            },
            auditRecord: {
              originalUom: uom,
              convertedUom: 'KL',
              conversionFactor: uom === 'KL' ? 1.0 : 0.001,
              conversionSource: entry.standardSource,
              conversionFormula: `Native Vol (KL) = ${quantity} ${uom} * ${uom === 'KL' ? 1.0 : 0.001}`,
              dimension: 'VOLUME',
              isCompatible: true
            }
          };
        }
        const massInMt = volInKl * entry.nominalDensityFactor;
        return {
          convertedQuantity: massInMt,
          baseUom: entry.targetUom,
          isCompatible: true,
          densityRecord: {
            applied: true,
            densityFactor: entry.nominalDensityFactor,
            sourceUom: uom,
            targetUom: entry.targetUom,
            standardSource: entry.standardSource,
            effectiveDate: entry.effectiveDate,
            applicableGrade: entry.applicableGrade,
            supportingEvidenceAvailable: true,
            formula: entry.formula
          },
          auditRecord: {
            originalUom: uom,
            convertedUom: entry.targetUom,
            conversionFactor: entry.nominalDensityFactor,
            conversionSource: entry.standardSource,
            conversionFormula: `Mass (MT) = ${volInKl} KL * ${entry.nominalDensityFactor} MT/KL`,
            dimension: 'MASS',
            isCompatible: true
          }
        };
      }
    }
    return null;
  }

  public static checkPackagingConversion(
    quantity: number,
    uom: string,
    materialDesc: string
  ): UomConversionResult | null {
    for (const key of Object.keys(VERIFIED_MATERIAL_PACKAGING_TABLE)) {
      const entry = VERIFIED_MATERIAL_PACKAGING_TABLE[key];
      if (entry.sourceUom === uom && entry.materialNamePattern.test(materialDesc)) {
        if (!entry.actionApplied || !entry.supportingEvidenceAvailable) {
          return {
            convertedQuantity: quantity,
            baseUom: entry.sourceUom,
            isCompatible: true,
            auditRecord: {
              originalUom: uom,
              convertedUom: entry.sourceUom,
              conversionFactor: 1.0,
              conversionSource: `${entry.standardSource} (Unverified — Native packaging preserved)`,
              conversionFormula: 'Native packaging quantity preserved; conversion unverified in project files',
              dimension: `PACKAGING_${entry.sourceUom}`,
              isCompatible: true
            }
          };
        }
        const converted = quantity * entry.unitsPerPackage;
        return {
          convertedQuantity: converted,
          baseUom: entry.targetUom,
          isCompatible: true,
          auditRecord: {
            originalUom: uom,
            convertedUom: entry.targetUom,
            conversionFactor: entry.unitsPerPackage,
            conversionSource: entry.standardSource,
            conversionFormula: entry.formula,
            dimension: 'PACKAGING_VERIFIED',
            isCompatible: true
          }
        };
      }
    }
    return null;
  }

  private static buildApprovedResult(
    quantity: number,
    uom: string,
    approved: import('../types/module2VolumeAggregation').ApprovedAuthoritativeUomMapping
  ): UomConversionResult {
    const converted = quantity * approved.toBaseFactor;
    return {
      convertedQuantity: converted,
      baseUom: approved.targetBaseUom,
      isCompatible: true,
      auditRecord: {
        originalUom: uom,
        convertedUom: approved.targetBaseUom,
        conversionFactor: approved.toBaseFactor,
        conversionSource: approved.approvedSource,
        conversionFormula: `${quantity} ${uom} * ${approved.toBaseFactor} = ${converted} ${approved.targetBaseUom}`,
        dimension: approved.dimension,
        isCompatible: true,
        validationStatus: 'APPROVED',
        provenanceDocument: approved.provenanceDocument
      }
    };
  }

  private static getSuggestedInterpretation(materialDesc: string, category?: string): string {
    const desc = materialDesc.toLowerCase();
    const cat = (category || '').toLowerCase();
    const isMass = MASS_REGEX.test(desc) || MASS_CAT_REGEX.test(cat);
    const isLength = LENGTH_REGEX.test(desc) || LENGTH_CAT_REGEX.test(cat);

    if (isMass && !isLength) {
      return 'Suggested interpretation for human review: Physical MASS (Metric Tonnes) based on descriptive terms, but pending authoritative ERP metadata.';
    }
    if (isLength && !isMass) {
      return 'Suggested interpretation for human review: Physical LENGTH (Metres) based on descriptive terms, but pending authoritative ERP metadata.';
    }
    return 'Inconclusive: Ambiguous UOM lacking physical dimension metadata.';
  }

  public static resolveAmbiguousUom(
    quantity: number,
    uom: string,
    materialDesc: string,
    category?: string,
    sourceMetadata?: {
      erpDimension?: string;
      approvedMapping?: import('../types/module2VolumeAggregation').ApprovedAuthoritativeUomMapping;
    }
  ): UomConversionResult | null {
    const isAmbiguous = (AMBIGUOUS_UOM_ABBREVIATIONS as readonly string[]).includes(uom);
    const approved = sourceMetadata?.approvedMapping || APPROVED_AUTHORITATIVE_UOM_MAPPINGS[uom];

    if (!isAmbiguous && !approved) {
      return null;
    }

    if (approved && approved.validationStatus === 'APPROVED') {
      return this.buildApprovedResult(quantity, uom, approved);
    }

    const suggested = this.getSuggestedInterpretation(materialDesc, category);
    const reason = `FURTHER_DATA_REQUIRED: Ambiguous UOM abbreviation '${uom}' lacking reliable ERP source metadata or approved authoritative mapping. Material description and category keywords may suggest possible interpretation for human review, but cannot independently authorize physical conversion.`;

    return {
      convertedQuantity: 0,
      baseUom: uom,
      isCompatible: false,
      exclusionReason: reason,
      auditRecord: {
        originalUom: uom,
        convertedUom: uom,
        conversionFactor: 0,
        conversionSource: 'Authoritative ERP Metadata Required (Prompt 445)',
        conversionFormula: 'None (Physical conversion unauthorized; raw quantity preserved)',
        dimension: 'AMBIGUOUS_UNRESOLVED',
        isCompatible: false,
        exclusionReason: reason,
        suggestedInterpretation: suggested,
        validationStatus: 'FURTHER_DATA_REQUIRED'
      }
    };
  }
}
