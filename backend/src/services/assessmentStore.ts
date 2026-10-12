import type {
  AssessmentRecord,
  CustomerRecord,
  AssessmentDataVersion,
  AssessmentAnalysisRun,
  AssessmentAuditLog,
  PersistedStoreData
} from '../types/assessment';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateAssessmentInput,
  UpdateNdaStatusInput,
  UpdateDataStatusInput
} from '../types/assessmentValidation';
import {
  NDA_STATUSES,
  DATA_STATUSES,
  ASSESSMENT_STATUSES,
  AUDIT_ACTIONS,
  DEFAULT_ASSESSMENT_CONFIG
} from '../constants/assessment';
import {
  getAuthoritativeDataDir,
  loadAssessmentStoreFromDisk,
  persistAssessmentStoreToDisk
} from './assessmentPersistence';
import logger from '../utils/logger';

export class AssessmentStore {
  private static instance: AssessmentStore;
  private assessments: Map<string, AssessmentRecord> = new Map();
  private customers: Map<string, CustomerRecord> = new Map();
  private dataVersions: Map<string, AssessmentDataVersion[]> = new Map();
  private analysisRuns: Map<string, AssessmentAnalysisRun[]> = new Map();
  private auditLogs: Map<string, AssessmentAuditLog[]> = new Map();
  private nextSequence: number = 2;
  private nextCustomerSequence: number = 2;
  private customDataDir?: string;

  private constructor() {
    this.loadFromDisk();
    if (process.env.AICEV_SEED_TEST_DATA === 'true' && !this.assessments.has('AIC-2026-0001')) {
      this.seedAuthoritativeVgtAssessment();
      this.persistToDisk();
    }
  }

  public static getInstance(): AssessmentStore {
    if (!AssessmentStore.instance) {
      AssessmentStore.instance = new AssessmentStore();
    }
    return AssessmentStore.instance;
  }

  public getDataDir(): string {
    return this.customDataDir || getAuthoritativeDataDir();
  }

  public setCustomDataDir(dir?: string): void {
    this.customDataDir = dir;
  }

  public loadFromDisk(): boolean {
    const data = loadAssessmentStoreFromDisk(this.getDataDir());
    if (!data) return false;

    this.assessments.clear();
    this.customers.clear();
    this.dataVersions.clear();
    this.analysisRuns.clear();
    this.auditLogs.clear();

    if (Array.isArray(data.customers)) {
      for (const cust of data.customers) {
        const id = cust.id || cust.customerId;
        cust.id = id;
        cust.customerId = cust.customerId || id;
        this.customers.set(cust.customerId, cust);
      }
    }
    for (const record of data.assessments) {
      this.assessments.set(record.assessmentId, record);
    }
    for (const [k, v] of Object.entries(data.dataVersions)) {
      this.dataVersions.set(k, Array.isArray(v) ? v : []);
    }
    for (const [k, v] of Object.entries(data.analysisRuns)) {
      this.analysisRuns.set(k, Array.isArray(v) ? v : []);
    }
    for (const [k, v] of Object.entries(data.auditLogs)) {
      this.auditLogs.set(k, Array.isArray(v) ? v : []);
    }

    let maxCustSeq = 1;
    for (const id of this.customers.keys()) {
      const match = id.match(/CUST-\d{4}-(\d+)/);
      if (match?.[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num >= maxCustSeq) {
          maxCustSeq = num;
        }
      }
    }
    this.nextCustomerSequence = Math.max(data.nextCustomerSequence || 2, maxCustSeq + 1);

    // Auto-link any existing assessments missing customerId
    for (const assessment of this.assessments.values()) {
      if (!assessment.customerId) {
        let matched = Array.from(this.customers.values()).find(
          (c) => c.customerName.toLowerCase() === assessment.customerName.toLowerCase()
        );
        if (!matched) {
          const custSeqStr = String(this.nextCustomerSequence++).padStart(4, '0');
          const year = new Date().getFullYear();
          const custId = `CUST-${year}-${custSeqStr}`;
          matched = {
            customerId: custId,
            id: custId,
            customerName: assessment.customerName,
            industry: assessment.industry,
            businessUnit: assessment.businessUnit,
            status: 'ACTIVE',
            createdAt: assessment.createdAt,
            updatedAt: assessment.updatedAt,
            notes: 'Associated from existing assessment'
          };
          this.customers.set(custId, matched);
        }
        assessment.customerId = matched.customerId;
      }
    }

    let maxSeq = 1;
    for (const id of this.assessments.keys()) {
      const match = id.match(/AIC-\d{4}-(\d+)/);
      if (match?.[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num >= maxSeq) {
          maxSeq = num;
        }
      }
    }
    this.nextSequence = Math.max(data.nextSequence || 2, maxSeq + 1);
    return true;
  }

