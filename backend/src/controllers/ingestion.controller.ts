import { Request, Response } from 'express';
import { db } from '../services/db';

export const getIngestionData = async (_req: Request, res: Response) => {
  try {
    const queue = db.getIngestionQueue();
    const validationRecords = db.getValidationRecords();
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
    res.json({
      success: true,
      data: updatedQueue,
      message: 'File ingested successfully into queue',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
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
      return res.status(400).json({ success: false, message: 'Missing record_id' });
    }
    const updated = db.updateValidationRecord(record_id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    return res.json({
      success: true,
      data: updated,
      message: `Record ${record_id} updated successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update validation record'
    });
  }
};

export const resetValidationRecords = async (_req: Request, res: Response) => {
  try {
    const reset = db.resetValidationRecords();
    res.json({
      success: true,
      data: reset,
      message: 'Validation records reset to baseline',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset records'
    });
  }
};

export const applyBlanketRemediation = async (_req: Request, res: Response) => {
  try {
    const result = db.applyBlanketRemediation();
    res.json({
      success: true,
      data: result,
      message: `Blanket AI remediation applied to ${result.updatedCount} anomalous records. All spend normalized in INR Crores.`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply blanket remediation'
    });
  }
};
