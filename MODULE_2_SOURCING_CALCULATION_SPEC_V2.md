# MODULE 2 — STRATEGIC SOURCING CALCULATION SPECIFICATION V2.0
## Version: MODULE_2_SOURCING_LOGIC_V2.0
### Document Type: Mathematical & Computational Specification

---

## 1. Baseline Price Formula (Quantity-Weighted Average)
The baseline price $P_{\text{baseline}}$ is strictly the quantity-weighted average unit price of eligible comparable transactions within the historical window:

$$P_{\text{baseline}} = \frac{\sum_{i=1}^{n} (Q_i \times P_i)}{\sum_{i=1}^{n} Q_i} = \frac{\text{Total Addressable Spend (INR)}}{\text{Total Addressable Quantity}}$$

*Where*:
- $Q_i$ is the quantity of the $i$-th comparable transaction.
- $P_i$ is the unit price of the $i$-th comparable transaction in standardized UOM and INR.

---

## 2. Lowest Credible Historical Price Reference
The target benchmark price $P_{\text{ref}}$ is determined from historical evidence:

$$P_{\text{ref}} = \begin{cases} 
P_{\min}, & \text{if } P_{\min} \ge P_{\text{median}} \times 0.65 \text{ and } Q_{\min} \ge Q_{\text{threshold}} \\
P_{25}, & \text{if } P_{\min} < P_{\text{median}} \times 0.65 \text{ and statistical depth exists} \\
P_{\text{baseline}}, & \text{if single transaction or no dispersion} \\
\text{NULL}, & \text{if data confidence is INSUFFICIENT}
\end{cases}$$

---

## 3. Price Dispersion & Spread Formulas
For eligible comparable line items:
- **Interquartile Range (IQR)**:
  $$\text{IQR} = P_{75} - P_{25}$$
- **Price Spread %**:
  $$\text{Price Spread \%} = \frac{P_{\max} - P_{\min}}{P_{\text{baseline}}} \times 100$$
- **Weighted Historical Price Gap**:
  $$\text{Price Gap \%} = \frac{P_{\text{baseline}} - P_{\text{ref}}}{P_{\text{baseline}}} \times 100$$

---

## 4. E-Auction Benefit Formula
The e-auction benefit represents price compression across verified suppliers:

$$\text{Benefit}_{\text{e-Auction}} = \begin{cases}
Q_{\text{addressable}} \times (P_{\text{baseline}} - P_{\text{ref}}), & \text{if } P_{\text{baseline}} > P_{\text{ref}} \text{ and } N_{\text{suppliers}} \ge 2 \\
0, & \text{if } P_{\text{baseline}} \le P_{\text{ref}} \text{ or } N_{\text{suppliers}} < 2
\end{cases}$$

$$\text{Addressable Spend}_{\text{e-Auction}} = \sum_{j \in \text{Eligible Categories}} \text{Spend}_j$$

*Critical Distinction*: Addressable Spend and Quantifiable Benefit are reported separately. ₹10 Cr Addressable Spend $\neq$ ₹10 Cr Benefit.

---

## 5. Vendor Consolidation Calculation (4 Evidence Paths)
Consolidation benefit must derive strictly from empirical evidence:

### Path A — Same-Supplier Volume Evidence
A single supplier previously supplied materially higher volume at a lower price:
$$\text{Benefit}_{\text{Path A}} = Q_{\text{tail}} \times (P_{\text{supplier, spot}} - P_{\text{supplier, bulk}})$$

### Path B — Core Supplier Price Advantage
Tail supplier spend reallocated to primary core supplier at demonstrated lower historical unit price:
$$\text{Benefit}_{\text{Path B}} = \sum_{k \in \text{Tail Vendors}} Q_k \times \max(0, P_k - P_{\text{core}})$$

### Path C — Combined Category Volume Aggregation
Multiple suppliers aggregated with demonstrated price-volume elasticity:
$$\text{Benefit}_{\text{Path C}} = Q_{\text{combined}} \times (P_{\text{baseline}} - P_{\text{aggregated tier}})$$

### Path D — No Historical Rate Differential
Where multiple vendors exist but prices are identical or volume curves are absent:
$$\text{Benefit}_{\text{Path D}} = 0 \quad (\text{STATUS} = \text{"OPPORTUNITY IDENTIFIED — BENEFIT NOT YET QUANTIFIABLE"})$$

---

## 6. Category Specialist Sourcing Realignment Formula
For items supplied by a multi-category vendor:
$$\text{Benefit}_{\text{Specialist}} = \begin{cases}
Q_{\text{multi}} \times (P_{\text{multi}} - P_{\text{specialist, ref}}), & \text{if } P_{\text{specialist, ref}} < P_{\text{multi}} \\
0, & \text{if } P_{\text{specialist, ref}} \ge P_{\text{multi}}
\end{cases}$$

*Constraint*: Evaluated strictly at the individual item/category level. Never blanket vendor replacement.

---

## 7. Volume Bundling Benefit Formula
Where historical data proves lower unit price at larger purchase quantities:
$$\text{Benefit}_{\text{Volume Bundling}} = \begin{cases}
\text{Spend}_{\text{eligible}} \times \text{Slope}_{\text{volume tier}}, & \text{if volume-price relationship is validated} \\
0, & \text{if no volume-price relationship exists}
\end{cases}$$

---

## 8. Overlap Deduplication & Net Defensible Benefit
$$\text{Gross Benefit} = B_{\text{e-Auction}} + B_{\text{Consolidation}} + B_{\text{Specialist}} + B_{\text{Volume Bundling}}$$
$$\text{Net Defensible Benefit} = \max(B_{\text{e-Auction}}, B_{\text{Consolidation}}, B_{\text{Specialist}}, B_{\text{Volume Bundling}})$$
$$\text{Overlapping Opportunity} = \text{Gross Benefit} - \text{Net Defensible Benefit}$$

---

## 9. Herfindahl-Hirschman Index (HHI) Formula
$$\text{HHI} = \sum_{s=1}^{m} \left( \frac{\text{Spend}_s}{\text{Total Category Spend}} \times 100 \right)^2$$
- $\text{HHI} > 2500$: Highly concentrated market.
- $1500 \le \text{HHI} \le 2500$: Moderately concentrated market.
- $\text{HHI} < 1500$: Fragmented market.

---

## 10. The 10-Stage Transparent Opportunity Waterfall
1. `TOTAL_HISTORICAL_SPEND`: Gross sum of customer procurement transactions.
2. `ADDRESSABLE_SPEND`: Comparable transactions passing specification, currency, and UOM standards.
3. `CONTRACTUALLY_ADDRESSABLE_SPEND`: Addressable spend unlocked for immediate commercial action.
4. `PRICE_DISPERSION_OPPORTUNITY`: Variance between current weighted price and demonstrated reference price.
5. `VOLUME_AGGREGATION_OPPORTUNITY`: Quantifiable benefit from bundling volume tiers.
6. `E_AUCTION_OPPORTUNITY`: Competitive dynamic bidding opportunity.
7. `VENDOR_CONSOLIDATION_OPPORTUNITY`: Reallocating tail spend to core competitive suppliers.
8. `CATEGORY_SPECIALIST_REALIGNMENT`: Migrating spend from broad suppliers to category specialists.
9. `OVERLAP_REMOVAL`: Multi-lever double-counting strictly deducted.
10. `NET_QUANTIFIABLE_OPPORTUNITY`: Final mathematically defensible procurement opportunity.
