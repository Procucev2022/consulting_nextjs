import fs from 'fs';
import path from 'path';
import { VgtModule1Runner } from './vgtModule1Runner';
import { AssessmentDatasetParser } from './assessmentDatasetParser';
import { AssessmentStore } from './assessmentStore';
import { getDevelopmentDataDir } from './assessmentPersistence';
import { Module2BundleBuilder } from './module2BundleBuilder';
import logger from '../utils/logger';
import type {
  StrategicInputTransaction,
  CategoryStrategicSourcingProfile,
  Module2StrategicSourcingDashboardSummary,
  Module2ToModule4HandoffPackage,
  Module2CanonicalInput,
  Module2OpportunityLedgerItem,
  Module2MathematicalBridge,
  Module2Top50VendorItem,
  Module2SupplierRiskItem,
  Module2PoConsolidationItem,
  Module2RecurringSpendItem,
  Module2ForensicSummary,
  AssessmentModule2CacheBundle,
  TransactionAttributionLedgerResult,
  AttributionLeverType,
  PersistedStoreData,
  AssessmentRecord,
  AssessmentAnalysisRun,
  AssessmentDataVersion
} from '../types';
import { Module2AttributionLedgerEngine } from './module2AttributionLedgerEngine';

export class Module2CanonicalService {
  private static assessmentCache = new Map<string, AssessmentModule2CacheBundle>();
  private static attributionCache = new Map<string, TransactionAttributionLedgerResult>();

  public static clearCache(): void {
    this.assessmentCache.clear();
    this.attributionCache.clear();
  }

  private static resolveVgtBundle(cacheKey: string, customPath?: string): AssessmentModule2CacheBundle {
    logger.info('Processing authoritative VGT regression baseline for Module 2', { cacheKey, customPath });
    const vgt = VgtModule1Runner.processVgtDataset(customPath);
    const bundle = Module2BundleBuilder.bundleFromParsed(vgt);
    this.assessmentCache.set(cacheKey, bundle);
    return bundle;
  }

  private static findAssessmentInDevStore(assessmentId: string): {
    assessment?: AssessmentRecord;
    runs: AssessmentAnalysisRun[];
    dataVersions: AssessmentDataVersion[];
  } {
    const devJsonPath = path.resolve(getDevelopmentDataDir(), 'assessments.json');
    if (!fs.existsSync(devJsonPath)) {
      return { runs: [], dataVersions: [] };
    }
    try {
      const devStore: PersistedStoreData = JSON.parse(fs.readFileSync(devJsonPath, 'utf8'));
      return {
        assessment: devStore.assessments?.find((a) => a.assessmentId === assessmentId),
        runs: (devStore.analysisRuns?.[assessmentId] || []) as AssessmentAnalysisRun[],
        dataVersions: (devStore.dataVersions?.[assessmentId] || []) as AssessmentDataVersion[]
      };
    } catch {
      return { runs: [], dataVersions: [] };
    }
  }

  private static resolveActiveRunAndVersion(
    assessment: AssessmentRecord,
    runs: AssessmentAnalysisRun[],
    dataVersions: AssessmentDataVersion[]
  ): { targetVersion: AssessmentDataVersion } {
    const activeRun =
      runs.find((r) => r.analysisRunId === assessment.activeAnalysisRunId && !r.isSuperseded) ||
      runs.find((r) => !r.isSuperseded && r.status === 'COMPLETED');

    if (!activeRun || activeRun.status !== 'COMPLETED' || !activeRun.canonicalModule1) {
      throw new Error(`Assessment '${assessment.assessmentId}' does not have completed Module 1 canonical results.`);
    }

    const targetVersion =
      dataVersions.find(
        (v) => v.dataVersionId === (activeRun.dataVersionId || assessment.activeDataVersionId) && !v.isSuperseded
      ) ||
      dataVersions.find((v) => !v.isSuperseded) ||
      dataVersions[0];

    if (!targetVersion) {
      throw new Error(`Assessment '${assessment.assessmentId}' has no active data version.`);
    }

    return { targetVersion };
  }

  private static resolveCustomerBundle(assessmentId: string, cacheKey: string): AssessmentModule2CacheBundle {
    const store = AssessmentStore.getInstance();
    let assessment: AssessmentRecord | undefined;
    let runs: AssessmentAnalysisRun[] = [];
    let dataVersions: AssessmentDataVersion[] = [];

    if (store?.getCustomDataDir?.()) {
      assessment = store.getAssessmentById(assessmentId);
      runs = store.getAnalysisRuns(assessmentId);
      dataVersions = store.getDataVersions(assessmentId);
    }

    if (!assessment) {
      const devData = this.findAssessmentInDevStore(assessmentId);
      if (devData.assessment) {
        assessment = devData.assessment;
        runs = devData.runs;
        dataVersions = devData.dataVersions;
      }
    }

    if (!assessment) {
      assessment = store.getAssessmentById(assessmentId);
      runs = store.getAnalysisRuns(assessmentId);
      dataVersions = store.getDataVersions(assessmentId);
    }

    if (!assessment) {
      throw new Error(`Assessment '${assessmentId}' was not found in persistence store.`);
    }

    const { targetVersion } = this.resolveActiveRunAndVersion(assessment, runs, dataVersions);

    const physicalPath = Module2BundleBuilder.resolveFilePath(targetVersion.filePath, targetVersion.fileName);
    logger.info('Processing customer assessment dataset for Module 2', {
      assessmentId,
      customerName: assessment.customerName,
      filePath: physicalPath
    });

    const parsed = AssessmentDatasetParser.parseDataset(physicalPath, {
      assessmentId,
      dataVersionId: targetVersion.dataVersionId,
      fileName: targetVersion.fileName,
      isTestData: assessment.isTestData
    });

    const bundle = Module2BundleBuilder.bundleFromParsed(parsed);
    this.assessmentCache.set(cacheKey, bundle);
    return bundle;
  }

