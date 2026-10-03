# MODULE 2 — STRATEGIC SOURCING INTELLIGENCE, E-AUCTION & VENDOR CONSOLIDATION ENGINE
## Version: MODULE_2_SOURCING_LOGIC_V1.0
### Document Type: Architectural & Business Logic Specification

---

## 1. Executive Summary & Purpose
This document establishes the enterprise architecture and governance framework for **Module 2: Strategic Sourcing Intelligence, E-Auction & Vendor Consolidation Engine (V1.0)** within aiCEV Enterprise by Procucev.

The core objective is to transform Module 2 from a classification and spend-aggregation view into an analytical **Strategic Sourcing Opportunity Engine**. Module 2 equips enterprise procurement teams with empirical, defensible historical transaction intelligence BEFORE sourcing execution in Module 4.

---

## 2. Architectural Boundaries & Isolation
To maintain architectural purity and zero side-effects across the multi-module platform:
- **Module 1 (Customer Data Ingestion & Cleaning)**: Untouched. Certified transaction and schema authorities remain intact.
- **Module 2 (Sole Analytical Sourcing Authority)**: Module 2 is the exclusive layer for:
  $$\text{Customer Spend} \longrightarrow \text{Spend Intelligence} \longrightarrow \text{Supplier Analysis} \longrightarrow \text{Sourcing Opportunity} \longrightarrow \text{E-Auction / Consolidation Recommendation}$$
- **Module 3 (PCBI Master & External Benchmarks)**: **STRICTLY DISCONNECTED**. Module 2 does **NOT** use PCBI or external commodity price indices to calculate opportunities. All opportunities derive solely from internal customer purchase history.
- **Module 4 (Execution & Savings Realization)**: Untouched. Module 2 produces a structured handoff package for Module 4, but never executes contracts or claims realized savings.

---

## 3. Strict Terminology & Taxonomy
Module 2 enforces unambiguous procurement terminology:
1. **Total Spend**: The gross customer historical transaction value.
2. **Addressable Spend**: Strictly comparable volume eligible for commercial negotiation.
3. **Opportunity**: An identified sourcing pattern supported by data.
4. **Quantifiable Opportunity**: An opportunity with empirical, defensible price gaps.
5. **Potential E-Auction Opportunity**: Historical price dispersion addressable through competitive bidding.
6. **Potential Vendor Consolidation Opportunity**: Fragmented volume addressable by consolidating with core suppliers.
7. **Net Quantifiable Opportunity**: Combined opportunity after mathematical deduplication of common price variance.
8. **Realized / Approved Savings**: **NEVER CALCULATED IN MODULE 2**. Belongs exclusively to Module 4.

---

## 4. The 20 Strategic Procurement Questions
For every spend category, commodity, and spend cluster, Module 2 answers:
1. **What are we buying?** (UNSPSC commodity code, material description, grade, technical spec).
2. **How much are we buying?** (Annual addressable quantity in standardized UOM).
3. **How frequently are we buying?** (Active months, order cadence, monthly PO averages).
4. **From how many suppliers?** (Active supplier count and portfolio structure).
5. **How fragmented is the supplier base?** (HHI score, tail vendor count, spend distribution).
6. **How concentrated is the spend?** (Top 1, Top 3, Top 5 supplier share percentages).
7. **Are comparable suppliers charging materially different prices?** (Price dispersion P10-P90, volume above P25).
8. **Is there sufficient competitive tension for an e-auction?** (E-auction suitability rating: HIGH/MED/LOW/NOT_SUITABLE).
9. **Is supplier consolidation commercially relevant?** (Consolidation candidate identification and tail share).
10. **What portion of spend is addressable?** (Comparable spend after explicit outlier/UOM exclusions).
11. **What price improvement is demonstrable from historical data?** (Weighted average price vs credible reference).
12. **What is the potential e-auction opportunity?** ($\text{Price Gap} \times \text{Addressable Quantity}$).
13. **What is the potential vendor consolidation opportunity?** (Tail volume premium over best core supplier).
14. **Are these two opportunities overlapping?** (Shared addressable variance identification).
15. **What is the NET QUANTIFIABLE OPPORTUNITY after overlap removal?** (E-Auction + Consolidation - Overlap).
16. **What sourcing strategy should procurement consider?** (1 of 7 strategic recommendations).
17. **What data supports the recommendation?** (Transaction-level evidence IDs, weighted baseline, reference methodology).
18. **What information is missing?** (Specification variance, UOM harmonization needs, missing parameters).
19. **What risks or constraints should procurement investigate?** (Single points of failure, collusion, lead times).
20. **What should be the next strategic sourcing action?** (Actionable immediate procurement step).

---

## 5. Absolute No-Fabrication Rule
- Module 2 **NEVER** fabricates savings percentages (such as generic 5% or 7% assumptions), target vendor counts, or auction discounts.
- If data is deficient or unverified: $\text{STATUS} = \text{NOT\_QUANTIFIABLE}$.
- Display: `"Opportunity Identified — Benefit Not Yet Quantifiable"`.
- ₹0 is displayed **ONLY** when a mathematically validated opportunity calculates to zero.

---

## 6. Sourcing Strategy Recommendations
Module 2 evaluates the 10-dimension scorecard and generates one of 7 mutually exclusive strategies:
1. `E_AUCTION_RECOMMENDED`
2. `COMPETITIVE_RFQ_RECOMMENDED`
3. `VENDOR_CONSOLIDATION_REVIEW`
4. `E_AUCTION_PLUS_CONSOLIDATION`
5. `SPECIFICATION_STANDARDIZATION_REVIEW`
6. `DATA_DEEP_DIVE_REQUIRED`
7. `NO_IMMEDIATE_SOURCING_ACTION`
