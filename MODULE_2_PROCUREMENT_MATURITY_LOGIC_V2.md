# MODULE 2 — PROCUREMENT MATURITY LOGIC SPECIFICATION V2.0
====================================================================================================
VERSION: MODULE_2_PROCUREMENT_MATURITY_LOGIC_V2.0
STATUS: FINAL BUSINESS LOGIC HARDENING
====================================================================================================

## 1. Objective & Non-Monetary Safeguard Principle

The **Procurement Maturity Scorecard** evaluates organizational sourcing sophistication across 10 structural pillars.

### The Non-Monetary Safeguard
> **A PROCUREMENT MATURITY SCORE IS A DIAGNOSTIC HEALTH CHECK, NOT A SAVINGS MULTIPLIER.**
> Under no circumstances may a low maturity score (e.g. 3/10 in contract management) be multiplied by spend to fabricate a theoretical savings number.

---

## 2. Ten Diagnostic Maturity Pillars

Each pillar is scored on a normalized scale from **0 to 10 points**, with explicit diagnostic criteria:

| # | Pillar Code | Pillar Name | Diagnostic Evaluation Criteria | Target State (8–10 pts) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `PRICE_MANAGEMENT` | Price Management | Unit price variance, dispersion monitoring, and non-parametric percentile tracking. | Dynamic percentile benchmarking active with low spread ($CV < 0.05$). |
| 2 | `VOLUME_MANAGEMENT` | Volume Management | Order sizing, order count ratios, batching efficiency, and PO fragmentation. | Consolidated batch purchasing with $< 15\%$ micro-orders. |
| 3 | `SUPPLIER_MANAGEMENT` | Supplier Management | Supplier concentration balance, HHI index, and tail dependency. | Balanced HHI (0.15–0.30) with qualified alternative vendors. |
| 4 | `CATEGORY_STRATEGY` | Category Strategy | Materiality alignment, recurring vs. spot classification, and strategic focus. | Segmented spend strategies mapped to Kraljic quadrants. |
| 5 | `SPECIFICATION_MGMT` | Specification Management | SKU standardization, UOM consistency, and specification harmonization. | Standardized catalog with $> 95\%$ catalog compliance. |
| 6 | `COMPETITIVE_SOURCING`| Competitive Sourcing | Frequency of RFQs, e-auctions, and multi-round bidding events. | Periodic competitive tenders within 18 months. |
| 7 | `CONTRACT_MANAGEMENT` | Contract Management | Formal contract coverage, expiration tracking, and price lock-in terms. | $> 80\%$ spend covered by valid long-term agreements. |
| 8 | `COMMERCIAL_TERMS` | Commercial Terms | Payment terms optimization (Net 60/90), freight absorption, and MOQ thresholds. | Standardized Net 60/90, supplier-paid freight, governed MOQs. |
| 9 | `DEMAND_MANAGEMENT` | Demand Management | Demand smoothing, emergency order suppression, and maverick buying control. | Low spot purchasing ($< 5\%$ total spend) with planned schedules. |
| 10 | `DATA_QUALITY` | Data Quality | Data completeness across UOMs, supplier tax IDs, item codes, and order dates. | $> 95\%$ complete attribute records across all transactions. |

---

## 3. Maturity Rating Tiers

The overall score is calculated as the unweighted mean of all 10 pillars:
$$\text{Overall Score} = \frac{1}{10} \sum_{i=1}^{10} \text{Pillar Score}_i$$

- **8.0 – 10.0**: `OPTIMIZED` (Industry best practice, institutionalized governance).
- **6.0 – 7.9**: `DEVELOPED` (Structured processes in place, minor tail leakage).
- **4.0 – 5.9**: `DEVELOPING` (Operational sourcing active, strategic levers underutilized).
- **0.0 – 3.9**: `NASCENT` (High fragmentation, ad-hoc spot buying, commercial gaps).

---

## 4. Diagnostic Feedback Engine

For each pillar scoring below 6.0, the engine generates an actionable diagnostic record:
- **Observed Condition**: Specific data observation (e.g., "75% of purchase orders are under ₹50,000").
- **Evidence**: Transaction and supplier metrics supporting the observation.
- **Potential Implication**: Operational overhead, pricing premium, or supply chain vulnerability.
- **Recommended Action**: Concrete operational remedy (e.g., "Institute minimum order batching of ₹2,50,000").
- **Quantifiability**: Explicitly states `NOT_QUANTIFIABLE` or references related empirical price models.
