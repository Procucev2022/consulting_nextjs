/**
 * Module 2 — Lever 3: Material UNSPSC Mapping Register & Deterministic Classifier
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  MaterialMappingEntry, ClassificationCoverageSummary,
  MappingReviewStatus, UpdateMaterialMappingPayload
} from '../types/module2MaterialMapping';
import type { TaxonomyClassificationRule } from '../constants/module2MaterialMappingTaxonomy';
import { findTaxonomyRuleMatch } from '../constants/module2MaterialMappingTaxonomy';
import { extractMappingUpdate, calculateMappingCoverage } from './module2MaterialMappingCoverage';

const TAXONOMY_VERSION = 'UNv260801';
const PERSISTENCE_FILE = path.resolve(process.cwd(), 'data', 'material_mapping_register.json');

interface MaterialAggData {
  sourceMaterialId: string;
  sourceDescription: string;
  sourceCategory: string;
  totalSpendInr: number;
  transactionCount: number;
  suppliers: Set<string>;
  rawUnspscCode?: string;
  rawCommodity?: string;
}

export function getStrategicTransactionMaterialId(t: StrategicInputTransaction): string {
  const code = (t.material_code ?? '').trim();
  if (code) return code;
  const desc = (t.material_desc ?? '').trim();
  if (desc) return `UNCODED_${desc}`;
  return `TX_${t.id ?? 'UNKNOWN'}`;
}

export class Module2MaterialMappingRegister {
  private static persistentStore: Map<string, MaterialMappingEntry> = new Map();
  private static isInitialized = false;

  public static initialize(): void {
    if (this.isInitialized) return;
    try {
      if (fs.existsSync(PERSISTENCE_FILE)) {
        const raw = fs.readFileSync(PERSISTENCE_FILE, 'utf-8');
        const list: MaterialMappingEntry[] = JSON.parse(raw);
        for (const item of list) {
          this.persistentStore.set(item.sourceMaterialId, item);
        }
        logger.info('Loaded material mapping register from disk', { count: this.persistentStore.size });
      }
    } catch (err) {
      logger.warn('Failed to load mapping register from disk, initializing fresh', { err });
    }
    this.isInitialized = true;
  }

  public static persistStore(): void {
    try {
      const dir = path.dirname(PERSISTENCE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const array = Array.from(this.persistentStore.values());
      fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify(array, null, 2), 'utf-8');
    } catch (err) {
      logger.warn('Failed to persist material mapping register', { err });
    }
  }

  public static classifyMaterials(txs: StrategicInputTransaction[], assessmentId?: string): {
    register: MaterialMappingEntry[];
    coverage: ClassificationCoverageSummary;
    exceptions: MaterialMappingEntry[];
    materialCodeToMapping: Map<string, MaterialMappingEntry>;
  } {
    this.initialize();
    const aggMap = this.aggregateTransactions(txs);
    const register: MaterialMappingEntry[] = [];
    const materialCodeToMapping = new Map<string, MaterialMappingEntry>();

    for (const [matId, agg] of aggMap.entries()) {
      const entry = this.classifySingleMaterial(matId, agg, assessmentId);
      register.push(entry);
      materialCodeToMapping.set(matId, entry);
    }

    const coverage = this.calculateCoverage(register);
    const exceptions = register.filter((e) => e.reviewStatus === 'AWAITING_REVIEW');

    return { register, coverage, exceptions, materialCodeToMapping };
  }

  private static aggregateTransactions(txs: StrategicInputTransaction[]): Map<string, MaterialAggData> {
    const map = new Map<string, MaterialAggData>();
    for (const t of txs) {
      const matId = getStrategicTransactionMaterialId(t);
      const desc = (t.material_desc ?? matId).trim();
      const cat = (t.spend_category ?? 'General').trim();
      const supp = (t.vendor_code ?? t.vendor_name ?? '').trim();

      let agg = map.get(matId);
      if (!agg) {
        agg = {
          sourceMaterialId: matId, sourceDescription: desc, sourceCategory: cat,
          totalSpendInr: 0, transactionCount: 0, suppliers: new Set(),
          rawUnspscCode: t.unspsc_code?.trim(),
          rawCommodity: (t.unspsc_commodity ?? t.unspsc_category)?.trim()
        };
        map.set(matId, agg);
      }
      agg.totalSpendInr += t.total_spend_inr ?? 0;
      agg.transactionCount += 1;
      if (supp) agg.suppliers.add(supp);
    }
    return map;
  }

  private static classifySingleMaterial(
    matId: string,
    agg: MaterialAggData,
    assessmentId?: string
  ): MaterialMappingEntry {
    const totalSpendCr = Math.round((agg.totalSpendInr / 10000000) * 10000) / 10000;
    const baseEntry = {
      sourceMaterialId: matId,
      sourceDescription: agg.sourceDescription,
      sourceCategory: agg.sourceCategory,
      taxonomyVersion: TAXONOMY_VERSION,
      mappingDate: new Date().toISOString().split('T')[0],
      totalSpendInr: Math.round(agg.totalSpendInr * 100) / 100,
      totalSpendCr,
      transactionCount: agg.transactionCount,
      qualifyingSuppliersCount: agg.suppliers.size
    };

    // Tier 1: Check persistent store (assessment-scoped first, then global)
    const scopedKey = assessmentId ? `${assessmentId}::${matId}` : matId;
    const persisted = this.persistentStore.get(scopedKey) || this.persistentStore.get(matId);
    if (persisted && (persisted.reviewStatus === 'CLIENT_APPROVED' || persisted.reviewStatus === 'APPROVED')) {
      const status: MappingReviewStatus =
        persisted.reviewStatus === 'CLIENT_APPROVED' ? 'CLIENT_APPROVED' : 'TAXONOMY_VERIFIED';
      return { ...persisted, ...baseEntry, reviewStatus: status };
    }

    // Tier 1b: Exact 8-digit code present in transaction data
    if (agg.rawUnspscCode && agg.rawUnspscCode.length === 8 && agg.rawUnspscCode !== '00000000') {
      return this.buildApprovedTransactionEntry(baseEntry, agg);
    }

    // Tier 2: Strong evidence-based material description match
    const ruleMatch = findTaxonomyRuleMatch(agg.sourceDescription);
    if (ruleMatch) {
      return this.buildRuleMatchEntry(baseEntry, ruleMatch);
    }

    // Tier 4: Manual review required (unresolved)
    return this.buildAwaitingReviewEntry(baseEntry);
  }

  private static buildApprovedTransactionEntry(
    base: Partial<MaterialMappingEntry>,
    agg: MaterialAggData
  ): MaterialMappingEntry {
    const code = agg.rawUnspscCode || '';
    return {
      ...(base as MaterialMappingEntry),
      assignedUnspscCode: code,
      assignedUnspscTitle: agg.rawCommodity || `UNSPSC Commodity (${code})`,
      unspscSegment: `${code.substring(0, 2)}000000`,
      unspscFamily: `${code.substring(0, 4)}0000`,
      unspscClass: `${code.substring(0, 6)}00`,
      unspscCommodity: code,
      mappingMethod: 'EXACT_IDENTIFIER',
      confidenceScore: 98,
      evidence: 'Verified exact 8-digit UNSPSC identifier in transaction record',
      reviewStatus: 'TAXONOMY_VERIFIED'
    };
  }

  private static buildRuleMatchEntry(
    base: Partial<MaterialMappingEntry>,
    rule: TaxonomyClassificationRule
  ): MaterialMappingEntry {
    const isVerified = rule.confidenceScore >= 95;
    const status: MappingReviewStatus = isVerified ? 'TAXONOMY_VERIFIED' : 'PROVISIONAL';
    return {
      ...(base as MaterialMappingEntry),
      assignedUnspscCode: rule.unspscCode,
      assignedUnspscTitle: rule.unspscTitle,
      unspscSegment: rule.segmentTitle,
      unspscFamily: rule.familyTitle,
      unspscClass: rule.classTitle,
      unspscCommodity: rule.commodityTitle,
      mappingMethod: 'MATERIAL_DESCRIPTION_MATCH',
      confidenceScore: rule.confidenceScore,
      evidence: rule.evidence,
      reviewStatus: status
    };
  }

  private static buildAwaitingReviewEntry(base: Partial<MaterialMappingEntry>): MaterialMappingEntry {
    return {
      ...(base as MaterialMappingEntry),
      assignedUnspscCode: '00000000',
      assignedUnspscTitle: 'Unclassified Material — Engineering Review Queued',
      unspscSegment: 'Unclassified Segment',
      unspscFamily: 'Unclassified Family',
      unspscClass: 'Unclassified Class',
      unspscCommodity: 'Unclassified Commodity',
      mappingMethod: 'MANUAL_REVIEW_REQUIRED',
      confidenceScore: 0,
      evidence: 'Description lacks specific technical taxonomy keywords; queued for review',
      reviewStatus: 'AWAITING_REVIEW',
      reviewReason: 'Ambiguous or client-proprietary material description requiring engineering classification.'
    };
  }

  public static getMapping(sourceMaterialId: string, assessmentId?: string): MaterialMappingEntry | undefined {
    this.initialize();
    const scopedKey = assessmentId ? `${assessmentId}::${sourceMaterialId}` : sourceMaterialId;
    const directMatch = this.persistentStore.get(scopedKey);
    return directMatch || (!assessmentId ? this.persistentStore.get(sourceMaterialId) : undefined);
  }

  public static updateMapping(
    payloadOrMaterialId: UpdateMaterialMappingPayload | string,
    partialOrAssessmentId?: Partial<MaterialMappingEntry> | string,
    assessmentIdParam?: string
  ): MaterialMappingEntry {
    this.initialize();
    const parsed = extractMappingUpdate(payloadOrMaterialId, partialOrAssessmentId, assessmentIdParam);
    const scopedKey = parsed.assessmentId
      ? `${parsed.assessmentId}::${parsed.sourceMaterialId}`
      : parsed.sourceMaterialId;
    const existing = this.persistentStore.get(scopedKey) || this.persistentStore.get(parsed.sourceMaterialId);
    const updated: MaterialMappingEntry = {
      ...(existing || ({} as MaterialMappingEntry)),
      ...parsed.extra,
      sourceMaterialId: parsed.sourceMaterialId,
      assignedUnspscCode: parsed.unspscCode,
      unspsc_code: parsed.unspscCode,
      reviewStatus: parsed.reviewStatus,
      reviewedBy: parsed.reviewedBy,
      auditNotes: parsed.auditNotes,
      mappingDate: new Date().toISOString().split('T')[0],
      confidenceScore: 100,
      mappingMethod: 'EXACT_IDENTIFIER'
    };
    this.persistentStore.set(scopedKey, updated);
    this.persistStore();
    return updated;
  }

  private static calculateCoverage(register: MaterialMappingEntry[]): ClassificationCoverageSummary {
    return calculateMappingCoverage(register);
  }
}
