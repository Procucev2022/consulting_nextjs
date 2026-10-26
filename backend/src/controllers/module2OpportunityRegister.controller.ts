/**
 * Module 2 — Stage 2: Opportunity Register Controller
 * Compliant with Repository Rules: Section 4 (Structured Logging), Section 10 (Input Validation),
 * max 300 lines, cyclomatic complexity <= 10, max line length 120 chars
 */

import type { Request, Response } from 'express';
import logger from '../utils/logger';
import { Module2OpportunityRegisterEngine } from '../services/module2OpportunityRegisterEngine';
import { opportunityRegisterQuerySchema } from '../constants/module2OpportunityValidation';

export class Module2OpportunityRegisterController {
  public static async getOpportunityRegister(req: Request, res: Response): Promise<Response | void> {
    const requestId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;
    const parsed = opportunityRegisterQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      logger.warn('Opportunity Register query validation failed', {
        requestId,
        errors: parsed.error.format()
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters for Opportunity Register',
        errors: parsed.error.format()
      });
    }

    try {
      const result = await Module2OpportunityRegisterEngine.queryOpportunities(parsed.data);
      logger.info('Opportunity Register successfully queried', {
        requestId,
        assessmentId: parsed.data.assessmentId,
        count: result.opportunities.length
      });
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      logger.error('Failed to generate Opportunity Register', { requestId, assessmentId: parsed.data.assessmentId }, err);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate Material-Level Opportunity Register',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  public static async getExecutiveDashboard(req: Request, res: Response): Promise<Response | void> {
    const requestId = (req.headers['x-request-id'] as string) || `REQ-${Date.now()}`;
    const assessmentId = (req.query.assessmentId as string) || '';

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required for Executive Dashboard'
      });
    }

    try {
      const result = await Module2OpportunityRegisterEngine.generateRegister(assessmentId);
      logger.info('Executive Opportunity Dashboard successfully queried', {
        requestId,
        assessmentId,
        totalOpps: result.summary.totalOpportunitiesCount
      });
      return res.status(200).json({
        success: true,
        data: {
          assessmentId: result.assessmentId,
          customerName: result.customerName,
          generatedAt: result.generatedAt,
          summary: result.summary,
          exclusionsSummary: result.exclusionsSummary
        }
      });
    } catch (err) {
      logger.error('Failed to generate Executive Dashboard', { requestId, assessmentId }, err);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate Executive Opportunity Dashboard',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  public static async exportOpportunityRegisterCsv(req: Request, res: Response): Promise<Response | void> {
    const assessmentId = (req.query.assessmentId as string) || 'AIC-2026-0002';
    try {
      const result = await Module2OpportunityRegisterEngine.generateRegister(assessmentId);
      const headers = [
        'Opportunity ID', 'Type', 'Category', 'Material Code', 'Material Description', 'UOM',
        'Supporting Txs', 'Historical Spend (INR)', 'Historical Spend (Cr)',
        'Defensible Value (INR)', 'Defensible Value (Cr)', 'Status', 'Confidence',
        'Suppliers Involved', 'Plants Involved', 'Rationale', 'Required Action', 'Responsible Team'
      ];

      const rows = result.opportunities.map((o) => [
        `"${o.opportunityId}"`,
        `"${o.opportunityType}"`,
        `"${(o.category || '').replace(/"/g, '""')}"`,
        `"${(o.materialCode || '').replace(/"/g, '""')}"`,
        `"${(o.materialDescription || '').replace(/"/g, '""')}"`,
        `"${o.uom || 'N/A'}"`,
        o.supportingTransactionCount,
        o.historicalSpendInr,
        o.historicalSpendCr,
        o.defensibleOpportunityValueInr ?? 'N/A',
        o.defensibleOpportunityValueCr ?? 'N/A',
        `"${o.status}"`,
        `"${o.confidenceLevel}"`,
        `"${(o.suppliersInvolved || []).join('; ').replace(/"/g, '""')}"`,
        `"${(o.plantsInvolved || []).join('; ')}"`,
        `"${(o.rationale || '').replace(/"/g, '""')}"`,
        `"${(o.requiredProcurementAction || '').replace(/"/g, '""')}"`,
        `"${(o.responsibleValidationTeam || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="OPPORTUNITY_REGISTER_${assessmentId}_${Date.now()}.csv"`
      );
      return res.status(200).send(csvContent);
    } catch (err) {
      logger.error('Failed to export Opportunity Register CSV', { assessmentId }, err);
      return res.status(500).json({
        success: false,
        message: 'Failed to export Opportunity Register CSV'
      });
    }
  }
}
