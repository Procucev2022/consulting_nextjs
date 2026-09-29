/**
 * PCBI Commodity Data Lab — Service
 * Operational workspace for continuous commodity research, multi-source evidence,
 * and PCBI population distinct from the system-level PCBI Master.
 */

import { logger } from '../utils/logger';
import {
  INITIAL_COMMODITY_RESEARCH_QUEUE,
  INITIAL_COMMODITY_SOURCES,
  COMMODITY_WORKSPACE_TABS,
  DOMAIN_DETECTION_SIGNATURES,
  DOMAIN_ERROR_MESSAGES,
  DATA_LAB_SUPPORTED_FORMATS
} from '../constants/pcbiCommodityDataLab';
import type {
  CommodityResearchQueueRow,
  CommoditySourceEvidenceObject,
  CommodityWorkspaceDetail,
  CommodityWorkspaceTabKey,
  PCBIDomainValidationResult,
  PCBIDomainType,
  PCBIResearchDashboardMetrics
} from '../types/pcbiCommodityDataLab';
import type {
  UploadCommoditySourceInput,
  ApproveCommodityDataInput
} from '../types/validation';
import { pcbiPilotExpansionService } from './pcbiPilotExpansionService';
import {
  buildSourceEvidenceObject,
  buildSampleObservations,
  calculateDashboardMetrics,
  buildCommodityOverview
} from './pcbiCommodityDataLabHelpers';

export class PCBICommodityDataLabService {
  private static instance: PCBICommodityDataLabService;

  private queue: CommodityResearchQueueRow[] = JSON.parse(JSON.stringify(INITIAL_COMMODITY_RESEARCH_QUEUE));
  private sourcesRegistry: Record<string, CommoditySourceEvidenceObject[]> = JSON.parse(
    JSON.stringify(INITIAL_COMMODITY_SOURCES)
  );
  private approvedCommodities: Set<string> = new Set(['COM-CHM-CSL', 'COM-STEEL-HRC', 'COM-STEEL-TMT']);

  public static getInstance(): PCBICommodityDataLabService {
    if (!PCBICommodityDataLabService.instance) {
      PCBICommodityDataLabService.instance = new PCBICommodityDataLabService();
    }
    return PCBICommodityDataLabService.instance;
  }

  public getDashboardMetrics(): PCBIResearchDashboardMetrics {
    logger.info('Calculating PCBI Commodity Data Lab research dashboard metrics');
    return calculateDashboardMetrics(this.queue);
  }

  public getCommodityResearchQueue(): CommodityResearchQueueRow[] {
    logger.info('Fetching Commodity Research Queue', { totalRows: this.queue.length });
    return [...this.queue];
  }

  public getCommodityWorkspace(
    pcbiIdOrCommodityId: string,
    activeTab: CommodityWorkspaceTabKey = 'OVERVIEW'
  ): CommodityWorkspaceDetail {
    logger.info('Opening Commodity PCBI Workspace', { pcbiIdOrCommodityId, activeTab });

    const item = this.queue.find(
      (q) =>
        q.pcbiId.toUpperCase() === pcbiIdOrCommodityId.toUpperCase() ||
        q.commodityId.toUpperCase() === pcbiIdOrCommodityId.toUpperCase()
    );

    if (!item) {
      throw new Error(`Commodity / PCBI series not found: ${pcbiIdOrCommodityId}`);
    }

    const commodityId = item.commodityId;
    const sources = this.sourcesRegistry[commodityId] || [];
    const overview = buildCommodityOverview(item);
    const isApproved = this.approvedCommodities.has(commodityId);

    return {
      overview,
      sources: [...sources],
      extractedObservations: buildSampleObservations(sources),
      methodologyDetails: {
        methodologyId: `METH-${item.commodityId}`,
        title: `${item.commodity} Empirical Derivation Methodology`,
        status: item.methodologyStatus,
        conversionRule: 'Normalized to INR/MT Ex-Works excluding statutory GST',
        governanceNotes: 'Requires dual source verification and minimum 95% historical completeness.'
      },
      validationSummary: {
        passed: item.currentStatus === 'PRODUCTION_READY',
        totalObservations: sources.reduce((acc, s) => acc + s.extractedObservationsCount, 0),
        validObservations: sources.reduce(
          (acc, s) => acc + (s.validationStatus === 'VALIDATED' ? s.extractedObservationsCount : 0),
          0
        ),
        missingPeriods: item.currentStatus === 'PRODUCTION_READY' ? [] : ['2020-04 to 2020-12', '2022-01 to 2022-12'],
        criticalErrorsCount: item.currentStatus === 'PRODUCTION_READY' ? 0 : 2
      },
      approvalPackage: {
        isReadyForApproval: item.currentStatus === 'PRODUCTION_READY' || isApproved,
        canWriteToCatalog: isApproved,
        approvalGateStatus: isApproved
          ? 'APPROVED_READY_FOR_CATALOG'
          : 'LOCKED_PENDING_REVIEW',
        approverName: isApproved ? 'Sriman Admin' : undefined,
        approvedAt: isApproved ? '2026-09-28T12:00:00.000Z' : undefined
      },
      activeTab
    };
  }

