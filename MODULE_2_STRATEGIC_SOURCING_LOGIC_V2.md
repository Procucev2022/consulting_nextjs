# MODULE 2 — STRATEGIC SOURCING LOGIC MASTER SPECIFICATION V2.0
**Document ID**: `MODULE_2_STRATEGIC_SOURCING_LOGIC_V2.md`  
**Scope**: Module 2 Only (Strictly isolated from Module 1, Module 3/PCBI, and Module 4)

---

## 1. Ten Core Answers Provided by Module 2
1. **WHERE is the spend?** — Visualized across 3 fiscal years (FY24, FY25, FY26) by category, subcategory, and material item.
2. **HOW is the spend distributed?** — Breakdown across recurring, spot, contracted, and fragmented volume pools.
3. **WHO are the suppliers?** — Multi-category vs single-category specialists, core tier vs tail tier distribution.
4. **WHERE is fragmentation / concentration?** — Herfindahl-Hirschman Index (HHI), tail ratio (>40% tail spend alerts), sole-source dependency flags.
5. **WHAT price dispersion exists?** — Interquartile Range (IQR), Median, P25, P75, and empirical dispersion percentage.
6. **WHERE can volume be consolidated?** — Pooling fragmented small-order batches where price-volume slopes prove achievable tier discounts.
7. **WHERE can suppliers be consolidated?** — Re-aligning tail suppliers with core supplier benchmark rates without reducing supplier counts arbitrarily.
8. **WHERE is an e-auction suitable?** — 7-dimensional readiness scoring (comparable spec, UOM, currency, $\ge 3$ vendors, recurrence, dispersion).
9. **WHAT is the defensible opportunity?** — Gross Identified Opportunity minus Overlap Adjustment = Net Defensible Opportunity Pool.
10. **WHY is that opportunity defensible?** — 9-step mathematical trace modal ("How calculated?") drilling back to individual transaction IDs.

---

## 2. Strict Boundary & Zero External Benchmarks
Module 2 is an independent Strategic Sourcing Intelligence Engine that operates **strictly** from the customer's own validated procurement transactions:
- Zero PCBI indices or external commodity market indices.
- Zero assumed percentages (e.g. assumed 3%, 5%, 8%, 10%).
- Zero synthetic discounts or target prices.
- If data is insufficient to substantiate an opportunity, status is set to `IDENTIFIED_NOT_QUANTIFIABLE` (never false ₹0.00).

---

## 3. Handover Protocol to Module 4
When an opportunity is approved for execution:
- Module 2 generates an immutable `SourcingOpportunityAuditRecord` containing calculation ID, source transaction IDs, baseline price, reference price, eligible volume, and confidence level.
- The record is handed over to Module 4 (Execution & Savings Realization) where actual RFP/e-auction bids are tracked against the historical baseline to quantify realized savings.
