# MODULE 2 — UI OUTPUT SPECIFICATION V3.0
====================================================================================================
VERSION: MODULE_2_UI_OUTPUT_SPEC_V3.0
STATUS: FINAL BUSINESS LOGIC HARDENING
====================================================================================================

## 1. UI Design Philosophy & Enterprise Standards

The Module 2 interface adheres to the following core tenets:
1. **Zero Generic "Savings Cards"**: Replaced with differentiated panels for **Proven Opportunity**, **Quantifiable Range**, **Market Discovery Candidates**, and **Net Defensible Pool**.
2. **Transparent Evidence Labels**: Every numerical figure displays its mathematical derivation method ($P_{25}$, WAP, Median, Interquartile Spread) and confidence badge.
3. **Safeguard Banners**: Prominent disclaimers explaining that figures represent procurable opportunity potential from customer historical transactions — not unearned realized savings.
4. **Interactive Deep Dive Workspace**: 6 comprehensive tabs allowing users to trace from executive summary down to individual line items.

---

## 2. Core Dashboard Panels & Visual Hierarchy

### 2.1 Executive KPI Cards (10 Strategic Tiles)
1. **Total Addressable Spend**: Clean spend pool with category count.
2. **Proven Opportunity**: Single-point defensible potential based on direct historical unit price spread.
3. **Quantifiable Opportunity Range**: Empirical spread ($P_{75} \to P_{25}$) derived from transaction quartiles.
4. **Market Discovery Candidates**: Count of insulated categories requiring competitive open tender.
5. **Potential E-Auction Opportunity**: Reverse auction ready categories with liquidity and low price dispersion.
6. **Potential Vendor Consolidation Opportunity**: Tail-spend rationalization and operational PO reduction.
7. **Overlapping Opportunity (Deducted)**: Prominently highlighted in rose to demonstrate strict anti-double-counting.
8. **Net Defensible Opportunity Potential**: Reconciled, audit-ready target pool.
9. **Opportunities Not Yet Quantifiable**: Count of categories with structural potential awaiting harmonization.
10. **Overall Data Confidence**: System-wide data reliability score (`HIGH`, `MEDIUM`, `LOW`).

### 2.2 Category Strategic Sourcing Table
- Columns: Category Name, Addressable Spend, Evidence State Badge, E-Auction Suitability, Consolidation Potential, Overlap Deducted, Net Defensible Opportunity, Governed Range, Confidence, Recommended Sourcing Lever, Next Action.

---

## 3. Six-Tab Strategic Sourcing Deep Dive Modal

When a category row is selected, an expansive 6-tab modal opens:
- **Tab 1: Category & Supplier Profile (Sec A-E)**: Materiality, spend cadence, supplier market shares, HHI concentration, and tail fragmentation.
- **Tab 2: Price & Dispersion (Sec F-H)**: Non-parametric percentile breakdown (Min, $P_{25}$, Median, WAP, $P_{75}$, Max), CV interpretation, and credible reference rules.
- **Tab 3: Opportunity & Waterfall (Sec I-M)**: 13-stage transparent waterfall and 15-lever strategic matrix.
- **Tab 4: Market Discovery & Maturity (Sec U-W)**: Structural trigger checklist, 10-dimension procurement maturity scorecard, and 12-dimension commercial terms audit.
- **Tab 5: Strategy & Roadmap (Sec N-Q, X)**: 5-pillar strategic findings (What we found, Why it matters, What we can quantify, What we cannot quantify, What should be tested) and prioritized action checklist.
- **Tab 6: Evidence & Audit (Sec R-T)**: Line-item transaction audit drawer, exclusion log, and Module 4 handoff JSON exporter.
