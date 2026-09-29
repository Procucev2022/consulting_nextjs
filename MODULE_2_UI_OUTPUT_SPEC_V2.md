# MODULE 2 — UI OUTPUT SPECIFICATION V2.0
## Version: MODULE_2_SOURCING_LOGIC_V2.0
### Document Type: User Interface, Design & Reporting Specification

---

## 1. The 12 Mandatory Executive KPI Cards
The top dashboard banner must present the exact twelve KPI cards to avoid conflating spend eligibility with commercial benefit:

1. **TOTAL ADDRESSABLE SPEND**: Total comparable spend eligible for sourcing renegotiation.
2. **E-AUCTION ADDRESSABLE SPEND**: Spend in categories with comparable specifications and multiple qualified suppliers.
3. **E-AUCTION QUANTIFIABLE BENEFIT**: Historical price compression opportunity calculated strictly from empirical price dispersion.
4. **VENDOR CONSOLIDATION ADDRESSABLE SPEND**: Spend currently diluted across fragmented tail suppliers.
5. **VENDOR CONSOLIDATION QUANTIFIABLE BENEFIT**: Empirical benefit from shifting tail volume to demonstrated competitive core suppliers.
6. **VOLUME BUNDLING ADDRESSABLE SPEND**: Demand aggregation pool where historical volume tiers exist.
7. **CATEGORY SPECIALIST OPPORTUNITY**: Demonstrable unit price savings from reallocating multi-category vendor spend to category specialists.
8. **GROSS QUANTIFIABLE BENEFIT**: Sum of all primary and secondary sourcing opportunities before deduplication.
9. **OVERLAPPING BENEFIT (REMOVED)**: Common addressable price variance eliminated to prevent double-counting.
10. **NET DEFENSIBLE BENEFIT**: Final deduplicated sourcing opportunity: $\text{Gross} - \text{Overlap}$.
11. **BENEFIT NOT YET QUANTIFIABLE**: Commercial opportunities identified but lacking empirical historical price differences.
12. **OVERALL DATA CONFIDENCE**: Aggregate statistical reliability grade (`HIGH` | `MEDIUM` | `LOW` | `INSUFFICIENT`).

---

## 2. Terminology Standardization (Mandatory)
- **PROHIBITED**: `"Potential e-Auction Volume Benefit"` (Mixes volume and benefit).
- **MANDATORY**:
  - `"E-AUCTION ADDRESSABLE SPEND"` (Spend eligible for event).
  - `"E-AUCTION QUANTIFIABLE BENEFIT"` (Calculated price gap).
  - `"VENDOR CONSOLIDATION ADDRESSABLE SPEND"`.
  - `"VENDOR CONSOLIDATION QUANTIFIABLE BENEFIT"`.
- **PROHIBITED**: `"Savings Realized"` or `"Savings Achieved"`.
- **MANDATORY**: `"HISTORICAL SOURCING OPPORTUNITY"` or `"NET DEFENSIBLE PROCUREMENT OPPORTUNITY"`.
- **PROHIBITED**: Showing `₹0.00` when data is missing or unverified.
- **MANDATORY**: Showing `"Opportunity Identified — Benefit Not Yet Quantifiable"`.

---

## 3. Reorganized 13-Section Deep-Dive Modal (Section A through Section M)
1. **SECTION A — SPEND PROFILE**: 3-year historical spend, annualized spend, monthly distribution, average transaction value.
2. **SECTION B — ITEM / CATEGORY STRUCTURE**: UNSPSC classification, specification breakdown, item-level catalog.
3. **SECTION C — SUPPLIER STRUCTURE**: Active supplier roster, spend shares, HHI score, concentration tiers.
4. **SECTION D — PRICE DISPERSION**: Min, P25, Median, Weighted Average, P75, Max, IQR, Price Spread %.
5. **SECTION E — VOLUME ANALYSIS**: Order size distribution, batch sizes, volume-tier price relationships.
6. **SECTION F — E-AUCTION ANALYSIS**: Supplier market depth, suitability rationale, credible reference price gap.
7. **SECTION G — VENDOR CONSOLIDATION**: Current vs target suppliers, tail vendor spend, core supplier price advantage.
8. **SECTION H — CATEGORY SPECIALIST ANALYSIS**: Multi-category supplier spend vs dedicated specialist pricing.
9. **SECTION I — PO / RECURRENCE ANALYSIS**: Monthly PO frequency, operational touchpoint reduction vs commercial savings.
10. **SECTION J — OPPORTUNITY WATERFALL**: 10-stage step-by-step spend and opportunity progression.
11. **SECTION K — OVERLAP / DOUBLE COUNTING**: Multi-lever overlap adjustment showing gross vs net opportunity.
12. **SECTION L — DATA CONFIDENCE**: 7-criteria quality audit, transaction depth, specification cleanness.
13. **SECTION M — SOURCING ACTION**: Explicit procurement roadmap, RFQ/Auction strategy, and Module 4 handoff payload.

---

## 4. Multi-Category Vendor Deep-Dive Hierarchy
When drilling into any top supplier supplying multiple categories:
$$\text{VENDOR} \longrightarrow \text{CATEGORY} \longrightarrow \text{ITEM}$$
For each item:
- Current Vendor Unit Price.
- Category Specialist Reference Price.
- Unit Price Gap & Specialist Realignment Benefit.
- Recommended Sourcing Lever.
- Confidence Grade.
