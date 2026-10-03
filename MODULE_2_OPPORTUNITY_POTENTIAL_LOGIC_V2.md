# MODULE 2 — OPPORTUNITY POTENTIAL LOGIC SPECIFICATION V2.0
====================================================================================================
VERSION: MODULE_2_OPPORTUNITY_POTENTIAL_LOGIC_V2.0
STATUS: FINAL BUSINESS LOGIC HARDENING
====================================================================================================

## 1. The Procurable Opportunity Potential Paradigm

Module 2 replaces the legacy "Savings Identified" concept with **Procurable Opportunity Potential**.

Procurement value exists in multiple structural forms beyond historical price variance:
1. **Historical Variance Realization**: Closing the spread between high-paying POs and demonstrated lowest internal prices.
2. **Volume Aggregation & Leverage**: Eliminating order fragmentation across micro-POs to achieve economy of scale.
3. **Competitive Tension Induction**: Deploying e-auctions to break incumbent pricing power.
4. **Supplier Base Rationalization**: Concentrating volume into top-tier qualified suppliers while cutting tail maintenance costs.
5. **Commercial Term Normalization**: Harmonizing payment terms (e.g. Net 30 $\to$ Net 60), freight terms, and MOQ boundaries.
6. **Market Testing & Discovery**: Testing sole-source or duopoly markets where internal data cannot reveal true market prices.

---

## 2. Mathematical Definition of Evidence States

### 2.1 State 1: PROVEN_OPPORTUNITY
- **Criteria**:
  - Valid comparable transaction set: $N \ge 3$ transactions across $\ge 2$ suppliers.
  - Price dispersion coefficient of variation: $CV > 0.03$.
  - Verified benchmark reference: $P_{25} < \text{WAP}$.
- **Formula**:
  $$\text{Opportunity}_{\text{Proven}} = (\text{WAP} - P_{25}) \times \text{Volume}_{\text{Eligible}}$$
- **Confidence**: `HIGH` if $N \ge 10$ and suppliers $\ge 3$; `MEDIUM` otherwise.

### 2.2 State 2: QUANTIFIABLE_OPPORTUNITY_RANGE
- **Criteria**:
  - Non-parametric empirical spread: Transactions demonstrate dispersion across quartile boundaries ($P_{75} > \text{Median} > P_{25}$).
- **Formula**:
  $$\text{Range}_{\text{Min}} = (\text{Median} - P_{25}) \times \text{Volume}_{\text{Eligible}}$$
  $$\text{Range}_{\text{Max}} = (P_{75} - P_{25}) \times \text{Volume}_{\text{Eligible}}$$
- **Confidence**: `MEDIUM` or `HIGH` based on sample size and time horizon ($\ge 12$ months).

### 2.3 State 3: MARKET_DISCOVERY_OPPORTUNITY
- **Criteria**:
  - Structural condition exists:
    - Single incumbent ($N_{\text{supp}} = 1$) OR duopoly with Top-1 share $> 70\%$.
    - High category materiality (Spend $> ₹50,00,000$).
    - Zero competitive events in past 12 months.
  - Internal price variance is zero or negligible ($CV \le 0.03$).
- **Monetary Output**:
  - `null` / Non-numeric (`"MARKET_DISCOVERY_REQUIRED"`).
  - Explicitly forbidden from outputting ₹0.
- **Narrative**:
  > "Market opportunity cannot be established from internal historical transactions alone. Competitive sourcing is required to discover market price."

### 2.4 State 4: IDENTIFIED_NOT_QUANTIFIABLE
- **Criteria**:
  - Multiple suppliers exist, but SKU descriptions, specifications, or UOMs are unstandardized.
  - Operational fragmentation identified without verified line-item comparability.
- **Monetary Output**: `NOT_QUANTIFIABLE`.
- **Narrative**:
  > "Supplier consolidation opportunity identified. Benefit not yet quantifiable until specification harmonization."

### 2.5 State 5: LOW_EVIDENCED_OPPORTUNITY
- **Criteria**:
  - Multi-supplier competition already active.
  - Tight price dispersion ($CV \le 0.02$).
  - High contract coverage and balanced market shares.
- **Monetary Output**: `NO_MATERIAL_OPPORTUNITY_SHOWN`.
- **Safeguard Notice**:
  > "Current available evidence does not demonstrate a material quantifiable opportunity. Continued monitoring / periodic market testing is recommended."

### 2.6 State 6: INSUFFICIENT_DATA
- **Criteria**: Missing unit prices, quantities, UOMs, or transaction dates in $> 40\%$ of records.
- **Monetary Output**: `INSUFFICIENT_DATA`.

---

## 3. Two-Dimensional Classification Matrix

| Evidence Confidence \ Potential Value | PROVEN | RANGE | MARKET DISCOVERY | NOT QUANTIFIABLE |
| :--- | :--- | :--- | :--- | :--- |
| **HIGH** | Certified historical price variance with multi-supplier proof | Empirical non-parametric quartile spread with $\ge 20$ txns | Major single-source category with multi-year tenure and high spend | N/A |
| **MEDIUM** | Moderate transaction count ($3 \le N < 10$) | Conservative range across 2-3 suppliers | Duopoly with $> 70\%$ concentration and stable high spend | Supplier fragmentation with divergent UOMs |
| **LOW** | Single supplier sporadic variance | Narrow price band with limited data points | Low spend single-source item | Sporadic ad-hoc purchases |
| **INSUFFICIENT** | Incomplete data attributes | Incomplete data attributes | Missing supplier identity | Incomplete item records |