  public reloadFromDisk(): boolean {
    const result = this.loadFromDisk();
    if (process.env.AICEV_SEED_TEST_DATA === 'true' && !this.assessments.has('AIC-2026-0001')) {
      this.seedAuthoritativeVgtAssessment();
      this.persistToDisk();
    }
    return result;
  }

  public clearAllDevelopmentData(): void {
    this.assessments.clear();
    this.customers.clear();
    this.dataVersions.clear();
    this.analysisRuns.clear();
    this.auditLogs.clear();
    this.nextSequence = 1;
    this.nextCustomerSequence = 1;
    this.persistToDisk();
  }

  public persistToDisk(): void {
    const payload: PersistedStoreData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      nextSequence: this.nextSequence,
      nextCustomerSequence: this.nextCustomerSequence,
      customers: Array.from(this.customers.values()),
      assessments: Array.from(this.assessments.values()),
      dataVersions: Object.fromEntries(this.dataVersions.entries()),
      analysisRuns: Object.fromEntries(this.analysisRuns.entries()),
      auditLogs: Object.fromEntries(this.auditLogs.entries())
    };
    persistAssessmentStoreToDisk(this.getDataDir(), payload);
  }

  public seedAuthoritativeVgtAssessment(): void {
    const vgtId = 'AIC-2026-0001';
    const now = new Date().toISOString();

    const record: AssessmentRecord = {
      assessmentId: vgtId,
      customerName: '[TEST DATA] Varroc Polymers (VGT Regression Baseline)',
      isTestData: true,
      industry: 'Automotive & Polymers',
      assessmentPeriodStart: 'April 2021',
      assessmentPeriodEnd: 'January 2022',
      dataReceivedAt: '2026-04-01T10:00:00.000Z',
      ndaStatus: NDA_STATUSES.SIGNED,
      dataStatus: DATA_STATUSES.VALIDATED,
      assignedAnalyst: 'analyst@procucev.com',
      status: ASSESSMENT_STATUSES.APPROVED,
      activeDataVersionId: 'DV-001',
      activeAnalysisRunId: 'RUN-001',
      totalSpendCr: 4073.8307,
      validatedSpendCr: 4073.8307,
      baselineSpendCr: 3920.3277,
      fxImpactCr: 153.5029,
      addressableSpendCr: 443.621,
      grossOpportunityCr: 441.833,
      overlapDeductionsCr: 104.067,
      netDefensibleOpportunityCr: 337.766,
      provenOpportunityCr: 319.439,
      deliveryRangeMinCr: 31.944,
      deliveryRangeMaxCr: 79.860,
      pcbiAnalyticalSignalCr: 31.6921,
      potentialSavingsCr: 378.4,
      savingsPct: 9.29,
      approvedBy: 'admin@procucev.com',
      approvedAt: now,
      approvalComment: 'Authoritative VGT dataset validated against FX Master and Pareto standards.',
      createdAt: '2026-04-01T09:00:00.000Z',
      updatedAt: now
    };
    this.assessments.set(vgtId, record);

    const vgtVersion: AssessmentDataVersion = {
      dataVersionId: 'DV-001',
      assessmentId: vgtId,
      versionNumber: 1,
      fileName: 'VGT Testing Data.xlsx',
      fileSize: 2240000,
      checksum: '59625f2f91c303ef492b679511077a0882dab2d9760bce8b3f7edaca82d81def',
      filePath: 'datasets/vgt/VGT Testing Data.xlsx',
      uploadedBy: 'admin@procucev.com',
      uploadedAt: '2026-04-01T10:15:00.000Z',
      recordCount: 20505,
      notes: 'Initial authoritative commercial purchase history ledger',
      isSuperseded: false
    };
    this.dataVersions.set(vgtId, [vgtVersion]);

    const vgtRun: AssessmentAnalysisRun = {
      analysisRunId: 'RUN-001',
      assessmentId: vgtId,
      dataVersionId: 'DV-001',
      status: 'COMPLETED',
      totalSpendCr: 4073.8307,
      validatedSpendCr: 4073.8307,
      addressableSpendCr: 443.621,
      grossOpportunityCr: 441.833,
      overlapDeductionsCr: 104.067,
      netDefensibleOpportunityCr: 337.766,
      provenOpportunityCr: 319.439,
      deliveryRangeMinCr: 31.944,
      deliveryRangeMaxCr: 79.860,
      pcbiAnalyticalSignalCr: 31.6921,
      potentialSavingsCr: 378.4,
      savingsPct: 9.29,
      reviewGates: [
        { gate: 'MODULE_1_RECONCILIATION', passed: true, evaluatedAt: now, message: 'Reconciled 20,241 valid rows' },
        { gate: 'FX_COVERAGE_VALIDATION', passed: true, evaluatedAt: now, message: '100% FX coverage verified' },
        { gate: 'DATA_QUALITY_REVIEW', passed: true, evaluatedAt: now, message: '12 anomalies quarantined' },
        { gate: 'MODULE_2_VALIDATION', passed: true, evaluatedAt: now, message: 'UNSPSC mapped' },
        { gate: 'PCBI_REVIEW', passed: true, evaluatedAt: now, message: 'Benchmark validated' },
        { gate: 'SAVINGS_RECONCILIATION', passed: true, evaluatedAt: now, message: 'Bridge reconciled' },
        { gate: 'EVIDENCE_WORKBOOK_GENERATION', passed: true, evaluatedAt: now, message: 'Workbook built' },
        { gate: 'REPORT_GENERATION', passed: true, evaluatedAt: now, message: 'Brief built' }
      ],
      allGatesPassed: true,
      isApproved: true,
      isSuperseded: false,
      createdAt: now
    };
    this.analysisRuns.set(vgtId, [vgtRun]);

    this.auditLogs.set(vgtId, [{
      id: 'aud-001',
      assessmentId: vgtId,
      actorEmail: 'admin@procucev.com',
      actorRole: 'INTERNAL_ADMIN',
      action: AUDIT_ACTIONS.ASSESSMENT_CREATED,
      details: { customer: 'Varroc Polymers (VGT)' },
      timestamp: '2026-04-01T09:00:00.000Z'
    }]);

    this.nextSequence = 2;
  }

  public resetToDefaultSeed(): void {
    this.assessments.clear();
    this.dataVersions.clear();
    this.analysisRuns.clear();
    this.auditLogs.clear();
    this.nextSequence = 2;
    this.seedAuthoritativeVgtAssessment();
    this.persistToDisk();
  }

  public getAssessments(statusFilter?: string): AssessmentRecord[] {
    const list = Array.from(this.assessments.values());
    if (!statusFilter || statusFilter === 'ALL') {
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return list.filter((a) => a.status === statusFilter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getCustomers(statusFilter?: string): CustomerRecord[] {
    const list = Array.from(this.customers.values());
    if (!statusFilter || statusFilter === 'ALL') {
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return list.filter((c) => c.status === statusFilter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getCustomerById(id: string): CustomerRecord | undefined {
    return this.customers.get(id) || Array.from(this.customers.values()).find((c) => c.customerId === id || c.id === id);
  }

  public createCustomer(input: CreateCustomerInput, actorEmail = 'admin@procucev.com', actorRole = 'INTERNAL_ADMIN'): CustomerRecord {
    const year = new Date().getFullYear();
    const seqStr = String(this.nextCustomerSequence++).padStart(4, '0');
    const customerId = `CUST-${year}-${seqStr}`;
    const now = new Date().toISOString();

    const record: CustomerRecord = {
      customerId,
      id: customerId,
      customerName: input.customerName.trim(),
      industry: input.industry.trim(),
      businessUnit: input.businessUnit?.trim() || undefined,
      region: input.region?.trim() || 'GLOBAL',
      baseCurrency: input.baseCurrency?.trim() || 'INR',
      contactEmail: input.contactEmail?.trim() || undefined,
      contactPerson: input.contactPerson?.trim() || undefined,
      status: 'ACTIVE',
      notes: input.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    this.customers.set(customerId, record);
    this.persistToDisk();
    logger.info('Created customer and persisted to disk', { customerId, customerName: record.customerName, actorEmail, actorRole });
    return record;
  }

  public updateCustomer(id: string, input: UpdateCustomerInput, actorEmail = 'admin@procucev.com', actorRole = 'INTERNAL_ADMIN'): CustomerRecord | null {
    let record = this.customers.get(id);
    if (!record) {
      record = Array.from(this.customers.values()).find((c) => c.customerId === id || c.id === id);
    }
    if (!record) return null;

    if (input.customerName) record.customerName = input.customerName.trim();
    if (input.industry) record.industry = input.industry.trim();
    if (input.businessUnit !== undefined) record.businessUnit = input.businessUnit?.trim() || undefined;
    if (input.region !== undefined) record.region = input.region?.trim() || undefined;
    if (input.baseCurrency !== undefined) record.baseCurrency = input.baseCurrency?.trim() || undefined;
    if (input.contactEmail !== undefined) record.contactEmail = input.contactEmail?.trim() || undefined;
    if (input.contactPerson !== undefined) record.contactPerson = input.contactPerson?.trim() || undefined;
    if (input.status) record.status = input.status;
    if (input.notes !== undefined) record.notes = input.notes?.trim() || undefined;
    record.updatedAt = new Date().toISOString();

    this.persistToDisk();
    logger.info('Updated customer and persisted to disk', { customerId: record.customerId, customerName: record.customerName, actorEmail, actorRole });
    return record;
  }

  public getAll(statusFilter?: string): AssessmentRecord[] {
    return this.getAssessments(statusFilter);
  }

  public getAssessmentById(id: string): AssessmentRecord | undefined {
    return this.assessments.get(id);
  }

  public getById(id: string): AssessmentRecord | undefined {
    return this.assessments.get(id);
  }

  public update(id: string, updates: Partial<AssessmentRecord>): AssessmentRecord | null {
    const record = this.assessments.get(id);
    if (!record) return null;
    Object.assign(record, updates, { updatedAt: new Date().toISOString() });
    this.persistToDisk();
    return record;
  }

  public createAssessment(
    input: CreateAssessmentInput,
    actorEmail: string,
    actorRole: string
  ): AssessmentRecord {
    const year = new Date().getFullYear();
    const seqStr = String(this.nextSequence++).padStart(4, '0');
    const assessmentId = `${DEFAULT_ASSESSMENT_CONFIG.idPrefix}-${year}-${seqStr}`;
    const now = new Date().toISOString();

    let resolvedCustomerId = input.customerId;
    if (!resolvedCustomerId) {
      const existing = Array.from(this.customers.values()).find(
        (c) => c.customerName.toLowerCase() === input.customerName.toLowerCase()
      );
      if (existing) {
        resolvedCustomerId = existing.customerId;
      }
    }

    const record: AssessmentRecord = {
      assessmentId,
      customerId: resolvedCustomerId,
      customerName: input.customerName,
      industry: input.industry,
      businessUnit: input.businessUnit || 'Default BU',
      assessmentOwner: input.assessmentOwner || actorEmail,
      currency: input.currency || 'INR',
      assessmentPeriodStart: input.assessmentPeriodStart,
      assessmentPeriodEnd: input.assessmentPeriodEnd,
      dataReceivedAt: input.dataReceivedDate || undefined,
      ndaStatus: input.ndaStatus,
      dataStatus: DATA_STATUSES.NOT_RECEIVED,
      assignedAnalyst: input.assignedAnalyst,
      status: input.ndaStatus === NDA_STATUSES.SIGNED ? ASSESSMENT_STATUSES.DATA_PENDING : ASSESSMENT_STATUSES.CREATED,
      notes: input.notes || input.initialNotes,
      isTestData: Boolean(input.isTestData),
      totalSpendCr: undefined,
      validatedSpendCr: undefined,
      baselineSpendCr: undefined,
      fxImpactCr: undefined,
      addressableSpendCr: undefined,
      grossOpportunityCr: undefined,
      overlapDeductionsCr: undefined,
      netDefensibleOpportunityCr: undefined,
      provenOpportunityCr: undefined,
      deliveryRangeMinCr: undefined,
      deliveryRangeMaxCr: undefined,
      pcbiAnalyticalSignalCr: undefined,
      potentialSavingsCr: undefined,
      savingsPct: undefined,
      createdAt: now,
      updatedAt: now
    };

    this.assessments.set(assessmentId, record);
    this.dataVersions.set(assessmentId, []);
    this.analysisRuns.set(assessmentId, []);
    this.auditLogs.set(assessmentId, []);

    this.recordAudit(assessmentId, actorEmail, actorRole, AUDIT_ACTIONS.ASSESSMENT_CREATED, {
      customerName: input.customerName,
      industry: input.industry,
      ndaStatus: input.ndaStatus
    });

    this.persistToDisk();
    logger.info('Created assessment and persisted to disk', { assessmentId, customerName: input.customerName });
    return record;
  }

  public updateNdaStatus(
    id: string,
    input: UpdateNdaStatusInput,
    actorEmail: string,
    actorRole: string
  ): AssessmentRecord | undefined {
    const record = this.assessments.get(id);
    if (!record) return undefined;

    const prev = record.ndaStatus;
    record.ndaStatus = input.ndaStatus;
    record.updatedAt = new Date().toISOString();

    if (input.ndaStatus === NDA_STATUSES.SIGNED && record.status === ASSESSMENT_STATUSES.CREATED) {
      record.status = ASSESSMENT_STATUSES.DATA_PENDING;
    }

    this.recordAudit(id, actorEmail, actorRole, AUDIT_ACTIONS.NDA_STATUS_CHANGED, {
      from: prev,
      to: input.ndaStatus,
      notes: input.notes
    });

    this.persistToDisk();
    return record;
  }

  public updateDataStatus(
    id: string,
    input: UpdateDataStatusInput,
    actorEmail: string,
    actorRole: string
  ): AssessmentRecord | undefined {
    const record = this.assessments.get(id);
    if (!record) return undefined;

    const prev = record.dataStatus;
    record.dataStatus = input.dataStatus;
    record.updatedAt = new Date().toISOString();

    if (input.dataStatus === DATA_STATUSES.RECEIVED) {
      record.dataReceivedAt = new Date().toISOString();
      if (record.status === ASSESSMENT_STATUSES.DATA_PENDING || record.status === ASSESSMENT_STATUSES.CREATED) {
        record.status = ASSESSMENT_STATUSES.DATA_RECEIVED;
      }
      this.recordAudit(id, actorEmail, actorRole, AUDIT_ACTIONS.DATA_RECEIVED, { notes: input.notes });
    }

    this.recordAudit(id, actorEmail, actorRole, AUDIT_ACTIONS.CORRECTION_MADE, {
      field: 'dataStatus',
      from: prev,
      to: input.dataStatus
    });

    this.persistToDisk();
    return record;
  }

  public recordAudit(
    assessmentId: string,
    actorEmail: string,
    actorRole: string,
    action: (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS],
    details?: Record<string, unknown>
  ): void {
    const logs = this.auditLogs.get(assessmentId) || [];
    const entry: AssessmentAuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      assessmentId,
      actorEmail,
      actorRole,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    logs.push(entry);
    this.auditLogs.set(assessmentId, logs);
    this.persistToDisk();
  }

  public getAuditLogs(assessmentId: string): AssessmentAuditLog[] {
    return this.auditLogs.get(assessmentId) || [];
  }

  public getDataVersions(assessmentId: string): AssessmentDataVersion[] {
    return this.dataVersions.get(assessmentId) || [];
  }

  public addDataVersion(version: AssessmentDataVersion): void {
    const list = this.dataVersions.get(version.assessmentId) || [];
    list.forEach((v) => {
      v.isSuperseded = true;
    });
    list.push(version);
    this.dataVersions.set(version.assessmentId, list);
    this.persistToDisk();
  }

  public getAnalysisRuns(assessmentId: string): AssessmentAnalysisRun[] {
    return this.analysisRuns.get(assessmentId) || [];
  }

  public addAnalysisRun(run: AssessmentAnalysisRun): void {
    const list = this.analysisRuns.get(run.assessmentId) || [];
    list.forEach((r) => {
      r.isSuperseded = true;
    });
    list.push(run);
    this.analysisRuns.set(run.assessmentId, list);
    this.persistToDisk();
  }

  public saveDataVersion(version: AssessmentDataVersion): void {
    const list = this.dataVersions.get(version.assessmentId) || [];
    const idx = list.findIndex((v) => v.dataVersionId === version.dataVersionId);
    if (idx !== -1) {
      list[idx] = version;
    } else {
      list.push(version);
    }
    this.dataVersions.set(version.assessmentId, list);
    this.persistToDisk();
  }

  public saveAnalysisRun(run: AssessmentAnalysisRun): void {
    const list = this.analysisRuns.get(run.assessmentId) || [];
    const idx = list.findIndex((r) => r.analysisRunId === run.analysisRunId);
    if (idx !== -1) {
      list[idx] = run;
    } else {
      list.push(run);
    }
    this.analysisRuns.set(run.assessmentId, list);
    this.persistToDisk();
  }

  public saveAssessment(record: AssessmentRecord): void {
    record.updatedAt = new Date().toISOString();
    this.assessments.set(record.assessmentId, record);
    this.persistToDisk();
  }
}

export const assessmentStore = AssessmentStore.getInstance();
