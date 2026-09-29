# MODULE 2 — VENDOR CONSOLIDATION LOGIC SPECIFICATION V2.0
**Document ID**: `MODULE_2_VENDOR_CONSOLIDATION_LOGIC_V2.md`  
**Governing Principle**: Unit-Level Tail to Core Spread, Empirical Rate Differential, Zero Assumed Savings %

---

## 1. Scope & Core Directives
Vendor consolidation within Module 2 operates strictly at the **Category + Item + Specification** level.
It explicitly distinguishes:
1. **Price Benefit**: Re-aligning tail supplier spend to historically demonstrated core supplier pricing.
2. **Volume Leverage**: Bundling fragmented tail volume where customer batch history demonstrates volume-tier discounts.
3. **Supplier / Transaction Count Reduction**: Administrative PO reduction quantified ONLY when customer provides verified cost per PO.

---

## 2. Mathematical Formulations

### 2.1 Tail Supplier Identification
Suppliers in a category are ranked by descending spend:
- **Core Suppliers**: Top suppliers whose cumulative spend comprises $>60\%$ of category spend.
- **Tail Suppliers**: Remaining suppliers whose spend share is $\le 20\%$ individually and fall into the bottom $40\%$ cumulative spend.

### 2.2 Commercial Price Benefit
Let $P_{\text{core\_best}}$ be the lowest quantity-weighted average unit price among qualified core suppliers:
$$P_{\text{core\_best}} = \min_{s \in \text{Core}, Q_s > 0} \bar{P}_s$$

For each tail supplier $j \in \text{Tail}$:
$$\Delta P_j = \max(0, \bar{P}_j - P_{\text{core\_best}})$$
$$\text{Commercial Price Benefit} = \sum_{j \in \text{Tail}} (\Delta P_j \times Q_j)$$

If $\bar{P}_j \le P_{\text{core\_best}}$ for all tail suppliers, the commercial price benefit is mathematical ₹0.00.

### 2.3 Administrative Benefit
$$\text{PO Reduction} = \max(0, \text{Current Annual POs} - \text{Target Cadence POs})$$
$$\text{Administrative Benefit} = \begin{cases} 
\text{PO Reduction} \times \text{Customer Cost Per PO}, & \text{if explicitly provided} \\ 
\text{NOT\_QUANTIFIABLE}, & \text{otherwise} 
\end{cases}$$

---

## 3. Target Supplier Structure Recommendations
The engine calculates defensible target structures based on active supplier counts and operational stability:
- **1 supplier**: Maintain sole supplier configuration (concentration risk, no consolidation).
- **2–3 suppliers**: Maintain balanced competitive structure (no consolidation recommended).
- **4–5 suppliers**: Target consolidation to **2 qualified suppliers**.
- **$\ge 6$ suppliers**: Target consolidation to **2–3 qualified suppliers**.
