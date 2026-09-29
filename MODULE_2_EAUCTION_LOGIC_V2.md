# MODULE 2 — REVERSE E-AUCTION LOGIC SPECIFICATION V2.0
**Document ID**: `MODULE_2_EAUCTION_LOGIC_V2.md`  
**Governing Standard**: Strict Competitive Comparability, Nonparametric Historical Dispersion, Zero Synthetic Discounts

---

## 1. Multi-Dimensional Auction Readiness
A category or item qualifies for dynamic reverse e-auction only after passing 7 readiness criteria:
1. **Specification Standardization**: Homogeneous specifications without proprietary OEM design locks.
2. **Comparable UOM**: Single normalized unit of measure across transaction population.
3. **Currency Standardization**: Uniform transaction currency without forex distortion.
4. **Supplier Competition**: $\ge 3$ qualified, active historical suppliers.
5. **Historical Price Dispersion**: Empirical price dispersion $(P_{75} - P_{25}) / P_{50} > 1.0\%$.
6. **Requirement Recurrence**: Repeatable purchase demand ($\ge 6$ active months in past 24 months).
7. **Volume Visibility**: Sufficient addressable volume ($\ge 5\%$ of annual category spend).

Readiness levels:
- `AUCTION_READY`: All criteria passed.
- `AUCTION_CONDITIONALLY_READY`: 5–6 criteria passed (minor spec or volume review needed).
- `NOT_AUCTION_READY`: $\le 4$ criteria passed or single supplier dependency.

---

## 2. Mathematical Reference Pricing & Three Scenarios

### 2.1 Baseline Quantity-Weighted Average Unit Price
$$\bar{P}_{\text{weighted}} = \frac{\sum (P_i \times Q_i)}{\sum Q_i}$$

### 2.2 Reference Scenarios
1. **CONSERVATIVE**: Reference price = First Quartile ($P_{25}$).
   $$\text{Benefit}_{\text{conservative}} = \max(0, \bar{P}_{\text{weighted}} - P_{25}) \times Q_{\text{addressable}}$$
2. **BASE**: Reference price = Lowest Credible Historical Price ($P_{\text{ref}}$).
   - Validated against Tukey's outlier fence ($P_{25} - 1.5 \times \text{IQR}$) and $\ge 5\%$ volume share.
   $$\text{Benefit}_{\text{base}} = \max(0, \bar{P}_{\text{weighted}} - P_{\text{ref}}) \times Q_{\text{addressable}}$$
3. **STRETCH**: Reference price = Best Demonstrated Comparable Price under Volume Aggregation.
   - Evaluated strictly where customer batch transactions prove volume-tier discount.

If historical price dispersion is $\le 0.5\%$, the opportunity is mathematically evaluated as ₹0.00.
If data depth is inadequate ($<2$ comparable transactions), the status is `IDENTIFIED_NOT_QUANTIFIABLE` (never false ₹0).
