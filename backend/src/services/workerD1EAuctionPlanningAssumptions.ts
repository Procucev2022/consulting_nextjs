import { D1_TABLES } from '../constants/d1';
import type { AuctionPlanningAssumption } from '../types/module2EAuction';
import type { EAuctionPlanningAssumptionInput } from '../types/validation';
import type { CloudflareD1Database } from '../types/cloudflare';

interface EAuctionPlanningAssumptionD1Row {
  assumption_id: string;
  category_or_material: string;
  min_savings_rate: number;
  expected_savings_rate: number;
  max_savings_rate: number;
  rate_source: string;
  reference_period: string;
  applicability: string;
  approval_status: AuctionPlanningAssumption['approvalStatus'];
  approved_by: string | null;
  approved_date: string | null;
  confidence: AuctionPlanningAssumption['confidence'];
  is_planning_assumption_only: number;
  notes: string | null;
}

const mapAssumption = (row: EAuctionPlanningAssumptionD1Row): AuctionPlanningAssumption => ({
  id: row.assumption_id,
  categoryOrMaterial: row.category_or_material,
  minSavingsRate: Number(row.min_savings_rate),
  expectedSavingsRate: Number(row.expected_savings_rate),
  maxSavingsRate: Number(row.max_savings_rate),
  rateSource: row.rate_source,
  referencePeriod: row.reference_period,
  applicability: row.applicability,
  approvalStatus: row.approval_status,
  ...(row.approved_by ? { approvedBy: row.approved_by } : {}),
  ...(row.approved_date ? { approvedDate: row.approved_date } : {}),
  confidence: row.confidence,
  isPlanningAssumptionOnly: row.is_planning_assumption_only === 1,
  ...(row.notes ? { notes: row.notes } : {})
});

export const loadEAuctionPlanningAssumptions = async (
  db: CloudflareD1Database
): Promise<AuctionPlanningAssumption[]> => {
  const response = await db.prepare(`
    SELECT assumption_id, category_or_material, min_savings_rate, expected_savings_rate, max_savings_rate,
      rate_source, reference_period, applicability, approval_status, approved_by, approved_date, confidence,
      is_planning_assumption_only, notes
    FROM ${D1_TABLES.eAuctionPlanningAssumptions}
    ORDER BY category_or_material ASC, assumption_id ASC
  `).all<EAuctionPlanningAssumptionD1Row>();
  return (response.results || []).map(mapAssumption);
};

export const saveEAuctionPlanningAssumption = async (
  db: CloudflareD1Database,
  assumption: EAuctionPlanningAssumptionInput,
  updatedBy: string,
  updatedAt: string
): Promise<AuctionPlanningAssumption> => {
  await db.prepare(`
    INSERT INTO ${D1_TABLES.eAuctionPlanningAssumptions} (
      assumption_id, category_or_material, min_savings_rate, expected_savings_rate, max_savings_rate,
      rate_source, reference_period, applicability, approval_status, approved_by, approved_date, confidence,
      is_planning_assumption_only, notes, updated_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    ON CONFLICT(assumption_id) DO UPDATE SET
      category_or_material = excluded.category_or_material,
      min_savings_rate = excluded.min_savings_rate,
      expected_savings_rate = excluded.expected_savings_rate,
      max_savings_rate = excluded.max_savings_rate,
      rate_source = excluded.rate_source,
      reference_period = excluded.reference_period,
      applicability = excluded.applicability,
      approval_status = excluded.approval_status,
      approved_by = excluded.approved_by,
      approved_date = excluded.approved_date,
      confidence = excluded.confidence,
      notes = excluded.notes,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
  `).bind(
    assumption.id, assumption.categoryOrMaterial, assumption.minSavingsRate, assumption.expectedSavingsRate,
    assumption.maxSavingsRate, assumption.rateSource, assumption.referencePeriod, assumption.applicability,
    assumption.approvalStatus, assumption.approvedBy || null, assumption.approvedDate || null,
    assumption.confidence, assumption.notes || null, updatedBy, updatedAt
  ).run();
  return {
    ...assumption,
    ...(assumption.approvedBy ? { approvedBy: assumption.approvedBy } : {}),
    ...(assumption.approvedDate ? { approvedDate: assumption.approvedDate } : {}),
    ...(assumption.notes ? { notes: assumption.notes } : {})
  };
};
