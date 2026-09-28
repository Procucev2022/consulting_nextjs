/**
 * Strategic Sourcing Engine Configuration Constants (Prompt 100)
 */

export const STRATEGIC_SOURCING_CONSTANTS = {
  // 1. Vendor Consolidation
  VENDOR_CONSOLIDATION_MIN_VENDORS: 2,
  VENDOR_CONSOLIDATION_SAVINGS_RATE: 0.05, // 5% savings on tail/fragmented vendor spend

  // 2. PO Consolidation
  PO_CONSOLIDATION_MIN_POS: 3,
  PO_CONSOLIDATION_ADMIN_COST_PER_PO: 2500, // ₹2,500 administrative cost per excess small PO
  PO_CONSOLIDATION_VOLUME_REBATE_RATE: 0.02, // 2% volume rebate

  // 3. E-Auction / Competitive Sourcing
  EAUCTION_MIN_SPEND_INR: 5000000, // ₹50 Lakhs spend threshold for e-Auction
  EAUCTION_MIN_VENDORS: 2,
  EAUCTION_SAVINGS_RATE: 0.07, // 7% competitive bidding savings

  // 4. Rate Contract
  RATE_CONTRACT_MIN_RECURRING_POS: 4,
  RATE_CONTRACT_SAVINGS_RATE: 0.04, // 4% annual rate contract savings

  // 5. Specification Rationalization
  SPEC_RATIONALIZATION_SAVINGS_RATE: 0.05, // 5% SKU standardization reduction

  // 6. Demand Consolidation
  DEMAND_CONSOLIDATION_MIN_PLANTS: 2,
  DEMAND_CONSOLIDATION_SAVINGS_RATE: 0.04, // 4% multi-plant volume pooling savings

  // 7. New Vendor Development
  NEW_VENDOR_DOMINANT_SHARE_THRESHOLD_PCT: 80, // 80% vendor concentration threshold
  NEW_VENDOR_SAVINGS_RATE: 0.06, // 6% competitive tension savings

  // 8. Alternate Material / Make-Buy
  ALTERNATE_MATERIAL_SAVINGS_RATE: 0.08, // 8% value engineering potential
  ALTERNATE_MATERIAL_VALIDATION_LABEL: 'OPPORTUNITY REQUIRING VALIDATION' as const
} as const;
