import type { Request, Response } from 'express';
import { db } from '../services/db';
import logger from '../utils/logger';
import type { StrategicInputTransaction } from '../types';

interface StrategicLineItemDto {
  mapping_id: string;
  line_item_id: string;
  raw_desc: string;
  spend_year: number;
  po_number: string;
  material_code: string;
  material_desc: string;
  vendor_identified: string;
  master_supplier_id: string;
  unspsc_code: string;
  unspsc_commodity_title: string;
  unspsc_class_title: string;
  unspsc_category_name: string;
  core_bucket: string;
  inr_crores: number;
  total_spend: number;
  qty: number;
  unit_price: number;
  ai_confidence: number;
}

const safeStr = (val?: string, def = ''): string => (val ? val : def);

const mapTxToLineItem = (t: StrategicInputTransaction, idx: number, offset: number): StrategicLineItemDto => {
  const globalIdx = offset + idx + 1;
  const yearParsed = Number(t.po_date?.slice(0, 4));
  const spend = t.total_spend_inr ?? 0;
  const cat = safeStr(t.spend_category, 'Direct Materials');

  return {
    mapping_id: `M2-MAP-${globalIdx}`,
    line_item_id: safeStr(t.id, `TX-${globalIdx}`),
    raw_desc: t.material_desc,
    spend_year: Number.isFinite(yearParsed) ? yearParsed : 2021,
    po_number: safeStr(t.po_number, 'PO NOT AVAILABLE'),
    material_code: safeStr(t.material_code, `MAT-${globalIdx}`),
    material_desc: t.material_desc,
    vendor_identified: t.vendor_name,
    master_supplier_id: safeStr(t.vendor_code, `VND-${globalIdx}`),
    unspsc_code: safeStr(t.unspsc_code, '44101500'),
    unspsc_commodity_title: safeStr(t.spend_category, 'Industrial Material Line Item'),
    unspsc_class_title: safeStr(t.spend_category, 'Industrial Goods'),
    unspsc_category_name: cat,
    core_bucket: cat,
    inr_crores: Number((spend / 10000000).toFixed(6)),
    total_spend: spend,
    qty: t.quantity ?? 1,
    unit_price: t.unit_price ?? 0,
    ai_confidence: 94
  };
};

export const getCanonicalInput = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const canonicalInput = db.getModule2CanonicalInput();
    return res.json({
      success: true,
      data: canonicalInput,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch canonical input';
    logger.error('Failed to fetch canonical input', {}, error);
    return res.status(500).json({ success: false, message });
  }
};

export const getOpportunityLedger = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const ledger = db.getModule2OpportunityLedger();
    return res.json({
      success: true,
      data: {
        ledger,
        count: ledger.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch opportunity ledger';
    logger.error('Failed to fetch opportunity ledger', {}, error);
    return res.status(500).json({ success: false, message });
  }
};

export const getBridge = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const bridge = db.getModule2MathematicalBridge();
    return res.json({
      success: true,
      data: bridge,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch mathematical bridge';
    logger.error('Failed to fetch mathematical bridge', {}, error);
    return res.status(500).json({ success: false, message });
  }
};

export const getTop50Vendors = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const vendors = db.getModule2Top50Vendors();
    return res.json({
      success: true,
      data: {
        vendors,
        count: vendors.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch Top 50 vendors';
    logger.error('Failed to fetch Top 50 vendors', {}, error);
    return res.status(500).json({ success: false, message });
  }
};

export const getSupplierRisk = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const risk = db.getModule2SupplierRisk();
    return res.json({
      success: true,
      data: {
        risk,
        count: risk.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch supplier risk';
    logger.error('Failed to fetch supplier risk', {}, error);
    return res.status(500).json({ success: false, message });
  }
};

export const getPoConsolidation = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const poItems = db.getModule2PoConsolidation();
    return res.json({
      success: true,
      data: {
        poItems,
        count: poItems.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch PO consolidation';
    logger.error('Failed to fetch PO consolidation', {}, error);
    return res.status(500).json({ success: false, message });
  }
};

export const getRecurringSpend = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const recurring = db.getModule2RecurringSpend();
    return res.json({
      success: true,
      data: {
        recurring,
        count: recurring.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch recurring spend';
    logger.error('Failed to fetch recurring spend', {}, error);
    return res.status(500).json({ success: false, message });
  }
};

export const getLineItems = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const limit = Number(req.query.limit) || 500;
    const offset = Number(req.query.offset) || 0;
    const txs = db.getModule2StrategicTransactions();

    const lineItems = txs
      .slice(offset, offset + limit)
      .map((t: StrategicInputTransaction, idx: number) => mapTxToLineItem(t, idx, offset));

    return res.json({
      success: true,
      data: {
        lineItems,
        totalCount: txs.length,
        offset,
        limit
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch line items';
    logger.error('Failed to fetch line items', {}, error);
    return res.status(500).json({ success: false, message });
  }
};
