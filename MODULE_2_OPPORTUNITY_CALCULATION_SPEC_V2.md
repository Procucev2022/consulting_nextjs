# MODULE 2 — OPPORTUNITY CALCULATION SPECIFICATION V2.0
====================================================================================================
VERSION: MODULE_2_OPPORTUNITY_CALCULATION_SPEC_V2.0
STATUS: FINAL BUSINESS LOGIC HARDENING
====================================================================================================

## 1. Mathematical Formulas & Calculation Standards

All monetary opportunity potential calculations in Module 2 adhere to strict mathematical definitions grounded in actual customer transaction data.

---

## 2. Core Sourcing Opportunity Formulas

### 2.1 Historical Price Opportunity (Proven Potential)
$$\text{Price Opportunity} = (\text{WAP}_{\text{Eligible}} - P_{25\text{, Ref}}) \times \text{Volume}_{\text{Eligible}}$$
- **Where**:
  - $\text{WAP}_{\text{Eligible}} = \frac{\sum_{i=1}^N (P_i \times Q_i)}{\sum_{i=1}^N Q_i}$ across all eligible comparable transactions.
  - $P_{25\text{, Ref}}$ = 25th percentile unit price established from customer historical transactions.
  - $\text{Volume}_{\text{Eligible}}$ = Sum of quantities in eligible comparable transactions.

### 2.2 Governed Quartile Range Model (Non-Parametric)
- **Low Case / Conservative Spread**:
  $$\text{Opportunity}_{\text{Low}} = (\text{Median} - P_{25}) \times \text{Volume}_{\text{Eligible}}$$
- **High Case / Stretch Spread**:
  $$\text{Opportunity}_{\text{High}} = (P_{75} - P_{25}) \times \text{Volume}_{\text{Eligible}}$$
- **Base Case**:
  $$\text{Opportunity}_{\text{Base}} = (\text{WAP} - P_{25}) \times \text{Volume}_{\text{Eligible}}$$

### 2.3 Potential E-Auction Opportunity
$$\text{Opportunity}_{\text{EAuction}} = (\text{WAP}_{\text{AuctionEligible}} - P_{25\text{, Ref}}) \times \text{Volume}_{\text{AuctionEligible}}$$
- Requires E-Auction Readiness Score $\ge 60/100$ across:
  1. Specification Standardization ($\ge 70\%$)
  2. Supplier Count ($\ge 3$ active suppliers)
  3. Price Dispersion ($CV \ge 0.04$)
  4. Spend Materiality ($\ge ₹20,00,000$)
  5. Recurring Demand ($\ge 3$ active months)
  6. Low Switching Costs
  7. Commercial Readiness
  8. Supply Market Liquidity

### 2.4 Potential Supplier Consolidation Opportunity
$$\text{Opportunity}_{\text{Consolidation}} = \text{Price Variance Benefit} + \text{Operational Overhead Reduction}$$
- **Price Variance Benefit**: Consolidating tail-spend volume to top-quartile rates:
  $$\sum_{j \in \text{Tail}} (\text{WAP}_j - P_{25}) \times Q_j$$
- **Operational Overhead Reduction**:
  $$\text{Tail POs Eliminated} \times \text{PO Processing Cost (₹2,500 standard)}$$

---

## 3. Strict Exclusion Rules & Data Cleaning

Transactions are excluded from opportunity calculations under the following governed rules:
1. `OUTLIER_PRICE`: Unit price $> 3\sigma$ from category mean or outside interquartile range $[Q_1 - 1.5\text{IQR}, Q_3 + 1.5\text{IQR}]$.
2. `UOM_MISMATCH`: Unharmonized units of measure without verified conversion factors.
3. `INCOMPLETE_RECORD`: Missing unit price, quantity, or supplier ID.
4. `NON_ADDRESSABLE`: Taxes, freight pass-throughs, statutory duties, or non-procurement adjustments.
