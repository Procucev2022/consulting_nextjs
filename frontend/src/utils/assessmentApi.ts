/**
 * Frontend API client for aiCEV Internal Assessment Mode
 */

import type {
  OperatingModeConfig,
  CustomerRecord,
  CreateCustomerInput,
  UpdateCustomerInput,
  AssessmentRecord,
  CreateAssessmentInput,
  AssessmentDataVersion,
  AssessmentAnalysisRun,
  AssessmentAuditLog,
  AssessmentReviewGateRecord,
  AssessmentReviewGateUpdate,
  DeliveryPackageResult,
  NdaStatus,
  DataStatus,
  AssessmentStatus,
  SystemBuildInfo
} from '../types/assessment';
import frontendLogger from './logger';
import { API_BASE, getJson, postJson } from './assessmentApiHelpers';
import { authApiClient } from './authApi';

export const assessmentApiClient = {
  async getCustomers(status?: string): Promise<CustomerRecord[]> {
    frontendLogger.debug('Fetching customers list');
    const url = status
      ? `${API_BASE}/api/assessment/customers?status=${encodeURIComponent(status)}`
      : `${API_BASE}/api/assessment/customers`;
    const data = await getJson<CustomerRecord[]>(url, 'Failed to fetch customers');
    return Array.isArray(data) ? data : [];
  },

  async getCustomerById(id: string): Promise<{ customer: CustomerRecord; assessments: AssessmentRecord[] }> {
    frontendLogger.debug('Fetching customer by id', { id });
    return getJson(`${API_BASE}/api/assessment/customers/${encodeURIComponent(id)}`, `Failed to fetch customer ${id}`);
  },

  async createCustomer(payload: CreateCustomerInput): Promise<CustomerRecord> {
    frontendLogger.info('Creating new customer profile', { customerName: payload.customerName });
    return postJson(`${API_BASE}/api/assessment/customers`, payload, 'Failed to create customer');
  },

  async updateCustomer(id: string, payload: UpdateCustomerInput): Promise<CustomerRecord> {
    frontendLogger.info('Updating customer profile', { id });
    return postJson(
      `${API_BASE}/api/assessment/customers/${encodeURIComponent(id)}`,
      payload,
      'Failed to update customer',
      'PATCH'
    );
  },

  async validateDataset(
    id: string,
    dataVersionId?: string
  ): Promise<{
    assessment: AssessmentRecord;
    dataVersion: AssessmentDataVersion;
    validationSummary: {
      sourceRowCount: number;
      validRowCount: number;
      excludedRowCount: number;
      anomalyRowCount: number;
      cleanSpendYieldPct: number;
    };
  }> {
    frontendLogger.info('Validating dataset', { id, dataVersionId });
    return postJson(`${API_BASE}/api/assessment/${encodeURIComponent(id)}/validate`, { dataVersionId }, 'Failed to validate dataset');
  },

  async runModule1(
    id: string,
    dataVersionId?: string
  ): Promise<{ assessment: AssessmentRecord; analysisRun: AssessmentAnalysisRun }> {
    frontendLogger.info('Explicitly starting Module 1 analysis', { id, dataVersionId });
    return postJson(`${API_BASE}/api/assessment/${encodeURIComponent(id)}/run-module1`, { dataVersionId }, 'Failed to execute Module 1');
  },

  async getOperatingMode(): Promise<OperatingModeConfig> {
    frontendLogger.debug('Fetching application operating mode config');
    return getJson(`${API_BASE}/api/assessment/mode`, 'Failed to fetch operating mode');
  },

  async getAssessments(_status?: AssessmentStatus): Promise<AssessmentRecord[]> {
    frontendLogger.debug('Fetching assessments list');
    return getJson(`${API_BASE}/api/assessment`, 'Failed to fetch assessments');
  },

  async listAssessments(status?: AssessmentStatus): Promise<AssessmentRecord[]> {
    return this.getAssessments(status);
  },

  async getAssessmentById(id: string): Promise<AssessmentRecord> {
    frontendLogger.debug('Fetching assessment by id', { id });
    const data = await getJson<{ assessment?: AssessmentRecord } | AssessmentRecord>(
      `${API_BASE}/api/assessment/${id}`,
      `Failed to fetch assessment ${id}`
    );
    return (data as { assessment?: AssessmentRecord }).assessment || (data as AssessmentRecord);
  },

  async createAssessment(payload: CreateAssessmentInput): Promise<AssessmentRecord> {
    frontendLogger.info('Creating new assessment', { customerName: payload.customerName });
    return postJson(`${API_BASE}/api/assessment`, payload, 'Failed to create assessment');
  },

  async updateNdaStatus(id: string, ndaStatus: NdaStatus, notes?: string): Promise<AssessmentRecord> {
    frontendLogger.info('Updating NDA status', { id, ndaStatus });
    return postJson(`${API_BASE}/api/assessment/${id}/nda`, { ndaStatus, notes }, 'Failed to update NDA status', 'PATCH');
  },

  async updateDataStatus(id: string, dataStatus: DataStatus, notes?: string): Promise<AssessmentRecord> {
    frontendLogger.info('Updating Data status', { id, dataStatus });
    return postJson(`${API_BASE}/api/assessment/${id}/data-status`, { dataStatus, notes }, 'Failed to update data status', 'PATCH');
  },

  async uploadDataVersion(
    id: string,
    payload: {
      fileName: string;
      fileSize: number;
      checksum: string;
      expectedChecksum?: string;
      filePath?: string;
      recordCount?: number;
      notes?: string;
      fileBase64?: string;
      runAnalysisImmediately?: boolean;
    }
  ): Promise<{
    assessment: AssessmentRecord;
    dataVersion: AssessmentDataVersion;
    analysisRun?: AssessmentAnalysisRun;
  }> {
    frontendLogger.info('Uploading data version', { id, fileName: payload.fileName });
    return postJson(`${API_BASE}/api/assessment/${id}/upload`, payload, 'Failed to upload data version');
  },

  async runAnalysis(id: string, dataVersionId?: string): Promise<AssessmentAnalysisRun> {
    frontendLogger.info('Triggering analysis run', { id, dataVersionId });
    return postJson(`${API_BASE}/api/assessment/${id}/run-analysis`, { dataVersionId }, 'Failed to run analysis');
  },

  async approveAssessment(
    id: string,
    payload: { analysisRunId?: string; approvedBy?: string; approvalComment: string }
  ): Promise<AssessmentRecord> {
    frontendLogger.info('Approving assessment', { id, approvedBy: payload.approvedBy });
    return postJson(`${API_BASE}/api/assessment/${id}/approve`, payload, 'Failed to approve assessment');
  },

  async generateDeliveryPackage(id: string): Promise<DeliveryPackageResult> {
    frontendLogger.info('Generating delivery package', { id });
    return postJson(`${API_BASE}/api/assessment/${id}/delivery-package`, {}, 'Failed to generate delivery package');
  },

  async getReviewGates(id: string): Promise<AssessmentReviewGateRecord[]> {
    frontendLogger.debug('Fetching assessment review gates', { id });
    const records = await getJson<AssessmentReviewGateRecord[]>(
      `${API_BASE}/api/assessment/${encodeURIComponent(id)}/review-gates`,
      'Failed to fetch assessment review gates'
    );
    return Array.isArray(records) ? records : [];
  },

  async saveReviewGate(id: string, payload: AssessmentReviewGateUpdate): Promise<AssessmentReviewGateRecord[]> {
    frontendLogger.info('Saving assessment review gate', { id, gateKey: payload.gateKey, status: payload.status });
    const token = authApiClient.getStoredToken();
    return postJson(
      `${API_BASE}/api/assessment/${encodeURIComponent(id)}/review-gates`,
      payload,
      'Failed to save assessment review gate',
      'PUT',
      token ? { Authorization: ['Bearer', token].join(' ') } : {}
    );
  },

  async deliverAssessment(
    id: string,
    payload: { deliveryChannel?: 'EMAIL' | 'PORTAL' | 'SECURE_LINK' | 'MANUAL'; recipientEmail: string; notes?: string }
  ): Promise<AssessmentRecord> {
    frontendLogger.info('Delivering assessment', { id, recipient: payload.recipientEmail });
    return postJson(`${API_BASE}/api/assessment/${id}/deliver`, payload, 'Failed to mark assessment delivered');
  },

  async acceptAssessment(
    id: string,
    payload: { acceptanceComment?: string; acceptedBy?: string } = {}
  ): Promise<AssessmentRecord> {
    frontendLogger.info('Accepting assessment', { id, acceptedBy: payload.acceptedBy });
    return postJson(`${API_BASE}/api/assessment/${id}/accept`, payload, 'Failed to mark assessment accepted');
  },

  async closeAssessment(id: string): Promise<AssessmentRecord> {
    frontendLogger.info('Closing assessment', { id });
    return postJson(`${API_BASE}/api/assessment/${id}/close`, {}, 'Failed to close assessment');
  },

  async getAuditLogs(id: string): Promise<AssessmentAuditLog[]> {
    frontendLogger.debug('Fetching audit logs for assessment', { id });
    return getJson(`${API_BASE}/api/assessment/${id}/audit`, 'Failed to fetch audit logs');
  },

  async getSystemInfo(): Promise<SystemBuildInfo> {
    frontendLogger.debug('Fetching system build info');
    return getJson(`${API_BASE}/api/assessment/system-info`, 'Failed to fetch system info');
  }
};

export const assessmentApi = assessmentApiClient;
export default assessmentApiClient;