  public validateUploadDomain(
    fileName: string,
    fileContentSnippet = '',
    targetArea: 'PCBI_MASTER' | 'COMMODITY_DATA_LAB' | 'MODULE_1_INGESTION' = 'COMMODITY_DATA_LAB'
  ): PCBIDomainValidationResult {
    logger.info('Validating upload file domain signatures', { fileName, targetArea });

    const combinedText = `${fileName} ${fileContentSnippet}`.toLowerCase();
    const normalizedText = combinedText.replace(/[_.-]/g, ' ');

    // Check Customer Purchase History Signatures
    const customerMatches = DOMAIN_DETECTION_SIGNATURES.CUSTOMER_PURCHASE_HISTORY.filter(
      (sig) => combinedText.includes(sig) || normalizedText.includes(sig)
    );
    if (customerMatches.length > 0) {
      const isAllowed = targetArea === 'MODULE_1_INGESTION';
      return {
        detectedDomain: 'CUSTOMER_PURCHASE_HISTORY',
        isAllowedInTarget: isAllowed,
        targetArea,
        errorMessage: isAllowed ? undefined : DOMAIN_ERROR_MESSAGES.CUSTOMER_DATA_IN_DATA_LAB.title,
        guidanceMessage: isAllowed ? undefined : DOMAIN_ERROR_MESSAGES.CUSTOMER_DATA_IN_DATA_LAB.message,
        matchedSignatures: customerMatches
      };
    }

    // Check PCBI Master System Data Signatures
    const masterMatches = DOMAIN_DETECTION_SIGNATURES.PCBI_MASTER_SYSTEM_DATA.filter(
      (sig) => combinedText.includes(sig) || normalizedText.includes(sig)
    );
    if (masterMatches.length > 0) {
      const isAllowed = targetArea === 'PCBI_MASTER';
      return {
        detectedDomain: 'PCBI_MASTER_SYSTEM_DATA',
        isAllowedInTarget: isAllowed,
        targetArea,
        errorMessage: isAllowed ? undefined : DOMAIN_ERROR_MESSAGES.MASTER_DATA_IN_DATA_LAB.title,
        guidanceMessage: isAllowed ? undefined : DOMAIN_ERROR_MESSAGES.MASTER_DATA_IN_DATA_LAB.message,
        matchedSignatures: masterMatches
      };
    }

    // Check Commodity Research Signatures
    const researchMatches = DOMAIN_DETECTION_SIGNATURES.COMMODITY_RESEARCH_EVIDENCE.filter((sig) =>
      combinedText.includes(sig)
    );
    if (researchMatches.length > 0) {
      const isAllowed = targetArea === 'COMMODITY_DATA_LAB';
      return {
        detectedDomain: 'COMMODITY_RESEARCH_EVIDENCE',
        isAllowedInTarget: isAllowed,
        targetArea,
        errorMessage: isAllowed ? undefined : DOMAIN_ERROR_MESSAGES.COMMODITY_RESEARCH_IN_MASTER.title,
        guidanceMessage: isAllowed ? undefined : DOMAIN_ERROR_MESSAGES.COMMODITY_RESEARCH_IN_MASTER.message,
        matchedSignatures: researchMatches
      };
    }

    // Default: treated as Commodity Research Evidence if in Data Lab, or PCBI Master if in PCBI Master
    const defaultDomain: PCBIDomainType =
      targetArea === 'PCBI_MASTER' ? 'PCBI_MASTER_SYSTEM_DATA' : 'COMMODITY_RESEARCH_EVIDENCE';

    return {
      detectedDomain: defaultDomain,
      isAllowedInTarget: true,
      targetArea,
      matchedSignatures: []
    };
  }

