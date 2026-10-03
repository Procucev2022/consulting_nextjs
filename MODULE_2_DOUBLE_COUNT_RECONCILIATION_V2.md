# MODULE 2 — DOUBLE-COUNT RECONCILIATION & WATERFALL V2 SPECIFICATION
====================================================================================================
VERSION: MODULE_2_DOUBLE_COUNT_RECONCILIATION_V2.0
STATUS: FINAL BUSINESS LOGIC HARDENING
====================================================================================================

## 1. The Double-Counting Problem in Strategic Sourcing

When evaluating multiple sourcing levers simultaneously (e.g. Price Variance, E-Auction, Supplier Consolidation, Volume Leverage), **the same underlying rupee of price spread is targeted by multiple execution mechanisms**:
- An e-auction achieves lower prices by inducing supplier bidding down to $P_{25}$.
- Supplier consolidation achieves lower prices by shifting tail volume to the low-cost supplier at $P_{25}$.
- **Summing both creates an inflated, unachievable theoretical savings pool.**

Module 2 enforces **Zero Double-Counting Architecture**.

---

## 2. Double-Count Reconciliation Architecture

Each opportunity component is tagged with structural IDs:
- `opportunityComponentId`: Unique identifier for the lever calculation.
- `overlapGroupId`: Grouping ID connecting intersecting levers (e.g. `GRP-PRICE-AUCT-CONSOL`).
- `primaryOpportunity`: Flag designating the primary execution mechanism.
- `overlapAmount`: The intersection amount deducted from gross potential.
- `netOpportunity`: The deduplicated defensible pool.

### Mathematical Reconciliation Formula:
$$\text{Gross Opportunity} = \text{Opp}_{\text{EAuction}} + \text{Opp}_{\text{Consolidation}} + \text{Opp}_{\text{Commercial}}$$
$$\text{Overlap Amount} = \min(\text{Opp}_{\text{EAuction Price Gap}}, \text{Opp}_{\text{Consolidation Price Variance}})$$
$$\text{Net Defensible Opportunity Potential} = \text{Gross Opportunity} - \text{Overlap Amount}$$

---

## 3. The 13-Stage Opportunity Waterfall V2.0

Module 2 structures the path from gross spend to net defensible pool across 13 transparent stages:

```
Stage 1:  TOTAL CATEGORY SPEND (Gross Ingested Category Spend)
              ↓
Stage 2:  ADDRESSABLE SPEND (Spend after subtracting statutory/non-controllable items)
              ↓
Stage 3:  COMPARABLE SPEND (Normalized spend with matching specifications and UOMs)
              ↓
Stage 4:  PRICE OPPORTUNITY (Direct historical variance: WAP vs P25 reference)
              ↓
Stage 5:  VOLUME LEVERAGE (Volume batching & order consolidation potential)
              ↓
Stage 6:  E-AUCTION OPPORTUNITY (Competitive reverse bidding potential)
              ↓
Stage 7:  SUPPLIER CONSOLIDATION (Tail-spend migration & operational PO reduction)
              ↓
Stage 8:  CATEGORY SPECIALIZATION (Cross-category generalist vendor reallocation)
              ↓
Stage 9:  COMMERCIAL / CONTRACT OPPORTUNITY (Non-monetary clause optimization)
              ↓
Stage 10: PROCESS / DEMAND OPPORTUNITY (Order frequency & demand smoothing)
              ↓
Stage 11: MARKET DISCOVERY POTENTIAL (Structural market tender required; non-monetary)
              ↓
Stage 12: OVERLAP / DOUBLE COUNT ADJUSTMENT (Deduction of shared price variance)
              ↓
Stage 13: NET DEFENSIBLE OPPORTUNITY POTENTIAL (Final audit-ready sourcing target)
```

---

## 4. Stage-by-Stage Attribution Table

Each stage exposes:
1. `startingAmountInr`: Baseline spend or cumulative opportunity before stage execution.
2. `eligibleAmountInr`: Portioned amount qualified for the specific stage.
3. `excludedAmountInr`: Excluded portion with reason code (e.g., `UNHARMONIZED_SPEC`, `SINGLE_SUPPLIER_INSULATION`).
4. `evidenceLevel`: `HIGH`, `MEDIUM`, `LOW`, or `INSUFFICIENT`.
5. `confidence`: Mathematical validation confidence rating.
