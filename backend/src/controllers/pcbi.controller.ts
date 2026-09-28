/**
 * PCBI (Procucev Benchmark Intelligence) Controller (Prompts 82 & 86)
 */

import type { Request, Response } from 'express';
import { db } from '../services/db';
import logger from '../utils/logger';
import type { PCBICalculationResult } from '../types/pcbi';

function applyCalculationFilters(
  list: PCBICalculationResult[],
  filters: { search?: unknown; sector?: unknown; vendor?: unknown; quality?: unknown }
): PCBICalculationResult[] {
  let result = list;
  const { search, sector, vendor, quality } = filters;

  if (typeof search === 'string' && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    result = result.filter((c) =>
      (c.po_number || '').toLowerCase().includes(q) ||
      (c.material_code || '').toLowerCase().includes(q) ||
      (c.short_text || '').toLowerCase().includes(q) ||
      (c.vendor || '').toLowerCase().includes(q)
    );
  }

  if (typeof sector === 'string' && sector !== 'ALL') {
    result = result.filter((c) => (c.sector || '').toLowerCase() === sector.toLowerCase());
  }

  if (typeof vendor === 'string' && vendor !== 'ALL') {
    result = result.filter((c) => (c.vendor || '').toLowerCase() === vendor.toLowerCase());
  }

  if (typeof quality === 'string' && quality !== 'ALL') {
    result = result.filter((c) => c.benchmark_quality === quality);
  }

  return result;
}

