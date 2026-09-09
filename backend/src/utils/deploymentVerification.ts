import type { Express } from 'express';
import request from 'supertest';
import app from '../app';
import { db } from '../services/db';
import logger from './logger';
import { DEPLOYMENT_VERIFICATION_CONSTANTS } from '../constants/deployment';
import type {
  BackendOperationResult,
  DatabaseOperationResult,
  FileUploadOperationResult,
  DeploymentVerificationReport
} from '../types/deployment';

/**
 * Executes a verified backend operation (API Health & Tenant state inspection)
 */
export const executeBackendOperation = async (expressApp: Express = app): Promise<BackendOperationResult> => {
  const startTime = Date.now();
  try {
    const res = await request(expressApp).get(DEPLOYMENT_VERIFICATION_CONSTANTS.HEALTH_ENDPOINT);
    const durationMs = Date.now() - startTime;

    if (res.status !== 200) {
      logger.warn('Deployment verification backend operation returned non-200 status', {
        statusCode: res.status,
        durationMs
      });
      return {
        operation: 'Backend API Health Check',
        endpoint: DEPLOYMENT_VERIFICATION_CONSTANTS.HEALTH_ENDPOINT,
        status: DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_FAILED,
        statusCode: res.status,
        durationMs,
        error: `Expected HTTP 200, received ${res.status}`
      };
    }

    logger.info('Deployment verification backend operation passed', {
      statusCode: res.status,
      durationMs
    });

    return {
      operation: 'Backend API Health Check',
      endpoint: DEPLOYMENT_VERIFICATION_CONSTANTS.HEALTH_ENDPOINT,
      status: DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_PASSED,
      statusCode: res.status,
      durationMs,
      details: {
        healthy: res.body?.status === 'ok',
        uptime: res.body?.uptime,
        timestamp: res.body?.timestamp
      }
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Backend operation failed';
    logger.error('Deployment verification backend operation failed', { durationMs }, err);
    return {
      operation: 'Backend API Health Check',
      endpoint: DEPLOYMENT_VERIFICATION_CONSTANTS.HEALTH_ENDPOINT,
      status: DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_FAILED,
      statusCode: 500,
      durationMs,
      error: message
    };
  }
};

/**
 * Executes a verified database operation (Querying Tenant & Category records)
 */
export const executeDatabaseOperation = async (): Promise<DatabaseOperationResult> => {
  const startTime = Date.now();
  try {
    const tenant = db.getTenant();
    const categories = db.getCategories();
    const durationMs = Date.now() - startTime;

    if (!tenant?.tenant_id) {
      logger.warn('Deployment verification database operation returned empty tenant record');
      return {
        operation: 'Database Query (TenantMaster & Categories)',
        model: 'TenantMaster',
        status: DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_FAILED,
        durationMs,
        recordsRetrieved: 0,
        error: 'Tenant record not found or invalid'
      };
    }

    logger.info('Deployment verification database operation passed', {
      tenantId: tenant.tenant_id,
      categoryCount: categories.length,
      durationMs
    });

    return {
      operation: 'Database Query (TenantMaster & Categories)',
      model: 'TenantMaster',
      status: DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_PASSED,
      durationMs,
      recordsRetrieved: categories.length + 1,
      details: {
        tenantId: tenant.tenant_id,
        enterpriseName: tenant.enterprise_name,
        categoryCount: categories.length,
        isPostgresConnected: db.isConnectedToPostgres()
      }
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Database operation failed';
    logger.error('Deployment verification database operation failed', { durationMs }, err);
    return {
      operation: 'Database Query (TenantMaster & Categories)',
      model: 'TenantMaster',
      status: DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_FAILED,
      durationMs,
      recordsRetrieved: 0,
      error: message
    };
  }
};

/**
 * Executes a verified file uploading / ingestion operation
 */
export const executeFileUploadOperation = async (expressApp: Express = app): Promise<FileUploadOperationResult> => {
  const startTime = Date.now();
  const sampleUploadPayload = {
    file_name: DEPLOYMENT_VERIFICATION_CONSTANTS.SAMPLE_FILE_NAME,
    file_type: DEPLOYMENT_VERIFICATION_CONSTANTS.SAMPLE_FILE_TYPE,
    file_size_mb: DEPLOYMENT_VERIFICATION_CONSTANTS.SAMPLE_FILE_SIZE_MB,
    records_count: DEPLOYMENT_VERIFICATION_CONSTANTS.SAMPLE_RECORDS_COUNT,
    ocr_status: 'Completed' as const,
    progress: 100,
    converted_inr_crores: DEPLOYMENT_VERIFICATION_CONSTANTS.SAMPLE_CONVERTED_INR_CRORES,
    detected_currencies: ['INR', 'USD', 'EUR']
  };

  try {
    const res = await request(expressApp)
      .post(DEPLOYMENT_VERIFICATION_CONSTANTS.INGESTION_ENDPOINT)
      .send(sampleUploadPayload);

    const durationMs = Date.now() - startTime;

    if (res.status !== 200 || !res.body?.success) {
      logger.warn('Deployment verification file upload operation failed with non-200 or invalid payload', {
        statusCode: res.status,
        durationMs
      });
      return {
        operation: 'Procurement File Ingestion Upload',
        fileName: sampleUploadPayload.file_name,
        fileType: sampleUploadPayload.file_type,
        fileSizeMb: sampleUploadPayload.file_size_mb,
        recordsIngested: 0,
        status: DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_FAILED,
        durationMs,
        error: res.body?.message || `HTTP ${res.status}`
      };
    }

    logger.info('Deployment verification file upload operation passed', {
      fileName: sampleUploadPayload.file_name,
      recordsCount: sampleUploadPayload.records_count,
      durationMs
    });

    return {
      operation: 'Procurement File Ingestion Upload',
      fileName: sampleUploadPayload.file_name,
      fileType: sampleUploadPayload.file_type,
      fileSizeMb: sampleUploadPayload.file_size_mb,
      recordsIngested: sampleUploadPayload.records_count,
      status: DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_PASSED,
      durationMs,
      details: {
        ocrStatus: sampleUploadPayload.ocr_status,
        convertedInrCrores: sampleUploadPayload.converted_inr_crores,
        totalQueueLength: res.body?.data?.length || 0
      }
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'File upload operation failed';
    logger.error('Deployment verification file upload operation failed', { durationMs }, err);
    return {
      operation: 'Procurement File Ingestion Upload',
      fileName: sampleUploadPayload.file_name,
      fileType: sampleUploadPayload.file_type,
      fileSizeMb: sampleUploadPayload.file_size_mb,
      recordsIngested: 0,
      status: DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_FAILED,
      durationMs,
      error: message
    };
  }
};

/**
 * Runs the comprehensive post-deployment verification suite:
 * 1. One Backend-related operation
 * 2. One Database-related operation
 * 3. One File-uploading operation
 */
export const runDeploymentOperationsVerification = async (
  expressApp: Express = app
): Promise<DeploymentVerificationReport> => {
  const overallStart = Date.now();
  logger.info('Starting mandatory post-deployment operations verification (Backend, DB, File Upload)');

  const backendOp = await executeBackendOperation(expressApp);
  const databaseOp = await executeDatabaseOperation();
  const fileUploadOp = await executeFileUploadOperation(expressApp);

  const totalDurationMs = Date.now() - overallStart;
  const success =
    backendOp.status === DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_PASSED &&
    databaseOp.status === DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_PASSED &&
    fileUploadOp.status === DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_PASSED;

  const report: DeploymentVerificationReport = {
    success,
    timestamp: new Date().toISOString(),
    backendOperation: backendOp,
    databaseOperation: databaseOp,
    fileUploadOperation: fileUploadOp,
    totalDurationMs
  };

  if (success) {
    logger.info('All post-deployment operations verified successfully', { totalDurationMs });
  } else {
    logger.warn('One or more post-deployment operations failed verification', { report });
  }

  return report;
};
