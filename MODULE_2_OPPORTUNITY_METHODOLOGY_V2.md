# MODULE 2 — SOURCING OPPORTUNITY METHODOLOGY V2.0
## Version: MODULE_2_SOURCING_LOGIC_V2.0
### Document Type: Methodological & Governance Architecture

---

## 1. Transaction Comparability & Normalization Protocol
Before any line item is considered for opportunity calculation, it must pass a strict comparability filter:
1. **Material Code & Specification Consistency**: Items must match in material code, grade, dimension, and physical specification.
2. **Unit of Measure (UOM) Standardization**: Non-convertible or conflicting UOMs are segregated.
3. **Currency Conversion**: All non-INR currencies are normalized to INR using certified historical exchange rates.
4. **Outlier Filtering**: Transactions exceeding 3.0× the median unit price or falling below 0.3× the median are isolated as potential recording anomalies.

### Explicit Exclusion Log Taxonomy
Any excluded transaction is logged with structured metadata:
- `SPECIFICATION_MISMATCH`: Different chemical or technical grade.
- `GRADE_MISMATCH`: Distinct structural tensile or purity variance.
- `UNIT_MISMATCH`: Incompatible units of measurement.
- `CURRENCY_MISMATCH`: Unresolved foreign exchange rate.
- `OBVIOUS_OUTLIER`: Extreme statistical aberration.
- `ONE_OFF_ABNORMAL_QUANTITY`: Sample or emergency spot order.
- `CONTRACTUALLY_LOCKED`: Multi-year fixed agreement preventing near-term renegotiation.

---

## 2. Sole-Source & Dominant Vendor Risk Segregation
- **Risk Indicator**: A sole-source vendor (100% share) or dominant supplier (>70% share) represents **Supply Chain Exposure and Concentration Risk**.
- **No Fabricated Opportunity**: A sole-source vendor does **not** automatically generate a savings opportunity.
- **Defensibility Rule**: If no credible alternative supplier has historically sold the comparable item to the enterprise, the opportunity benefit is strictly ₹0 with status:
  $$\text{STATUS} = \text{"OPPORTUNITY IDENTIFIED — BENEFIT NOT YET QUANTIFIABLE"}$$

---

## 3. Four-Tier Data Confidence Framework
Every category and item opportunity is evaluated across 7 data quality dimensions:
1. **Transaction Count**: $\ge 12$ transactions across historical period.
2. **Supplier Count**: $\ge 2$ qualified comparable suppliers.
3. **Active Months**: $\ge 6$ active purchasing months.
4. **Volume Representation**: $\ge 80\%$ comparable spend coverage.
5. **Price Consistency**: Coefficient of variation within expected commodity bounds.
6. **Specification Cleanness**: Certified descriptions without ambiguous "MRO miscellaneous" tags.
7. **Exclusion Ratio**: Excluded transactions constitute $< 25\%$ of total category spend.

### Confidence Grades:
- `HIGH`: Meets all 7 criteria; fully defensible for CPO/CFO executive sign-off.
- `MEDIUM`: Meets 4-6 criteria; defensible for initial RFQ or exploratory auction.
- `LOW`: Meets 2-3 criteria; requires specification verification before sourcing.
- `INSUFFICIENT`: Fails minimum statistical criteria; marked **NOT QUANTIFIABLE**.

---

## 4. PO Cadence & Process Rationalization Methodology
Multiple purchase orders for identical items are analyzed for consolidation:
- **Operational Metric**: Annual PO reduction count and average order value increase.
- **Administrative Benefit**: Marked as process efficiency.
- **Commercial Benefit**: Calculated **ONLY** when historical price tiers prove that bulk ordering achieves demonstrable lower unit pricing.
