import { Request, Response } from 'express';
import { db } from '../services/db';
import logger from '../utils/logger';

export const getIngestionData = async (_req: Request, res: Response) => {
  try {
    const queue = db.getIngestionQueue();
    const validationRecords = db.getValidationRecords();
    logger.debug('Fetched ingestion data', {
      queueCount: queue.length,
      recordsCount: validationRecords.length
    });
    res.json({
      success: true,
      data: {
        queue,
        validationRecords,
        summary: {
          totalFiles: queue.length,
          totalRecords: validationRecords.length,
          cleanCount: validationRecords.filter((r) => r.issue_flag === 'Passed Clean').length,
          anomaliesCount: validationRecords.filter((r) => r.issue_flag !== 'Passed Clean').length,
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to fetch ingestion data', {}, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch ingestion data'
    });
  }
};

export const addIngestionFile = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const updatedQueue = db.addIngestionItem(body);
    logger.info('File ingested into queue', {
      fileName: body.file_name,
      fileType: body.file_type,
      fileSizeMb: body.file_size_mb
    });
    res.json({
      success: true,
      data: updatedQueue,
      message: 'File ingested successfully into queue',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to add ingestion file', { body: req.body }, error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add ingestion file'
    });
  }
};

export const updateValidationRecord = async (req: Request, res: Response) => {
  try {
    const { record_id, ...updates } = req.body;
    if (!record_id) {
      logger.warn('Validation update rejected: Missing record_id');
      return res.status(400).json({ success: false, message: 'Missing record_id' });
    }
    const updated = db.updateValidationRecord(record_id, updates);
    if (!updated) {
      logger.warn('Validation record not found for update', { recordId: record_id });
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    logger.info('Validation record updated', { recordId: record_id, updates });
    return res.json({
      success: true,
      data: updated,
      message: `Record ${record_id} updated successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to update validation record', { body: req.body }, error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update validation record'
    });
  }
};

export const resetValidationRecords = async (_req: Request, res: Response) => {
  try {
    const reset = db.resetValidationRecords();
    logger.info('Validation records reset to baseline', { recordCount: reset.length });
    res.json({
      success: true,
      data: reset,
      message: 'Validation records reset to baseline',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to reset validation records', {}, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset records'
    });
  }
};

export const applyBlanketRemediation = async (_req: Request, res: Response) => {
  try {
    const result = db.applyBlanketRemediation();
    logger.info('Blanket AI remediation applied', {
      updatedCount: result.updatedCount,
      totalRecords: result.records.length
    });
    res.json({
      success: true,
      data: result,
      message: `Blanket AI remediation applied to ${result.updatedCount} anomalous records. All spend normalized in INR Crores.`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to apply blanket remediation', {}, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply blanket remediation'
    });
  }
};

