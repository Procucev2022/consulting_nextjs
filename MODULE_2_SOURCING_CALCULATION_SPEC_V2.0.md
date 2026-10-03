# MODULE 2 — SOURCING CALCULATION SPECIFICATION V2.0
**Document ID**: `MODULE_2_SOURCING_CALCULATION_SPEC_V2.0`  
**Standard**: Strict Empirical Traceability, Zero Arbitrary Multipliers, Zero Hardcoded Savings Percentages

---

## 1. Mathematical Definitions & Price Dispersion Formulas

### 1.1 Baseline Quantity-Weighted Average Unit Price
For a population of $N$ eligible historical transactions within a material or category code:
$$\bar{P}_{\text{weighted}} = \frac{\sum_{i=1}^{N} (P_i \times Q_i)}{\sum_{i=1}^{N} Q_i}$$
where $P_i$ is the unit purchase price and $Q_i$ is the quantity purchased in transaction $i$.

### 1.2 Nonparametric Dispersion Metrics
Given the ordered price sequence $P_{(1)} \le P_{(2)} \le \dots \le P_{(N)}$:
- Median ($P_{50}$): Value at the 50th percentile.
- First Quartile ($P_{25}$): Value at the 25th percentile.
- Third Quartile ($P_{75}$): Value at the 75th percentile.
- Interquartile Range: $\text{IQR} = P_{75} - P_{25}$.
- Relative Price Dispersion:
$$\text{Dispersion \%} = \frac{P_{75} - P_{25}}{P_{50}} \times 100$$

### 1.3 Credible Historical Lowest Price Determination
Let $P_{\min}$ be the lowest transaction price. $P_{\min}$ is accepted as the defensible reference price $P_{\text{ref}}$ if and only if it satisfies all 6 validation criteria:
1. $\text{UOM}_{\min} \equiv \text{UOM}_{\text{baseline}}$ (Identical normalized unit of measure).
2. $\text{Spec}_{\min} \equiv \text{Spec}_{\text{baseline}}$ (No specification or grade degradation).
3. $\text{Currency}_{\min} \equiv \text{Currency}_{\text{baseline}}$ (Constant currency conversion).
4. $Q_{\min} \ge 0.05 \times \sum Q_i$ (Sufficient volume: minimum 5% of addressable demand).
5. $P_{\min} \ge P_{25} - 1.5 \times \text{IQR}$ (Tukey's standard outlier lower fence).
6. $\text{Date}_{\min}$ is within the valid active historical window ($\le 24$ months).

If $P_{\min}$ violates any criteria, $P_{\text{ref}}$ falls back to $P_{25}$.

---

## 2. Lever Calculation Formulations

### 2.1 E-Auction Opportunity
$$\Delta P_{\text{eauction}} = \max(0, \bar{P}_{\text{weighted}} - P_{\text{ref}})$$
$$\text{Opportunity}_{\text{eauction}} = \Delta P_{\text{eauction}} \times Q_{\text{addressable}}$$

### 2.2 Vendor Consolidation Opportunity
Tail suppliers are defined as suppliers outside the top spend contributors with cumulative spend share $\le 40\%$.
Let $P_{\text{core\_best}} = \min_{s \in \text{Core}} \bar{P}_s$.
$$\Delta P_{\text{tail\_gap}, j} = \max(0, \bar{P}_{\text{tail}, j} - P_{\text{core\_best}})$$
$$\text{Commercial Opportunity}_{\text{consolidation}} = \sum_{j \in \text{Tail}} (\Delta P_{\text{tail\_gap}, j} \times Q_{\text{tail}, j})$$

### 2.3 Specialist Re-Sourcing Opportunity
For items purchased from multi-category generalist $G$, if an active single-category specialist $S$ exists with lower weighted price:
$$\Delta P_{\text{specialist}} = \max(0, \bar{P}_G - \bar{P}_S)$$
$$\text{Opportunity}_{\text{specialist}} = \Delta P_{\text{specialist}} \times Q_G$$

### 2.4 Volume Bundling Opportunity
Where historical batch purchases demonstrate volume discounts with price-tier slope $S_{\text{vol}} > 0$:
$$\text{Opportunity}_{\text{volume}} = \bar{P}_{\text{weighted}} \times S_{\text{vol}} \times Q_{\text{bundled}}$$

### 2.5 PO Consolidation Opportunity
$$\text{Reduction Count} = \max(0, \text{Current PO Count} - \text{Target Cadence POs})$$
$$\text{Admin Benefit} = \begin{cases} 
\text{Reduction Count} \times \text{Customer Cost Per PO}, & \text{if cost is specified} \\ 
\text{NOT\_QUANTIFIABLE}, & \text{otherwise} 
\end{cases}$$

---

## 3. Mutual Exclusivity and Overlap Removal
To prevent double-counting of commercial leverage on the same volume:
$$\text{Gross Commercial} = \text{Opp}_{\text{eauction}} + \text{Opp}_{\text{consolidation}} + \text{Opp}_{\text{specialist}} + \text{Opp}_{\text{volume}}$$
$$\text{Net Commercial} = \max(\text{Opp}_{\text{eauction}}, \text{Opp}_{\text{consolidation}}, \text{Opp}_{\text{specialist}}, \text{Opp}_{\text{volume}})$$
$$\text{Net Total Opportunity} = \text{Net Commercial} + \text{Admin Benefit (if quantifiable)}$$
$$\text{Deduplicated Overlap} = (\text{Gross Commercial} + \text{Admin Benefit}) - \text{Net Total Opportunity}$$
