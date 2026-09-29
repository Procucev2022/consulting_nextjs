# MODULE 2 — UI/UX & OUTPUT SPECIFICATION
## Version: MODULE_2_SOURCING_LOGIC_V1.0
### Document Type: Frontend User Interface & Information Architecture Specification

---

## 1. Design Principles & Aesthetics
- **Procucev Enterprise Standard**: Premium, high-contrast dark/light mode compatible enterprise interface.
- **Evidence-First Information Hierarchy**: Executive KPI view first, deep analytical drill-down on user intent.
- **Unambiguous Distinction**: Prominent visual indicators ensuring opportunities are never confused with realized savings.

---

## 2. Executive Dashboard (10 KPI Summary Cards)
Replaces the previous generic volume savings card with 10 drillable cards:
1. `TOTAL ADDRESSABLE SPEND` (Blue gradient)
2. `POTENTIAL E-AUCTION OPPORTUNITY` (Cyan gradient)
3. `POTENTIAL VENDOR CONSOLIDATION OPPORTUNITY` (Purple gradient)
4. `OVERLAPPING OPPORTUNITY (REMOVED)` (Amber gradient)
5. `NET QUANTIFIABLE OPPORTUNITY` (Emerald gradient, prominent ring highlight)
6. `CATEGORIES READY FOR SOURCING` (Teal gradient)
7. `E-AUCTION CANDIDATES` (Sky gradient)
8. `CONSOLIDATION CANDIDATES` (Indigo gradient)
9. `OPPORTUNITIES NOT YET QUANTIFIABLE` (Slate gradient)
10. `OVERALL DATA CONFIDENCE` (Emerald/Amber indicator)

---

## 3. 17-Column Strategic Sourcing Category Table
- **Columns**: Category, Spend, Transactions, Suppliers, Concentration HHI, Fragmentation, Addressable Spend, E-Auction Suitability, E-Auction Opp, Consolidation Suitability, Consolidation Opp, Overlap Deducted, Net Quantifiable Opp, Opp %, Confidence, Recommended Lever, Next Action.
- **Sorting**: Multi-column sorting by Spend, Addressable Spend, Net Opportunity, Supplier Count, Price Dispersion.
- **Filters**: Category search, Materiality dropdown (High/Medium/Low), Sourcing lever filter (E-Auction/Consolidation/Quantifiable).

---

## 4. Transparent Opportunity Waterfall (Section 31)
1. `TOTAL_CATEGORY_SPEND`: Gross historical spend.
2. `NON_ADDRESSABLE_SPEND`: Excluded due to UOM/outliers.
3. `ADDRESSABLE_SPEND`: Strictly comparable spend.
4. `E_AUCTION_OPPORTUNITY`: Bidding price dispersion benefit.
5. `CONSOLIDATION_OPPORTUNITY`: Fragmented tail volume benefit.
6. `OVERLAP_REMOVED`: Deduplicated shared variance.
7. `NET_QUANTIFIABLE_OPPORTUNITY`: Final net potential opportunity.

---

## 5. Strategic Sourcing Deep-Dive Workspace (Sections A through T)
Organized into 5 intuitive enterprise workspace tabs:
- **Tab 1: Category & Supplier Profile** (Sections A, B, C, D, E).
- **Tab 2: Price Normalization & Percentiles** (Sections F, G, H).
- **Tab 3: Opportunity Levers & Deduplication** (Sections I, J, K, L, M).
- **Tab 4: Scorecard, 15 Levers & Sourcing Strategy** (Sections N, O, P, Q).
- **Tab 5: Evidence & Immutable Audit Dossier** (Sections R, S, T).
