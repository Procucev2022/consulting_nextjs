# MODULE 2 — COMMERCIAL EXCELLENCE LOGIC SPECIFICATION V2.0
====================================================================================================
VERSION: MODULE_2_COMMERCIAL_EXCELLENCE_LOGIC_V2.0
STATUS: FINAL BUSINESS LOGIC HARDENING
====================================================================================================

## 1. Commercial Terms Diagnostic Framework

Procurement value leakage frequently occurs through unfavorable commercial clauses rather than raw unit pricing.
Module 2 audits **12 distinct commercial dimensions** to identify structural improvement potential.

---

## 2. Twelve Commercial Excellence Dimensions

| # | Dimension Code | Dimension Name | Evaluation Rule | Target Benchmark | Non-Monetary Safeguard Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `PAYMENT_TERMS` | Payment Terms | Evaluates credit period against enterprise baseline. | Net 60 or Net 90 days. | Working capital optimization (Non-monetary). |
| 2 | `CONTRACT_COVERAGE` | Contract Coverage | % of category spend bound by active master service agreements. | $\ge 80\%$ contracted. | Contractual protection & risk mitigation. |
| 3 | `CONTRACT_EXPIRY` | Contract Expiry | Proximity of contract renewal dates. | $\ge 6$ months horizon. | Renewal governance & renegotiation window. |
| 4 | `ESCALATION_CLAUSE` | Price Escalation | Presence of capped vs. uncapped price escalation clauses. | Formula-based with cap. | Price volatility containment. |
| 5 | `REBATE_STRUCTURE` | Volume Rebates | Tiered retrospective rebate agreements based on annual thresholds. | Tiered 2%–5% rebate. | Incentive alignment without arbitrary price cuts. |
| 6 | `MOQ_GOVERNANCE` | Minimum Order Quantity | Minimum order size versus consumption velocity. | Aligned to 15-day demand. | Working capital & inventory holding control. |
| 7 | `FREIGHT_TERMS` | Freight Terms (Incoterms) | Supplier-paid (DDP/FOR) versus buyer-paid (Ex-Works). | FOR Destination. | Logistics cost absorption & risk transfer. |
| 8 | `WARRANTY_TERMS` | Warranty Coverage | Defect coverage duration and replacement terms. | $\ge 12$ months SLA. | Quality liability protection. |
| 9 | `LEAD_TIME` | Delivery Lead Time | Standard replenishment duration vs. order frequency. | $< 14$ days standard. | Safety stock optimization. |
| 10 | `PRICE_REVIEW` | Price Review Cadence | Frequency and triggers for supplier rate card adjustments. | Annual or Bi-annual. | Unilateral price increase prevention. |
| 11 | `VOLUME_COMMITMENT`| Volume Commitment | Committed volume vs. actual purchase execution. | $\pm 10\%$ corridor. | Under-utilization penalty avoidance. |
| 12 | `SERVICE_LEVEL_AGR`| Service Level Agreement | Explicit SLA metrics (OTIF, reject rate penalties). | $\ge 95\%$ OTIF. | Operational downtime minimization. |

---

## 3. Four-Tier Status Classification

Each commercial dimension is classified into one of four governed states:
1. `OPTIMIZED`: Meets or exceeds enterprise benchmark standard.
2. `PARTIALLY_OPTIMIZED`: Standard exists but exhibits minor tail compliance gaps.
3. `OPPORTUNITY_IDENTIFIED`: Sub-optimal clause active (e.g. Net 30, buyer-paid freight, uncapped escalation).
4. `INSUFFICIENT_DATA`: Contract or PO metadata lacks commercial clause specifics.

---

## 4. Absolute Protection Against Arbitrary Savings Conversion

> **COMMERCIAL CLAUSE DEFICIENCIES ARE QUALITATIVE IMPROVEMENTS, NOT SPECULATIVE HARD SAVINGS.**
> Converting "Payment terms moving from Net 30 to Net 60" into a hard rupee savings figure is strictly prohibited unless supported by verified cost of capital transaction evidence.
> Otherwise, the engine labels the opportunity as `IDENTIFIED_NOT_QUANTIFIABLE` with recommended contract renegotiation steps.