  public uploadCommoditySource(input: UploadCommoditySourceInput): CommoditySourceEvidenceObject {
    logger.info('Staging new Commodity Research Evidence Source Object', {
      commodityId: input.commodityId,
      pcbiId: input.pcbiId,
      documentName: input.documentName,
      fileType: input.fileType
    });

    if (!DATA_LAB_SUPPORTED_FORMATS.includes(input.fileType as (typeof DATA_LAB_SUPPORTED_FORMATS)[number])) {
      throw new Error(`Unsupported file format for Commodity Data Lab: ${input.fileType}`);
    }

    // Enforce Domain Validation: Customer Purchase History MUST be rejected immediately
    const domainCheck = this.validateUploadDomain(input.documentName, '', 'COMMODITY_DATA_LAB');
    if (!domainCheck.isAllowedInTarget) {
      throw new Error(`${domainCheck.errorMessage}: ${domainCheck.guidanceMessage}`);
    }

    const commodityId = input.commodityId;
    if (!this.sourcesRegistry[commodityId]) {
      this.sourcesRegistry[commodityId] = [];
    }

    const nextSourceNum = this.sourcesRegistry[commodityId].length + 1;
    const sourceId = `SRC-${commodityId.replace('COM-', '')}-${String(nextSourceNum).padStart(2, '0')}`;

    const newSource = buildSourceEvidenceObject(sourceId, input);

    // Coexistence rule: Multiple sources must coexist. Never overwrite existing sources.
    this.sourcesRegistry[commodityId].push(newSource);

    logger.info('Successfully staged evidence source object without writing to production PCBI', {
      commodityId,
      sourceId,
      totalSourcesForCommodity: this.sourcesRegistry[commodityId].length
    });

    return newSource;
  }

  public approveCommodityData(input: ApproveCommodityDataInput): {
    success: boolean;
    commodityId: string;
    pcbiId: string;
    approvalStatus: string;
    catalogVersionCreated: boolean;
    catalogVersionId: string;
    message: string;
  } {
    logger.info('Admin initiating formal approval gate for commodity data promotion', {
      commodityId: input.commodityId,
      pcbiId: input.pcbiId,
      approverName: input.approverName
    });

    const item = this.queue.find((q) => q.commodityId === input.commodityId || q.pcbiId === input.pcbiId);
    if (!item) {
      throw new Error(`Commodity ${input.commodityId} not found in research queue`);
    }

    // Update queue state upon approval
    item.currentStatus = 'PRODUCTION_READY';
    item.sourceStatus = 'SOURCE_VERIFIED';
    item.methodologyStatus = 'METHODOLOGY_APPROVED';
    item.researchStatus = 'RESOLVED';
    item.lastUpdated = new Date().toISOString();

    this.approvedCommodities.add(item.commodityId);

    // Flow into the existing dynamic PCBI catalog without duplicating the database
    const catalogResult = pcbiPilotExpansionService.manageCatalog('APPROVE', {
      commodity: item.commodity,
      pcbiId: item.pcbiId,
      source: 'PCBI Commodity Data Lab (Approved Evidence)'
    });

    return {
      success: true,
      commodityId: item.commodityId,
      pcbiId: item.pcbiId,
      approvalStatus: 'ADMIN_APPROVED',
      catalogVersionCreated: true,
      catalogVersionId: catalogResult.version,
      message: `Commodity ${item.commodity} successfully approved and promoted to dynamic PCBI catalog ${catalogResult.version}.`
    };
  }

  public getWorkspaceTabs(): typeof COMMODITY_WORKSPACE_TABS {
    return COMMODITY_WORKSPACE_TABS;
  }

  public resetForTesting(): void {
    this.queue = JSON.parse(JSON.stringify(INITIAL_COMMODITY_RESEARCH_QUEUE));
    this.sourcesRegistry = JSON.parse(JSON.stringify(INITIAL_COMMODITY_SOURCES));
    this.approvedCommodities = new Set(['COM-CHM-CSL', 'COM-STEEL-HRC', 'COM-STEEL-TMT']);
  }
}

export const pcbiCommodityDataLabService = PCBICommodityDataLabService.getInstance();
