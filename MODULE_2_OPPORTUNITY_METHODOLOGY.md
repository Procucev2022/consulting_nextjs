# MODULE 2 — OPPORTUNITY METHODOLOGY & GOVERNANCE
## Version: MODULE_2_SOURCING_LOGIC_V1.0
### Document Type: Analytical Methodology & Exclusion Governance

---

## 1. Supplier Fragmentation & Market Concentration Methodology

### 1.1 Herfindahl-Hirschman Index (HHI)
$$\text{HHI} = \sum_{i=1}^{k} \left( \frac{\text{Spend}_i}{\text{Total Category Spend}} \times 100 \right)^2$$

### 1.2 Market Structure Interpretation
- $\text{HHI} > 2500$: Highly Concentrated Market (e.g. Core vendor dominance).
- $1500 \le \text{HHI} \le 2500$: Moderately Concentrated Market.
- $\text{HHI} < 1500$: Unconcentrated / Fragmented Market.

### 1.3 Fragmentation Classification Criteria (Section 5)
Raw supplier count alone is explicitly rejected as an indicator:
1. **Low Fragmentation**: Top supplier holds $\ge 85\%$ spend (even with 8+ tail suppliers) OR total suppliers $= 1$.
2. **Moderate Fragmentation**: Core suppliers account for $\ge 70\%$ spend with modest tail.
3. **High Fragmentation**: Multiple comparable vendors hold distributed spend with no dominant supplier.
4. **Extreme Fragmentation**: $\text{HHI} < 1000$ with $\ge 5$ suppliers and substantial tail spend ($> 30\%$).

---

## 2. Explicit Transaction Exclusion Engine (Section 22)
Transactions may be excluded from price benchmarking only for auditable technical or commercial reasons:
- `SPECIFICATION_MISMATCH`: Grade or tolerance discrepancy.
- `UNIT_MISMATCH`: UOM differs from category primary standard without approved conversion factor.
- `CURRENCY_MISMATCH`: Foreign currency requiring FX normalization.
- `NON_COMPARABLE_GEOGRAPHY`: Disparate delivery origin with material freight variance.
- `OBVIOUS_OUTLIER`: Unit price $> 4.0\times$ median or $< 0.50\times$ median.
- `MISSING_QUANTITY`: Non-positive or unrecorded transaction volume.
- `INVALID_PRICE`: Non-positive or zero unit price.

**Governance Mandate**: Zero silent exclusions. Every excluded transaction is recorded in the immutable audit trail with its line item, PO number, unit price, and reason.

---

## 3. Recurring Spend Determination (Section 28)
Spend is categorized as recurring based on verified procurement activity rather than monetary magnitude:
- $\text{Active Months} \ge 3$ across the 24-month lookback window.
- $\text{Total Purchase Orders} \ge 3$.
- Repeated transactions across distinct quarters.
One-off high-value capex investments (e.g. plant turbine overhauls) are strictly classified as non-recurring.

---

## 4. 10-Dimension Scorecard Weights
1. **Spend Materiality** (15%)
2. **Supplier Fragmentation** (10%)
3. **Price Dispersion** (15%)
4. **Recurrence** (10%)
5. **Addressable Volume** (10%)
6. **Supplier Competition** (10%)
7. **Comparability Ratio** (10%)
8. **Historical Evidence Quality** (10%)
9. **Contract Constraints** (5%)
10. **Specification Complexity** (5%)

Total Score: 0 to 100. Categories scoring $\ge 60$ with high comparability are flagged as `READY_FOR_SOURCING`.
