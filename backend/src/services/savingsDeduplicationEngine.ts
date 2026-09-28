/**
 * Savings De-Duplication & Overlap Engine (Master Product Spec - Prompt 100)
 * 
 * Rules:
 * 1. The same spend may appear in multiple opportunity engines (PCBI, E-Auction, Vendor Consolidation).
 * 2. Never double-count opportunities across the same material/spend.
 * 3. Detect overlaps and group by overlap_id.
 * 4. Maintain deterministic savings waterfall:
 *    TOTAL SPEND → ADDRESSABLE SPEND → IDENTIFIED OPPORTUNITIES → POTENTIAL SAVINGS →
 *    VALIDATED SAVINGS → APPROVED SAVINGS → REALIZED SAVINGS.
 */

import type {
  SavingsOpportunityItem,
  OpportunityOverlapGroup,
  SavingsWaterfallMetrics,
  ActionPlanItem
} from '../types/savings';

export class SavingsDeduplicationEngine {
  /**
   * Process raw opportunities and produce deduplicated savings with overlap detection
   */
  public deduplicateOpportunities(
    opportunities: SavingsOpportunityItem[],
    totalSpendInr: number = 0,
    addressableSpendInr: number = 0
  ): {
    opportunities: SavingsOpportunityItem[];
    overlaps: OpportunityOverlapGroup[];
    waterfallMetrics: SavingsWaterfallMetrics;
  } {
    // 1. Group opportunities by item code/key
    const itemMap = new Map<string, SavingsOpportunityItem[]>();

    for (const opp of opportunities) {
      const itemKey = (opp.item || 'GENERAL').trim().toUpperCase();
      const list = itemMap.get(itemKey) || [];
      list.push({ ...opp });
      itemMap.set(itemKey, list);
    }

    const processedOpps: SavingsOpportunityItem[] = [];
    const overlapGroups: OpportunityOverlapGroup[] = [];

    // 2. Detect overlaps and apply non-overlapping hierarchy
    for (const [itemKey, group] of itemMap.entries()) {
      if (group.length === 1) {
        // Single opportunity on this item: No overlap
        const single = group[0];
        single.is_overlapping = false;
        single.net_savings_inr = single.potential_savings_inr;
        single.net_savings_inr_cr = single.potential_savings_inr_cr;
        processedOpps.push(single);
      } else {
        // Multiple opportunities on the same item: OVERLAP DETECTED
        const overlapId = `OVL-${itemKey}-${Date.now().toString(36)}`;
        
        // Sort descending by potential savings so highest value opportunity is primary
        group.sort((a, b) => b.potential_savings_inr - a.potential_savings_inr);

        const primaryOpp = group[0];
        primaryOpp.overlap_id = overlapId;
        primaryOpp.is_overlapping = false; // Primary takes full value
        primaryOpp.net_savings_inr = primaryOpp.potential_savings_inr;
        primaryOpp.net_savings_inr_cr = primaryOpp.potential_savings_inr_cr;
        processedOpps.push(primaryOpp);

        let totalGrossSavings = primaryOpp.potential_savings_inr;
        const totalNetSavings = primaryOpp.potential_savings_inr;
        let totalDeduplicated = 0;

        const overlapDetailList = [
          {
            opportunity_id: primaryOpp.opportunity_id,
            source_engine: primaryOpp.source_engine,
            gross_savings_inr: primaryOpp.potential_savings_inr,
            deduplicated_amount_inr: 0,
            net_savings_inr: primaryOpp.potential_savings_inr
          }
        ];

        // Secondary overlapping opportunities: mark as overlapping and deduplicate
        for (let i = 1; i < group.length; i++) {
          const secondary = group[i];
          secondary.overlap_id = overlapId;
          secondary.is_overlapping = true;
          // In standard procurement methodology: secondary overlapping opportunities are deduplicated
          const deduplicatedAmount = secondary.potential_savings_inr;
          secondary.net_savings_inr = 0;
          secondary.net_savings_inr_cr = 0;
          processedOpps.push(secondary);

          totalGrossSavings += secondary.potential_savings_inr;
          totalDeduplicated += deduplicatedAmount;

          overlapDetailList.push({
            opportunity_id: secondary.opportunity_id,
            source_engine: secondary.source_engine,
            gross_savings_inr: secondary.potential_savings_inr,
            deduplicated_amount_inr: deduplicatedAmount,
            net_savings_inr: 0
          });
        }

        overlapGroups.push({
          overlap_id: overlapId,
          item: itemKey,
          vendor: primaryOpp.vendor,
          primary_opportunity_id: primaryOpp.opportunity_id,
          primary_engine: primaryOpp.source_engine,
          primary_savings_inr: primaryOpp.potential_savings_inr,
          overlapping_opportunities: overlapDetailList,
          total_gross_savings_inr: totalGrossSavings,
          total_net_savings_inr: totalNetSavings,
          total_deduplicated_inr: totalDeduplicated
        });
      }
    }

    // 3. Compute Savings Waterfall Metrics
    const grossPotentialSavings = processedOpps.reduce((sum, o) => sum + o.potential_savings_inr, 0);
    const netPotentialSavings = processedOpps.reduce((sum, o) => sum + o.net_savings_inr, 0);
    const deduplicatedOverlap = Math.max(0, grossPotentialSavings - netPotentialSavings);

    const validatedSavings = processedOpps
      .filter((o) => o.status === 'VALIDATED' || o.status === 'APPROVED' || o.status === 'IMPLEMENTING' || o.status === 'REALIZED')
      .reduce((sum, o) => sum + o.net_savings_inr, 0);

    const approvedSavings = processedOpps
      .filter((o) => o.status === 'APPROVED' || o.status === 'IMPLEMENTING' || o.status === 'REALIZED')
      .reduce((sum, o) => sum + o.net_savings_inr, 0);

    const realizedSavings = processedOpps
      .filter((o) => o.status === 'REALIZED')
      .reduce((sum, o) => sum + o.net_savings_inr, 0);

    const totalSpendCr = totalSpendInr > 0 ? Number((totalSpendInr / 10000000).toFixed(2)) : 100.0;
    const defaultAddr = Number((totalSpendCr * 0.76).toFixed(2));
    const addrSpendCr = addressableSpendInr > 0
      ? Number((addressableSpendInr / 10000000).toFixed(2))
      : defaultAddr;

    const waterfallMetrics: SavingsWaterfallMetrics = {
      total_spend_inr_cr: totalSpendCr,
      addressable_spend_inr_cr: addrSpendCr,
      identified_opportunities_count: processedOpps.length,
      gross_potential_savings_inr_cr: Number((grossPotentialSavings / 10000000).toFixed(2)),
      deduplicated_overlap_inr_cr: Number((deduplicatedOverlap / 10000000).toFixed(2)),
      net_potential_savings_inr_cr: Number((netPotentialSavings / 10000000).toFixed(2)),
      validated_savings_inr_cr: Number((validatedSavings / 10000000).toFixed(2)),
      approved_savings_inr_cr: Number((approvedSavings / 10000000).toFixed(2)),
      realized_savings_inr_cr: Number((realizedSavings / 10000000).toFixed(2))
    };

    return {
      opportunities: processedOpps,
      overlaps: overlapGroups,
      waterfallMetrics
    };
  }

  /**
   * Convert opportunity into an actionable plan item
   */
  public convertToActionPlan(
    opp: SavingsOpportunityItem,
    custom: Partial<ActionPlanItem> = {}
  ): ActionPlanItem {
    return {
      id: `act-${opp.opportunity_id}`,
      opportunity_id: opp.opportunity_id,
      action: custom.action || `Renegotiate rate and execute strategic sourcing for ${opp.item}`,
      owner: custom.owner || opp.owner || 'Procurement',
      department: custom.department || opp.department || 'Procurement & Supply Chain',
      target_date: custom.target_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: custom.priority || 'HIGH',
      expected_value_inr: opp.net_savings_inr,
      expected_value_inr_cr: opp.net_savings_inr_cr,
      status: custom.status || 'Open',
      comments: custom.comments || `Originated from ${opp.source_module} (${opp.source_engine})`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export const savingsDeduplicationEngine = new SavingsDeduplicationEngine();
