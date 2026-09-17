import type { Request, Response } from 'express';
import { db } from '../services/db';
import { objectStore } from '../services/objectStoreService';
import logger from '../utils/logger';

export const getIngestionData = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const tenantId =
      (req?.query?.buyerId as string) ||
      (req?.query?.buyer_id as string) ||
      (req?.query?.tenantId as string) ||
      (req?.query?.tenant_id as string) ||
      (req?.headers?.['x-buyer-id'] as string) ||
      (req?.headers?.['X-Buyer-Id'] as string) ||
      (req?.headers?.['x-tenant-id'] as string) ||
      (req?.headers?.['X-Tenant-Id'] as string);
    const queue = db.getIngestionQueue(tenantId);
    const validationRecords = db.getValidationRecords();
    logger.debug('Fetched ingestion data', {
      tenantId,
      queueCount: queue.length,
      recordsCount: validationRecords.length
    });
    return res.json({
      success: true,
      data: {
        queue,
        validationRecords,
        summary: {
          totalFiles: queue.length,
          totalRecords: validationRecords.length,
          cleanCount: validationRecords.filter((r) => r.issue_flag === 'Passed Clean').length,
          anomaliesCount: validationRecords.filter((r) => r.issue_flag !== 'Passed Clean').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch ingestion data';
    logger.error('Failed to fetch ingestion data', {}, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};

export const addIngestionFile = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const body = req?.body || {};
    const updatedQueue = db.addIngestionItem(body);
    logger.info('File ingested into queue', {
      fileName: body.file_name,
      fileType: body.file_type,
      fileSizeMb: body.file_size_mb
    });
    return res.json({
      success: true,
      data: updatedQueue,
      message: 'File ingested successfully into queue',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add ingestion file';
    logger.error('Failed to add ingestion file', { body: req?.body }, error);
    return res.status(400).json({
      success: false,
      message
    });
  }
};

export const updateValidationRecord = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { record_id: recordId, ...updates } = req.body;
    if (!recordId) {
      logger.warn('Validation update rejected: Missing record_id');
      return res.status(400).json({ success: false, message: 'Missing record_id' });
    }
    const updated = db.updateValidationRecord(recordId, updates);
    if (!updated) {
      logger.warn('Validation record not found for update', { recordId });
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    logger.info('Validation record updated', { recordId, updates });
    return res.json({
      success: true,
      data: updated,
      message: `Record ${recordId} updated successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update validation record';
    logger.error('Failed to update validation record', { body: req.body }, error);
    return res.status(400).json({
      success: false,
      message
    });
  }
};

export const resetValidationRecords = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const reset = db.resetValidationRecords();
    logger.info('Validation records reset to baseline', { recordCount: reset.length });
    return res.json({
      success: true,
      data: reset,
      message: 'Validation records reset to baseline',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset records';
    logger.error('Failed to reset validation records', {}, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};

export const applyBlanketRemediation = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const result = db.applyBlanketRemediation();
    logger.info('Blanket AI remediation applied', {
      updatedCount: result.updatedCount,
      totalRecords: result.records.length
    });
    return res.json({
      success: true,
      data: result,
      message: `Blanket AI remediation applied to ${result.updatedCount} anomalous records. All spend normalized in INR Crores.`,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to apply blanket remediation';
    logger.error('Failed to apply blanket remediation', {}, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};

export const uploadDocumentToObjectStore = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const {
      fileName,
      fileType,
      fileBase64,
      fileSizeMb,
      recordsCount,
      convertedInrCrores,
      detectedCurrencies,
      datasetType,
      tenant_id,
      buyer_id
    } = req.body;

    if (!fileName) {
      return res.status(400).json({ success: false, message: 'Missing fileName in upload payload' });
    }

    let buffer: Buffer;
    if (fileBase64) {
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
    } else {
      buffer = Buffer.from(fileName, 'utf-8');
    }

    const calculatedSizeMb = fileSizeMb || Number((buffer.length / (1024 * 1024)).toFixed(2)) || 1.0;
    const objectMeta = await objectStore.putObject(
      buffer,
      fileName,
      fileType === 'XLSX' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
      process.env.R2_BUCKET || 'consulting-doc',
      { datasetType: datasetType || 'Purchase History' }
    );

    const effectiveTenantId = tenant_id || buyer_id || (req.headers['x-buyer-id'] as string) || (req.headers['x-tenant-id'] as string);

    const ingestionItem = {
      tenant_id: effectiveTenantId,
      file_name: fileName,
      file_type: (fileType || 'XLSX') as any,
      file_size_mb: calculatedSizeMb,
      records_count: recordsCount || 0,
      converted_inr_crores: convertedInrCrores || 0,
      detected_currencies: detectedCurrencies || ['INR'],
      ocr_status: 'Completed' as const,
      progress: 100
    };

    const updatedQueue = db.addIngestionItem(ingestionItem);

    logger.info('Dataset uploaded and registered in Object Store', {
      key: objectMeta.key,
      fileName,
      recordsCount,
      tenantId: effectiveTenantId
    });

    return res.json({
      success: true,
      data: {
        objectMeta,
        ingestionQueue: updatedQueue
      },
      message: 'Dataset uploaded and persisted in Object Store successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload document to Object Store';
    logger.error('Failed to upload document to Object Store', {}, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};

export const getStoredObject = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const key = req.params.key;
    if (!key) {
      return res.status(400).json({ success: false, message: 'Missing object key' });
    }
    const decodedKey = decodeURIComponent(key);
    const obj = await objectStore.getObject(decodedKey);
    if (!obj) {
      return res.status(404).json({ success: false, message: 'Object not found in Object Store' });
    }
    res.setHeader('Content-Type', obj.metadata.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${obj.metadata.filename}"`);
    return res.send(obj.buffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve object';
    logger.error('Failed to retrieve object', { params: req.params }, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};

export const deleteIngestionDocument = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const docId = req?.params?.docId;
    const tenantId = (req?.query?.tenantId as string) || (req?.query?.buyerId as string) || (req?.headers?.['x-buyer-id'] as string) || (req?.headers?.['x-tenant-id'] as string);
    const updatedQueue = db.deleteIngestionItem(docId, tenantId);
    logger.info('Ingestion document removed from database', { docId, tenantId });
    return res.json({
      success: true,
      data: updatedQueue,
      message: docId ? `Document ${docId} deleted from database` : 'All ingestion documents cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete ingestion document';
    logger.error('Failed to delete ingestion document', { params: req.params }, error);
    return res.status(500).json({
      success: false,
      message
    });
  }
};
