# MODULE 2 — OPPORTUNITY METHODOLOGY & EVIDENCE FRAMEWORK V2.0
**Document ID**: `MODULE_2_OPPORTUNITY_METHODOLOGY_V2.0`  
**Governing Standard**: Commercial Credibility, Non-Arbitrary Quantification, Rigorous Outlier Isolation

---

## 1. Governance & Qualification Criteria

### 1.1 Sourcing Readiness Thresholds
An addressable category qualifies as ready for commercial strategic sourcing when meeting all criteria:
- **Transaction Recurrence**: Active spending in $\ge 6$ distinct months across the 24-month horizon.
- **Supplier Base**: $\ge 2$ active commercial suppliers.
- **Data Comparability**: $\ge 70\%$ of spend satisfies normalized specification and unit of measure criteria.
- **Empirical Variance**: Documented price gap $>0.5\%$ between baseline weighted price and reference benchmark.

### 1.2 Data Confidence Scoring
Confidence is scored from 0 to 100 based on 4 independent factors:
1. **Transaction Depth (30 pts)**: Score proportional to comparable transaction count ($\ge 10$ transactions = 30 pts).
2. **Supplier Diversity (30 pts)**:
   - $\ge 5$ suppliers: 30 pts
   - 3–4 suppliers: 22 pts
   - 2 suppliers: 15 pts
   - 1 supplier: 5 pts
3. **Comparability Ratio (25 pts)**: $\frac{\text{Comparable Transactions}}{\text{Total Transactions}} \times 25$.
4. **Price Dispersion Quality (15 pts)**: Healthy dispersion between 3% and 40% earns 15 pts.

| Total Score | Level | Interpretation |
|---|---|---|
| 75–100 | **HIGH** | High empirical transaction depth; defensible for executive auction or RFP mandate. |
| 50–74 | **MEDIUM** | Moderate empirical evidence; recommended for structured sourcing with targeted spec review. |
| 25–49 | **LOW** | Limited transaction volume or high specification variance. |
| 0–24 | **INSUFFICIENT** | Insufficient data; opportunity identified but marked `NOT_QUANTIFIABLE`. |

---

## 2. Multi-Category Vendor & Generalist vs Specialist Analysis
Suppliers are classified into 4 behavioral archetypes:
1. **Category Specialist**: Suppliers concentrating $\ge 80\%$ of their volume within a single procurement category.
2. **Multi-Category Supplier**: Suppliers supplying 2 to 4 distinct procurement categories with significant spend.
3. **Cross-Category Generalist**: Suppliers distributing volume across $\ge 5$ unrelated categories.
4. **Tail Supplier**: Small suppliers outside the top 60% cumulative spend share.

### Evaluation Workflow:
- If a Generalist supplies Category $C$, identify all items supplied by Generalist $G$.
- Query the database for active Specialists in Category $C$ supplying identical or comparable items.
- Compare unit purchase prices. If Specialist unit price is lower:
  $$\text{Realignment Opportunity} = (P_G - P_S) \times Q_G$$
- If Generalist is already cost-effective ($P_G \le P_S$), opportunity is set to ₹0.00.

---

## 3. Transparency & Auditability Rules
1. **No False ₹0**: If data is missing or incomplete, display `"Opportunity Identified — Benefit Not Yet Quantifiable"` rather than ₹0.00 Cr.
2. **Zero Arbitrary Percentage**: Assumptions such as "assumed 5% savings" are strictly prohibited in the engine.
3. **Traceability**: Every displayed rupee maps to an explicit calculation ID and an evidence transaction record list.
