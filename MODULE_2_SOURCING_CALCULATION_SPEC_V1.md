# MODULE 2 — SOURCING CALCULATION SPECIFICATION
## Version: MODULE_2_SOURCING_LOGIC_V1.0
### Document Type: Mathematical & Computational Specification

---

## 1. Baseline Price Normalization

### 1.1 Weighted Average Purchase Price (Baseline)
The system strictly uses quantity-weighted purchase price as the primary baseline. Simple average pricing is prohibited where purchase quantities differ:

$$P_{\text{weighted}} = \frac{\sum_{i=1}^{n} (Q_i \times P_i)}{\sum_{i=1}^{n} Q_i} = \frac{\text{Total Comparable Spend}}{\text{Total Comparable Quantity}}$$

Where:
- $Q_i$: Quantity of comparable transaction $i$.
- $P_i$: Unit price of comparable transaction $i$.

---

## 2. Price Dispersion & Quartiles

### 2.1 Percentile Calculation
Given sorted unit prices $P_{(1)} \le P_{(2)} \le \dots \le P_{(n)}$:
$$\text{Rank}(k) = \frac{k}{100} \times (n - 1)$$
Linear interpolation is applied between adjacent price ranks to determine:
- $P_{10}$: 10th percentile
- $P_{25}$: 25th percentile (Conservative reference)
- $P_{50}$: Median
- $P_{75}$: 75th percentile
- $P_{90}$: 90th percentile

### 2.2 Historical Price Dispersion
$$\text{Dispersion INR} = P_{\max} - P_{\min}$$
$$\text{Dispersion \%} = \frac{P_{\max} - P_{\min}}{P_{\text{weighted}}} \times 100$$
$$\text{Volume Above } P_{25} \% = \frac{\sum_{i: P_i > P_{25}} Q_i}{\sum Q_i} \times 100$$

---

## 3. Credible Reference Price Rule

### 3.1 Qualification Criteria
A historical transaction qualifies as a credible reference price ONLY if:
1. Specification is verified identical or equivalent.
2. Unit of Measure (UOM) matches category modal baseline.
3. Currency is normalized to INR.
4. Transaction volume $Q_i \ge 0.05 \times Q_{\text{total}}$ (minimum 5% category volume to prevent one-off anomaly skew).
5. Price is not an outlier: $P_i \ge 0.50 \times P_{\text{median}}$.

### 3.2 Methodology Hierarchy
$$\text{Reference Price} = \begin{cases} 
P_{\text{lowest\_credible}} & \text{if candidate meets all 5 criteria} \\
P_{25} & \text{if } n \ge 2 \text{ and } P_{25} < P_{\text{weighted}} \\
P_{\text{median}} & \text{if prices are homogeneous} \\
\text{NULL} & \text{if data is insufficient} 
\end{cases}$$

---

## 4. E-Auction Benefit Calculation

$$\text{Potential Price Gap} = \max(0, P_{\text{weighted}} - P_{\text{reference}})$$
$$\text{Potential E-Auction Opportunity} = \text{Potential Price Gap} \times Q_{\text{addressable}}$$
$$\text{Potential E-Auction Opportunity \%} = \frac{\text{Potential Price Gap}}{P_{\text{weighted}}} \times 100$$

---

## 5. Vendor Consolidation Benefit & Operational Indicators

### 5.1 Monetary Consolidation Benefit
Applied strictly to fragmented volume purchased above best core supplier:
$$\text{Potential Consolidation Opportunity} = \sum_{v \in \text{TailVendors}} \max(0, P_{v} - P_{\text{core\_best}}) \times Q_{v}$$

### 5.2 Operational Consolidation Indicators (Non-Monetary)
Separated from monetary savings to avoid false rupee conversion:
- $\text{Suppliers Affected} = |\text{TailVendors}|$
- $\text{POs Affected} = \sum_{v \in \text{TailVendors}} \text{PO\_Count}_v$
- $\text{Estimated Annual Touchpoint Reduction} = \text{Suppliers Affected} \times 12$

---

## 6. Overlap Deduplication & Net Quantifiable Opportunity

To prevent double-counting shared price variance:
$$\text{Overlapping Opportunity} = \min(\text{E-Auction Opportunity}, \text{Consolidation Opportunity})$$
$$\text{Net Quantifiable Opportunity} = \text{E-Auction Opportunity} + \text{Consolidation Opportunity} - \text{Overlapping Opportunity}$$

---

## 7. Opportunity Scenarios
Where dispersion supports multi-scenario modeling:
- **Conservative**: $(P_{\text{weighted}} - P_{25}) \times Q_{\text{addressable}}$
- **Base Case**: $(P_{\text{weighted}} - P_{\text{reference}}) \times Q_{\text{addressable}}$
- **Stretch**: $(P_{\text{weighted}} - P_{\text{lowest\_credible}}) \times Q_{\text{addressable}}$