  private static resolveAssessmentBundle(
    assessmentId?: string,
    customPath?: string,
    forceRefresh = false
  ): AssessmentModule2CacheBundle {
    if (!assessmentId && !customPath) {
      if (process.env.NODE_ENV === 'test') {
        assessmentId = 'AIC-2026-0001';
      } else {
        throw new Error('Assessment ID is required for Module 2 canonical calculations. Silent cross-customer fallback is strictly prohibited.');
      }
    }
    const isVgt = Boolean(customPath) || assessmentId === 'AIC-2026-0001';
    const cacheKey = customPath || assessmentId || 'AIC-2026-0001';

    if (!forceRefresh) {
      const cached = this.assessmentCache.get(cacheKey);
      if (cached) return cached;
    }

    if (isVgt) {
      return this.resolveVgtBundle(cacheKey, customPath);
    }

    return this.resolveCustomerBundle(assessmentId || '', cacheKey);
  }

  public static getCanonicalInput(assessmentId?: string, customPath?: string): Module2CanonicalInput {
    return this.resolveAssessmentBundle(assessmentId, customPath).canonicalInput;
  }

  public static getCanonicalTransactions(assessmentId?: string, customPath?: string): StrategicInputTransaction[] {
    return this.resolveAssessmentBundle(assessmentId, customPath).transactions;
  }

  private static parseBundleArgs(arg?: string | boolean, force = false): { id?: string; refresh: boolean } {
    return typeof arg === 'boolean' ? { refresh: arg } : { id: arg, refresh: force };
  }

  public static getSourcingAnalysis(arg?: string | boolean, force = false): {
    summary: Module2StrategicSourcingDashboardSummary;
    profiles: CategoryStrategicSourcingProfile[];
    handoffPackages: Module2ToModule4HandoffPackage[];
  } {
    const { id, refresh } = this.parseBundleArgs(arg, force);
    return this.resolveAssessmentBundle(id, undefined, refresh).sourcingResult;
  }

  public static getOpportunityLedger(arg?: string | boolean, force = false): Module2OpportunityLedgerItem[] {
    const { id, refresh } = this.parseBundleArgs(arg, force);
    return this.resolveAssessmentBundle(id, undefined, refresh).ledger;
  }

  public static getMathematicalBridge(arg?: string | boolean, force = false): Module2MathematicalBridge {
    const { id, refresh } = this.parseBundleArgs(arg, force);
    return this.resolveAssessmentBundle(id, undefined, refresh).bridge;
  }

  public static getTop50Vendors(id?: string): Module2Top50VendorItem[] {
    return this.resolveAssessmentBundle(id).top50;
  }

  public static getSupplierRiskAnalysis(id?: string): Module2SupplierRiskItem[] {
    return this.resolveAssessmentBundle(id).risk;
  }

  public static getPoConsolidationAnalysis(id?: string): Module2PoConsolidationItem[] {
    return this.resolveAssessmentBundle(id).po;
  }

  public static getRecurringSpendAnalysis(id?: string): Module2RecurringSpendItem[] {
    return this.resolveAssessmentBundle(id).recurring;
  }

  public static getForensicSummary(assessmentId?: string): Module2ForensicSummary {
    const b = this.resolveAssessmentBundle(assessmentId);
    return {
      canonicalInput: b.canonicalInput,
      bridge: b.bridge,
      ledger: b.ledger,
      dashboardSummary: b.sourcingResult.summary,
      profiles: b.sourcingResult.profiles,
      top50Vendors: b.top50,
      supplierRisk: b.risk,
      poConsolidation: b.po,
      recurringSpend: b.recurring
    };
  }

  public static getTransactionAttributionLedger(
    assessmentId?: string,
    priorityOrder?: AttributionLeverType[],
    force = false
  ): TransactionAttributionLedgerResult {
    if (!assessmentId) {
      throw new Error('Assessment ID is required for Transaction Attribution Ledger. Silent cross-customer fallback is strictly prohibited.');
    }
    const targetId = assessmentId;
    const cached = this.attributionCache.get(targetId);
    if (!force && !priorityOrder && cached) return cached;

    const canonicalInput = this.getCanonicalInput(targetId);
    const result = Module2AttributionLedgerEngine.buildAttributionLedger(targetId, canonicalInput, priorityOrder);
    if (!priorityOrder) this.attributionCache.set(targetId, result);
    return result;
  }
}
