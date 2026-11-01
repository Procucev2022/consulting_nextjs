import type {
  PCBIWeeklyIndex,
  PCBIUNSPSCMapping,
  PCBIClientPurchaseTransaction,
  PCBIDataQualityReport,
  PCBIQualityRating
} from '../types/pcbi';
import { Module3PcbiMappingService } from './module3PcbiMappingService';

const KEYWORD_PATTERNS: Array<{
  keywords: string[];
  pcbiId: string;
  quality: PCBIQualityRating;
}> = [
  { keywords: ['bearing', 'roller', 'ball bearing', 'skf', 'fag'], pcbiId: 'PCBI-BRG-COMP-001', quality: 'A' },
  { keywords: ['steel', 'plate', 'sheet', 'hrc', 'structural', 'liner'], pcbiId: 'PCBI-STEEL-001', quality: 'A' },
  { keywords: ['caustic', 'soda', 'naoh', 'lye', 'chemical'], pcbiId: 'PCBI-CHEM-CAUSTIC-001', quality: 'A' },
  { keywords: ['coal', 'fuel', 'thermal', 'boiler'], pcbiId: 'PCBI-ENERGY-COAL-001', quality: 'A' },
  { keywords: ['bag', 'hdpe', 'polymer', 'sack', 'packaging'], pcbiId: 'PCBI-POLY-HDPE-001', quality: 'A' },
  { keywords: ['cable', 'wire', 'conductor', 'copper'], pcbiId: 'PCBI-ELEC-CABLE-001', quality: 'A' },
  { keywords: ['lubricant', 'oil', 'hydraulic', 'grease'], pcbiId: 'PCBI-LUB-OIL-001', quality: 'B' },
  { keywords: ['refractory', 'brick', 'alumina', 'kiln'], pcbiId: 'PCBI-REFRAC-001', quality: 'B' }
];

export function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '2023-01-02';
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function generateComparableKey(tx: Partial<PCBIClientPurchaseTransaction>): string {
  const matCode = (tx.material_code || 'GENERIC').trim().toUpperCase();
  const uom = (tx.uom || 'EA').trim().toUpperCase();
  const spec = (tx.specification || '').trim().toUpperCase();
  const grade = (tx.grade || '').trim().toUpperCase();
  const brand = (tx.brand || '').trim().toUpperCase();

  const parts = [matCode, uom];
  if (spec) parts.push(`SPEC:${spec}`);
  if (grade) parts.push(`GRD:${grade}`);
  if (brand) parts.push(`BRD:${brand}`);
  return parts.join('|');
}

export function getIndexForDate(
  weeklyIndices: Map<string, PCBIWeeklyIndex>,
  pcbiId: string,
  dateStr: string,
  componentId?: string
): { indexValue: number; source: string; quality: PCBIQualityRating } | null {
  const monday = getMondayOfWeek(dateStr);
  const key = componentId ? `${pcbiId}:${componentId}:${monday}` : `${pcbiId}:${monday}`;
  const directMatch = weeklyIndices.get(key);

  if (
    directMatch &&
    typeof directMatch.index_value === 'number' &&
    !isNaN(directMatch.index_value) &&
    directMatch.index_value > 0
  ) {
    return {
      indexValue: directMatch.index_value,
      source: directMatch.source,
      quality: directMatch.quality_rating
    };
  }

  // Strictly NO blind fallback to 100.0 and NO unsafe forward-filling
  // Missing or unverified observations return explicit null
  return null;
}

export function validateModule2Authority(tx: Partial<PCBIClientPurchaseTransaction> & {
  module2_commodity?: string;
  module2_unspsc?: string;
  module3_commodity?: string;
}): { isValid: boolean; status: 'VALIDATED' | 'CLASSIFICATION_CONFLICT'; action: 'ALLOW' | 'BLOCK'; error?: string } {
  const mod2 = (tx.module2_commodity || '').trim().toLowerCase();
  const mod3 = (tx.module3_commodity || '').trim().toLowerCase();

  if (mod2 && mod3 && mod2 !== mod3) {
    return {
      isValid: false,
      status: 'CLASSIFICATION_CONFLICT',
      action: 'BLOCK',
      error: `Classification conflict: Module 3 classification '${tx.module3_commodity}' conflicts with Module 2 authority '${tx.module2_commodity}'.`
    };
  }

  return { isValid: true, status: 'VALIDATED', action: 'ALLOW' };
}

