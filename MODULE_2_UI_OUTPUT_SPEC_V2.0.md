# MODULE 2 — UI OUTPUT & COMPONENT PRESENTATION SPECIFICATION V2.0
**Document ID**: `MODULE_2_UI_OUTPUT_SPEC_V2.0`  
**Governing Standard**: Enterprise Premium Aesthetics, Transparent Auditability, Interactive "How Calculated?" Drawers

---

## 1. Information Architecture Hierarchy
The user interface presents strategic sourcing intelligence in a structured, decision-oriented sequence:
1. **WHERE IS THE SPEND?** — Fiscal Year Breakdown & Material Spend Hierarchy.
2. **WHERE IS THE FRAGMENTATION?** — HHI Indices, Tail Ratios, and Disparity Alarms.
3. **WHAT SOURCING LEVER EXISTS?** — E-Auction, Vendor Consolidation, Specialist Sourcing, Volume Bundling, or PO Optimization.
4. **WHAT EVIDENCE SUPPORTS IT?** — Historical Price Dispersion, Quartiles, and Reference Transactions.
5. **WHAT IS THE QUANTIFIABLE BENEFIT?** — Net Deduplicated Commercial Opportunity.
6. **WHAT IS NOT QUANTIFIABLE?** — Transparent qualification notes and missing evidence reasons.
7. **WHAT SHOULD SOURCING DO NEXT?** — Priority Actions, Sourcing Theses, and RFP/Auction Handoff.

---

## 2. Interactive "How Calculated?" Drawer
For every opportunity card, category row, and deep-dive view:
- **Trigger**: Clickable `"How calculated?"` badge or formula button.
- **Drawer / Modal Contents**:
  - Step 1: Current Category Spend
  - Step 2: Eligible Spend
  - Step 3: Eligible Quantity
  - Step 4: Current Weighted Price
  - Step 5: Historical Reference Price
  - Step 6: Price Differential
  - Step 7: Gross Opportunity
  - Step 8: Overlap Adjustment
  - Step 9: Net Quantifiable Opportunity
  - Bottom Metadata: Confidence Tier, Calculation ID, and Disqualification/Audit Rules.

---

## 3. UI Component Matrix
| Component | File Path | Purpose |
|---|---|---|
| `StrategicSourcingDashboardCards` | `frontend/src/components/module2/StrategicSourcingDashboardCards.tsx` | 10 executive KPI cards distinguishing spend from benefit. |
| `StrategicSourcingCategoryTable` | `frontend/src/components/module2/StrategicSourcingCategoryTable.tsx` | Category listing with status badges, opportunity metrics, and calculation triggers. |
| `StrategicSourcingDeepDiveModal` | `frontend/src/components/module2/StrategicSourcingDeepDiveModal.tsx` | 20-section comprehensive sourcing deep dive per category. |
| `HowCalculatedModal` | `frontend/src/components/module2/HowCalculatedModal.tsx` | 9-step mathematical trace modal. |
| `VendorCategorySupplyMatrix` | `frontend/src/components/VendorCategorySupplyMatrix.tsx` | Top 50 vendor cross-category supply analysis and disparity alarms. |
