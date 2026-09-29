# MODULE 2 — OPPORTUNITY POTENTIAL, MARKET DISCOVERY & PROCUREMENT MATURITY ENGINE
====================================================================================================
VERSION: MODULE_2_OPPORTUNITY_INTELLIGENCE_V2.0
STATUS: FINAL BUSINESS LOGIC HARDENING
ARCHITECTURAL SCOPE: STRICTLY MODULE 2 ONLY
====================================================================================================

## 1. Executive Summary & Foundational Business Axiom

The core mandate of Module 2 is transformed from a historical price-variance calculator into an enterprise-grade **Strategic Sourcing Opportunity Intelligence Engine**.

### The Foundational Axiom
> **ABSENCE OF HISTORICAL EVIDENCE OF SAVINGS DOES NOT MEAN ABSENCE OF PROCUREMENT OPPORTUNITY.**
> A company must NEVER be told or implied that its procurement is "perfect" or "optimized" merely because the available customer transaction history does not demonstrate a quantifiable price opportunity.

### Absolute Guardrails
1. **Zero Fabricated Savings**: Never manufacture target prices, assumed percentage discounts, or synthetic benchmark curves.
2. **Zero False Precision**: Do not present single deterministic numbers when evidence warrants a governed empirical range ($P_{75}/\text{Median} \to P_{25}$).
3. **Zero Direct-to-Savings Maturity Conversion**: Diagnostic scores (0–10) diagnose organizational capability and risk; they are NEVER multiplied by spend to create arbitrary savings.
4. **Zero Double-Counting**: Price variance captured via e-auction mechanisms cannot be concurrently claimed under supplier consolidation.
5. **Strict Module Boundary Isolation**: Operates exclusively on internal customer procurement history. Module 1 ingestion pipelines, Module 3 external benchmark libraries (PCBI), and Module 4 realized savings realization routines remain completely isolated and untouched.

---

## 2. Six Controlled Opportunity Evidence States

Module 2 classifies all category opportunity evaluations into one of six mutually exclusive, governed states:

| Status Code | Display Name | Technical Criteria | Monetary Output | Procurement Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `PROVEN_OPPORTUNITY` | Proven Opportunity | $\ge 2$ active suppliers, $\ge 3$ comparable txns, statistically significant price dispersion ($\text{WAP} > P_{25}$ with valid variance). | Deterministic value: $(\text{WAP} - P_{25}) \times \text{Vol}$ | Immediate Sourcing Execution (RFQ / E-Auction) |
| `QUANTIFIABLE_OPPORTUNITY_RANGE` | Quantifiable Opportunity Range | Empirical transaction quartiles support a defensible spread ($P_{75} \to P_{25}$ or $\text{Median} \to P_{25}$). | Governed Range: Min ₹X – Max ₹Y | Governed Range Sourcing Tender |
| `MARKET_DISCOVERY_OPPORTUNITY` | Market Discovery Required | Structural indicators present (single incumbent, $HHI > 0.5$, recurring spend $> ₹50\text{L}$, no competitive event $>12$ mos), but internal history lacks price comparator. | Market Discovery Required (Never ₹0) | Competitive Market Tender & Price Discovery |
| `IDENTIFIED_NOT_QUANTIFIABLE` | Identified — Not Yet Quantifiable | Clear structural mechanism visible (e.g. multi-supplier specification divergence, unharmonized UOMs) but parameters incomplete. | Not Yet Quantifiable | Specification Harmonization & SKU Rationalization |
| `LOW_EVIDENCED_OPPORTUNITY` | Low Evidenced Opportunity | Available historical data does not demonstrate material dispersion or structural concentration. | No Material Opportunity Shown | Periodic Market Testing & Continuous Monitoring |
| `INSUFFICIENT_DATA` | Insufficient Data | Data completeness $< 60\%$ or missing critical attributes (prices, quantities, UOMs, supplier IDs). | Insufficient Data | Missing Data Ingestion & Enrichment |

---

## 3. Two-Dimensional Opportunity Model

Every opportunity assessment is evaluated independently across two orthogonal dimensions:
```
                               ▲ EVIDENCE CONFIDENCE
                               │
                HIGH           │   [PROVEN OPPORTUNITY]          [GOVERNED RANGE]
                               │   Defensible single-point       Empirical quartile spread
                               │
               MEDIUM          │   [MARKET DISCOVERY]            [IDENTIFIED NOT QUANT]
                               │   Structural trigger active     Consolidation without spec
                               │
                 LOW           │   [LOW EVIDENCED]               [INSUFFICIENT DATA]
                               │   No material variance seen     Data missing / incomplete
                               │
                               └────────────────────────────────────────────────────────►
                                                      POTENTIAL VALUE STATE
```
- **Dimension 1: Potential Value Type** (`PROVEN`, `RANGE`, `MARKET_DISCOVERY`, `NOT_QUANTIFIABLE`, `INSUFFICIENT`)
- **Dimension 2: Evidence Confidence** (`HIGH`, `MEDIUM`, `LOW`, `INSUFFICIENT`)

---

## 4. Six Core Sourcing Opportunity Dimensions

1. **Price Opportunity**: Unit price dispersion evaluation across comparable item transactions ($\text{WAP} - \text{RefPrice}$).
2. **Volume Opportunity**: Volume concentration, addressability, and batching potential.
3. **E-Auction Opportunity**: 8-parameter operational and commercial readiness evaluation for dynamic reverse auctions.
4. **Supplier Consolidation Opportunity**: Tail-spend supplier count reduction, HHI concentration balancing, and operational PO overhead elimination.
5. **Category Specialization**: Analysis of cross-category generalist suppliers versus domain-focused specialist vendors.
6. **Procurement Maturity & Commercial Excellence**: 12 commercial dimensions and 10 maturity pillars audited for structural excellence.

---

## 5. Architectural Integrity & Module Isolation Verification

- **Module 1 Boundary**: Consumes normalized transaction tables without altering ingestion mappings, schemas, or staging records.
- **Module 3 / PCBI Boundary**: Uses zero external commodity price indices, zero FeMo/PCBI tables, and zero synthetic benchmark curves.
- **Module 4 Boundary**: Produces standardized handoff packages containing traceable transaction proofs and audit IDs; does not initiate contract execution or track realized EBITDA.