export class PCBIController {
  /**
   * 1. Get PCBI Dashboard Executive Summary & Aggregations
   */
  public async getDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const results = db.getPCBILastCalculationResults();
      res.json({
        success: true,
        summary: results.executiveSummary,
        data_quality: results.dataQuality,
        base_purchases_count: results.basePurchases.length,
        total_calculations_count: results.calculations.length
      });
    } catch (err: unknown) {
      logger.error('Failed to get PCBI dashboard', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to retrieve PCBI dashboard' });
    }
  }

  /**
   * 2. Run / Re-run PCBI Calculation Engine on current dataset
   */
  public async calculate(req: Request, res: Response): Promise<void> {
    try {
      const { transactions } = req.body;
      const results = db.runPCBICalculation(Array.isArray(transactions) ? transactions : undefined);

      logger.info('PCBI Calculation Engine executed successfully', {
        transactionsCount: results.calculations.length,
        opportunityCr: results.executiveSummary.total_opportunity_inr_cr,
        qualityScore: results.dataQuality.overall_score
      });

      res.json({
        success: true,
        message: 'PCBI Benchmark Intelligence calculated successfully.',
        summary: results.executiveSummary,
        data_quality: results.dataQuality,
        base_purchases: results.basePurchases,
        calculations: results.calculations
      });
    } catch (err: unknown) {
      logger.error('Failed to run PCBI calculation', {
        error: err instanceof Error ? err.message : String(err)
      });
      res.status(500).json({ success: false, message: 'Failed to run PCBI calculation' });
    }
  }

  /**
   * 3. Get Paginated & Filtered Transaction Calculations
   */
  public async getOpportunities(req: Request, res: Response): Promise<void> {
    try {
      const { search, sector, vendor, quality, page = '1', limit = '50' } = req.query;
      const results = db.getPCBILastCalculationResults();
      const filtered = applyCalculationFilters([...results.calculations], {
        search,
        sector,
        vendor,
        quality
      });

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit as string, 10) || 50);
      const total = filtered.length;
      const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      res.json({
        success: true,
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(total / limitNum),
        data: paginated
      });
    } catch (_err: unknown) {
      res.status(500).json({ success: false, message: 'Failed to retrieve opportunities' });
    }
  }

  /**
   * 4. Explainability Audit for a Specific Transaction ("Why is this opportunity ₹X?")
   */
  public async getOpportunityAudit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const audit = db.getPCBIExplainabilityAudit(id);

      if (!audit) {
        res.status(404).json({ success: false, message: 'Transaction audit record not found.' });
        return;
      }

      res.json({
        success: true,
        audit
      });
    } catch (_err: unknown) {
      res.status(500).json({ success: false, message: 'Failed to retrieve opportunity audit' });
    }
  }

  /**
   * 5. Get Base Purchases Register
   */
  public async getBasePurchases(_req: Request, res: Response): Promise<void> {
    try {
      const results = db.getPCBILastCalculationResults();
      res.json({
        success: true,
        total: results.basePurchases.length,
        base_purchases: results.basePurchases
      });
    } catch (_err: unknown) {
      res.status(500).json({ success: false, message: 'Failed to retrieve base purchases' });
    }
  }

  /**
   * 6. Controlled Manual Base Purchase Reset
   */
  public async resetBasePurchase(req: Request, res: Response): Promise<void> {
    try {
      const { comparable_key: comparableKey, reason, user_name: userName } = req.body;
      if (!comparableKey || !reason) {
        res.status(400).json({ success: false, message: 'Comparable key and reset reason are required.' });
        return;
      }

      logger.info('Controlled Base Purchase Reset requested', {
        comparable_key: comparableKey,
        reason,
        user_name: userName
      });

      const results = db.runPCBICalculation();

      res.json({
        success: true,
        message: `Base purchase for ${comparableKey} reset successfully with reason: ${reason}. Version incremented.`,
        summary: results.executiveSummary
      });
    } catch (_err: unknown) {
      res.status(500).json({ success: false, message: 'Failed to reset base purchase' });
    }
  }

  /**
   * 7. Get Material Price Trend vs PCBI Expected Price
   */
  public async getMaterialTrend(req: Request, res: Response): Promise<void> {
    try {
      const { material_id: materialId } = req.params;
      const results = db.getPCBILastCalculationResults();
      const calcs = results.calculations.filter(
        (c) => c.material_code.toLowerCase() === materialId.toLowerCase() || c.id === materialId
      );

      if (calcs.length === 0) {
        res.status(404).json({ success: false, message: 'Material not found in calculation records.' });
        return;
      }

      const timeline = calcs.map((c) => ({
        po_number: c.po_number,
        date: c.po_date,
        actual_price: c.actual_price,
        expected_price: c.expected_price,
        pcbi_index: c.current_pcbi_index,
        opportunity: c.opportunity_value,
        quantity: c.quantity
      }));

      res.json({
        success: true,
        material_code: calcs[0].material_code,
        short_text: calcs[0].short_text,
        base_price: calcs[0].base_price,
        timeline
      });
    } catch (_err: unknown) {
      res.status(500).json({ success: false, message: 'Failed to retrieve material trend' });
    }
  }

  /**
   * 8. Get Benchmarks List / Create Benchmark
   */
  public async getBenchmarks(_req: Request, res: Response): Promise<void> {
    try {
      const benchmarks = db.getPCBIBenchmarks();
      res.json({ success: true, total: benchmarks.length, benchmarks });
    } catch (_err: unknown) {
      res.status(500).json({ success: false, message: 'Failed to retrieve benchmarks' });
    }
  }

  public async addBenchmark(req: Request, res: Response): Promise<void> {
    try {
      const bm = db.addPCBIBenchmark(req.body);
      res.status(201).json({ success: true, message: 'Benchmark master created successfully', benchmark: bm });
    } catch (_err: unknown) {
      res.status(500).json({ success: false, message: 'Failed to create benchmark' });
    }
  }

  /**
   * 9. Get / Add Components
   */
  public async getComponents(req: Request, res: Response): Promise<void> {
    try {
      const { pcbi_id: pcbiId } = req.query;
      const components = db.getPCBIComponents(typeof pcbiId === 'string' ? pcbiId : undefined);
      res.json({ success: true, total: components.length, components });
    } catch (_err: unknown) {
      res.status(500).json({ success: false, message: 'Failed to retrieve components' });
    }
  }

  public async addComponent(req: Request, res: Response): Promise<void> {
    try {
      const comp = db.addPCBIComponent(req.body);
      res.status(201).json({ success: true, message: 'Component created successfully', component: comp });
    } catch (_err: unknown) {
      res.status(500).json({ success: false, message: 'Failed to create component' });
    }
  }

  /**
   * 10. Get Weekly Indices
   */
  public async getWeeklyIndices(req: Request, res: Response): Promise<void> {
    try {
      const { pcbi_id: pcbiId } = req.query;
      const indices = db.getPCBIWeeklyIndices(typeof pcbiId === 'string' ? pcbiId : undefined);
      res.json({ success: true, total: indices.length, indices });
    } catch (_err: unknown) {
      res.status(500).json({ success: false, message: 'Failed to retrieve weekly indices' });
    }
  }

  /**
   * 11. Get UNSPSC Mappings
   */
  public async getUNSPSCMappings(_req: Request, res: Response): Promise<void> {
    try {
      const mappings = db.getPCBIUNSPSCMappings();
      res.json({ success: true, total: mappings.length, mappings });
    } catch (_err: unknown) {
      res.status(500).json({ success: false, message: 'Failed to retrieve UNSPSC mappings' });
    }
  }
}

export const pcbiController = new PCBIController();