export const UNMAPPED_BENCHMARK_SIGNAL = 'UNMAPPED_BENCHMARK_SIGNAL';

function resolveAuditableAssessmentMapping(
  materialCode: string,
  assessmentId: string
): { pcbiId: string; quality: PCBIQualityRating; method: string; status?: string; action?: string } {
  const auditable = Module3PcbiMappingService.getMappingByMaterialCode(materialCode, assessmentId);
  if (!auditable) {
    return {
      pcbiId: UNMAPPED_BENCHMARK_SIGNAL,
      quality: 'C',
      method: 'UNMAPPED_NO_APPROVED_BENCHMARK',
      status: 'UNMAPPED_BENCHMARK_SIGNAL',
      action: 'SIGNAL_UNMAPPED'
    };
  }

  if (auditable.approvalStatus !== 'APPROVED') {
    return {
      pcbiId: UNMAPPED_BENCHMARK_SIGNAL,
      quality: 'C',
      method: 'AUDITABLE_MAPPING_PENDING_APPROVAL',
      status: 'UNAPPROVED_MAPPING',
      action: 'BLOCK_VARIANCE'
    };
  }

  if (
    auditable.specificationComparability === 'NOT_COMPARABLE' ||
    auditable.specificationComparability === 'UNVERIFIED'
  ) {
    return {
      pcbiId: UNMAPPED_BENCHMARK_SIGNAL,
      quality: 'C',
      method: 'INCOMPATIBLE_SPECIFICATION',
      status: 'INCOMPATIBLE_SPECIFICATION',
      action: 'BLOCK_VARIANCE'
    };
  }

  return {
    pcbiId: auditable.benchmarkSeriesId || UNMAPPED_BENCHMARK_SIGNAL,
    quality: auditable.confidenceRating === 'HIGH' ? 'A' : 'B',
    method: 'AUDITABLE_APPROVED_MAPPING',
    status: 'MAPPED_APPROVED',
    action: 'ALLOW'
  };
}

function resolveUnspscMapping(
  unspscMappings: Map<string, PCBIUNSPSCMapping>,
  unspscCode?: string
): { pcbiId: string; quality: PCBIQualityRating; method: string } | null {
  if (!unspscCode) return null;
  const cleanUnspsc = unspscCode.trim();
  const commodityMap = unspscMappings.get(cleanUnspsc);
  if (commodityMap) {
    return { pcbiId: commodityMap.pcbi_id, quality: commodityMap.quality_rating, method: 'UNSPSC_COMMODITY' };
  }

  if (cleanUnspsc.length >= 6) {
    const classCode = cleanUnspsc.substring(0, 6) + '00';
    const classMap = unspscMappings.get(classCode);
    if (classMap) {
      return { pcbiId: classMap.pcbi_id, quality: 'B', method: 'UNSPSC_CLASS' };
    }
  }
  return null;
}

export function resolvePCBIMapping(
  unspscMappings: Map<string, PCBIUNSPSCMapping>,
  tx: PCBIClientPurchaseTransaction & {
    assessmentId?: string;
    module2_commodity?: string;
    module2_unspsc?: string;
    module3_commodity?: string;
  }
): { pcbiId: string; quality: PCBIQualityRating; method: string; status?: string; action?: string } {
  // Hard validation: Module 2 is the ONLY classification authority
  const authorityCheck = validateModule2Authority(tx);
  if (!authorityCheck.isValid) {
    return {
      pcbiId: 'PCBI-CONFLICT-BLOCK',
      quality: 'C',
      method: 'BLOCKED_CLASSIFICATION_CONFLICT',
      status: 'CLASSIFICATION_CONFLICT',
      action: 'BLOCK'
    };
  }

  // Use Module 2 UNSPSC input if present
  const unspscResult = resolveUnspscMapping(unspscMappings, tx.module2_unspsc || tx.unspsc);
  if (unspscResult) {
    return unspscResult;
  }

  // Customer assessment scope: enforce auditable mapping infrastructure & block broad keyword matching
  if (tx.assessmentId) {
    return resolveAuditableAssessmentMapping(tx.material_code, tx.assessmentId);
  }

  const desc = `${tx.short_text || ''} ${tx.material_code || ''}`.toLowerCase();
  const match = KEYWORD_PATTERNS.find((p) => p.keywords.some((k) => desc.includes(k)));
  if (match) {
    return { pcbiId: match.pcbiId, quality: match.quality, method: 'AI_TEXT_CLASSIFICATION' };
  }

  // Strict Phase 1 Safety: No unsafe proxy fallback to Steel, Copper, or first series
  return {
    pcbiId: UNMAPPED_BENCHMARK_SIGNAL,
    quality: 'C',
    method: 'UNMAPPED_NO_BENCHMARK_SERIES',
    status: 'UNMAPPED_BENCHMARK_SIGNAL',
    action: 'SIGNAL_UNMAPPED'
  };
}


