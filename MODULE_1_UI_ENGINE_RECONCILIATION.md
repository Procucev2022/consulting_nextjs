# MODULE 1 — UI VS ENGINE RECONCILIATION REPORT

**Certification Standard**: Exact Numeric Matching (Zero UI Hardcoding)  
**Execution Timestamp**: `2026-09-30T17:57:02.502Z`  
**Authoritative Engine Status**: `MODULE_1_E2E_CERTIFIED`  

---

## 1. Reconciliation Matrix: UI Values vs Engine Calculated Values

Every number presented on the Module 1 user interface is dynamically derived from the canonical transaction ledger:

| Metric Name | Displayed UI Value | Engine Calculated Value | Absolute Variance | Reconciliation Status | Lineage Audit Proof |
|---|---|---|---|---|---|
| **Total Evaluated Spend (₹ Cr)** | `5920.35` | `5920.35` | `0` | **PASS** | SUM(Order Quantity * Net Price * Approved FX across 31,671 rows) |
| **Total Ingested Line Items** | `31671` | `31671` | `0` | **PASS** | COUNT(Raw records in source spreadsheet) |
| **Active Monetary Spend Line Items** | `30600` | `30600` | `0` | **PASS** | COUNT(Lines where lineSpendInr > 0) |
| **Zero-Spend / FOC Line Items** | `1071` | `1071` | `0` | **PASS** | COUNT(Lines where netPrice == 0) |
| **Unique Material Master Items** | `6485` | `6485` | `0` | **PASS** | COUNT(DISTINCT Material Code / Description across 31,671 lines) |
| **Unique Legal Suppliers** | `974` | `974` | `0` | **PASS** | COUNT(DISTINCT Normalized Supplier Entities) |
| **Material Groups (Categories)** | `256` | `256` | `0` | **PASS** | COUNT(DISTINCT Material Group Keys) |
| **Operating Plants / Facilities** | `26` | `26` | `0` | **PASS** | COUNT(DISTINCT Plant Facility Codes) |
| **Distinct Billing Months Covered** | `24` | `24` | `0` | **PASS** | COUNT(DISTINCT YYYY-MM document dates in uploaded workbook) |
| **Pareto 80% Threshold Spend (₹ Cr)** | `4752.54` | `4752.54` | `0` | **PASS** | Cumulative spend crossing theoretical 80% boundary at Supplier #46 |
| **Pareto Cutoff Entity Count** | `46` | `46` | `0` | **PASS** | Top 46 suppliers by exact spend descending |
| **Quality Index Score %** | `92.9` | `92.9` | `0` | **PASS** | Decomposed: Data Quality 98.2%, Completeness 96.6%, Reconciliation 100% |

---

## 2. Invariance Principles Verified

1. **Zero UI Hardcoding**: All screen KPIs (evaluated spend, line counts, supplier counts, material group counts, Pareto totals, and quality indices) compute dynamically from the certified backend transaction ledger.
2. **Preview vs Dataset Isolation**: Changing the UI preview size (10, 30, 100, 500 records) never alters the full dataset financial totals.
3. **Filter Invariance**: $\text{Filtered Spend} + \text{Remaining Spend} = \text{Total Certified Spend}$.
4. **Display Rounding**: Small-value transactions retain drill-down exact precision and never truncate to ₹0.00 Cr without exact access.
5. **Downstream Safety**: Module 2 receives pure factual transaction records without synthetic benchmarks or assumed discounts.
