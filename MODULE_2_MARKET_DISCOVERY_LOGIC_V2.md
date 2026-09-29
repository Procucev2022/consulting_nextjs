# MODULE 2 — MARKET DISCOVERY LOGIC SPECIFICATION V2.0
====================================================================================================
VERSION: MODULE_2_MARKET_DISCOVERY_LOGIC_V2.0
STATUS: FINAL BUSINESS LOGIC HARDENING
====================================================================================================

## 1. Business Rationale

When a buying organization has relied on a single incumbent supplier or a comfortable duopoly for years, internal transaction history is **blind to real market prices**. In such cases:
- Internal price variance is zero or negligible ($CV \le 0.02$).
- Legacy systems would conclude: "Variance = 0, Savings = ₹0, Procurement is Optimized".
- **This is mathematically and strategically incorrect.** The incumbent's price may be 15% to 30% above the open market, but internal data cannot reveal it.

Module 2's **Market Discovery Engine** detects structural market insulation and triggers a mandatory competitive sourcing recommendation.

---

## 2. Structural Trigger Rules

The Market Discovery Engine evaluates 8 independent structural triggers:

| # | Trigger Code | Structural Condition | Evaluation Rule |
| :--- | :--- | :--- | :--- |
| 1 | `SINGLE_SUPPLIER_INCUMBENCY` | Monopolistic incumbent lock-in | Active supplier count $= 1$ with total spend $\ge ₹20,00,000$. |
| 2 | `LOW_SUPPLIER_COMPETITION` | Duopoly or weak competition | Active supplier count $\le 2$ with total spend $\ge ₹30,00,000$. |
| 3 | `HIGH_SUPPLIER_DEPENDENCY` | Severe supplier concentration | Top supplier share $\ge 70\%$ of category spend. |
| 4 | `LARGE_RECURRING_SPEND` | High volume without competition | Category spend $\ge ₹50,00,000$ across $\ge 6$ active months. |
| 5 | `HIGH_CATEGORY_MATERIALITY` | Critical direct spend | Spend $\ge ₹1,00,00,000$ regardless of supplier count. |
| 6 | `NO_RECENT_COMPETITIVE_EVENT` | Market complacency | Incumbent supplier tenure $\ge 24$ months without an RFQ/auction. |
| 7 | `SIGNIFICANT_TAIL_FRAGMENTATION` | Supplier sprawl without leverage | Supplier count $\ge 6$ with tail suppliers ($\ge 3$) having $< 5\%$ share each. |
| 8 | `VOLUME_AGGREGATION_POTENTIAL` | High order frequency | Transaction count $\ge 20$ with average transaction value $< 10\%$ of spend. |

---

## 3. Evaluation Decision Workflow

```
                        [Category Analysis]
                                │
                   Active Suppliers <= 2?
                                │
               ┌────────────────┴────────────────┐
              YES                                NO
               │                                 │
     Spend >= ₹20L & No Event?           Spend Materiality High?
               │                                 │
        ┌──────┴──────┐                   ┌──────┴──────┐
       YES            NO                 YES            NO
        │              │                  │              │
[MARKET DISCOVERY] [LOW EVIDENCED]  [MARKET DISCOVERY] [MONITOR]
```

---

## 4. Governance & Output Mandates

1. **Monetary Value Protection**:
   - `monetaryPotentialInr`: Must remain `null`.
   - Never fabricate an estimated percentage (e.g. "assume 10% market savings").
2. **Display Value**:
   - UI display: `"MARKET DISCOVERY REQUIRED"`.
3. **Mandatory Audit Notice**:
   > "Market opportunity cannot be established from internal historical transactions alone. Competitive sourcing is required to discover market price."
4. **Action Assignment**:
   - Triggers `RUN_COMPETITIVE_RFQ` or `RUN_E_AUCTION` in the Action Recommendation Roadmap.