export function analyzeDataQuality(
  transactions: PCBIClientPurchaseTransaction[],
  unspscMappings: Map<string, PCBIUNSPSCMapping>
): PCBIDataQualityReport {
  let clean = 0;
  let warnings = 0;
  let errors = 0;
  let missingDates = 0;
  let missingQty = 0;
  let missingPrices = 0;
  let missingUnspsc = 0;
  const gradeCounts = { A: 0, B: 0, C: 0, UNMAPPED: 0 };
  const issues: PCBIDataQualityReport['validation_issues'] = [];

  transactions.forEach((t, idx) => {
    let rowErrors = 0;
    let rowWarnings = 0;

    if (!t.po_date) {
      missingDates++;
      rowErrors++;
      issues.push({
        row_index: idx + 1,
        po_number: t.po_number,
        material_code: t.material_code,
        severity: 'ERROR',
        message: 'Missing PO Transaction Date',
        field: 'po_date'
      });
    }
    if (t.quantity === undefined || t.quantity <= 0) {
      missingQty++;
      rowErrors++;
      issues.push({
        row_index: idx + 1,
        po_number: t.po_number,
        material_code: t.material_code,
        severity: 'ERROR',
        message: 'Invalid or missing Quantity (Q <= 0)',
        field: 'quantity'
      });
    }
    if (t.unit_price === undefined || t.unit_price <= 0) {
      missingPrices++;
      rowErrors++;
      issues.push({
        row_index: idx + 1,
        po_number: t.po_number,
        material_code: t.material_code,
        severity: 'ERROR',
        message: 'Invalid or missing Unit Price (P <= 0)',
        field: 'unit_price'
      });
    }
    if (!t.unspsc) {
      missingUnspsc++;
      rowWarnings++;
      issues.push({
        row_index: idx + 1,
        po_number: t.po_number,
        material_code: t.material_code,
        severity: 'WARNING',
        message: 'UNSPSC code missing (fallback to AI text classification)',
        field: 'unspsc'
      });
    }

    if (rowErrors > 0) {
      errors++;
    } else if (rowWarnings > 0) {
      warnings++;
    } else {
      clean++;
    }

    const mapping = resolvePCBIMapping(unspscMappings, t);
    if (mapping.quality === 'A') gradeCounts.A++;
    else if (mapping.quality === 'B') gradeCounts.B++;
    else gradeCounts.C++;
  });

  const total = transactions.length || 1;
  const errorPenalty = (errors / total) * 60;
  const warningPenalty = (warnings / total) * 20;
  const score = Math.max(0, Math.min(100, Math.round(100 - errorPenalty - warningPenalty)));

  return {
    overall_score: score,
    total_records: transactions.length,
    clean_records: clean,
    records_with_warnings: warnings,
    records_with_errors: errors,
    benchmarkable_records: transactions.length - errors,
    mapping_required_records: gradeCounts.C,
    missing_dates_count: missingDates,
    missing_quantities_count: missingQty,
    missing_prices_count: missingPrices,
    missing_unspsc_count: missingUnspsc,
    missing_indices_count: 0,
    quality_grade_counts: gradeCounts,
    validation_issues: issues.slice(0, 50)
  };
}
