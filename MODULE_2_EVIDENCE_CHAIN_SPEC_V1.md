# MODULE 2 — OPPORTUNITY EVIDENCE CHAIN & TRANSACTION TRACEABILITY SPECIFICATION
====================================================================================================
VERSION: MODULE_2_EVIDENCE_LOGIC_V1.0
STATUS: FINAL PRODUCTION HARDENING
ARCHITECTURAL SCOPE: STRICTLY MODULE 2 ONLY
====================================================================================================

## 1. Executive Summary & Core Business Axiom

The mandate of Module 2 is hardened into an **Evidence-First Procurement Intelligence Engine**.

### The Core Business Principle
> **NO BLACK-BOX SAVINGS.**
> A procurement organization must NEVER receive a conclusion such as "Potential opportunity = ₹X" without being able to trace that figure down to:
> - The exact underlying purchase order transactions
> - The contributing suppliers
> - Item descriptions, specifications, and grades
> - Purchased quantities, unit prices, UOMs, and currencies
> - The comparable reference price and why it was selected
> - The exact mathematical derivation formula
> - Which transactions were excluded and why

---

## 2. The Nine-Stage Opportunity Evidence Chain

Module 2 persists and exposes an immutable, drillable `OPPORTUNITY_EVIDENCE_CHAIN`:

```
Stage 1:  TRANSACTION INGESTION
          Every validated customer transaction is assigned an audit ID, source document, and row index.
              ↓
Stage 2:  COMPARABLE TRANSACTION SET
          Transactions filtered for standard specifications, validated UOMs, and non-outlier validity.
              ↓
Stage 3:  REFERENCE PRICE SELECTION
          Lowest Credible Price determined via volume relevance (>= 5%) and non-dump rules (>= 65% median).
              ↓
Stage 4:  ADDRESSABLE VOLUME DETERMINATION
          Sum of quantities in eligible comparable transactions.
              ↓
Stage 5:  PRICE DIFFERENCE CALCULATION
          Spread: WAP - Selected Reference Price.
              ↓
Stage 6:  GROSS OPPORTUNITY DERIVATION
          Gross = Price Difference × Addressable Volume.
              ↓
Stage 7:  ADDRESSABILITY CONSTRAINTS ADJUSTMENT
          Contract lock-in, unharmonized specifications, and operational minimums deducted.
              ↓
Stage 8:  REALISTIC OPPORTUNITY RANGE
          Conservative (P25), Base (Lowest Credible), and Upside (Lowest Observed) spreads calculated.
              ↓
Stage 9:  EVIDENCE STATUS & CONFIDENCE ATTESTATION
          Attested as PROVEN, RANGE, or MARKET DISCOVERY with factual confidence justifications.
```

---

## 3. Transaction-Level Evidence Standard (24 Attributes)

For every evaluated line item, Module 2 maintains a 24-point audit record:

| Attribute | Description | Example |
| :--- | :--- | :--- |
| `TRANSACTION_ID` | Surrogate unique identifier | `TX-STL-001` |
| `PO_NUMBER` | Customer purchase order reference | `PO-1001` |
| `PO_DATE` | Transaction issuance date | `2026-01-10` |
| `SUPPLIER_ID` | Supplier master code | `SUPP-TATA` |
| `SUPPLIER_NAME` | Supplier legal trade name | `Tata Steel Ltd` |
| `CATEGORY` | Module 2 category authority | `Structural Steel` |
| `SUB_CATEGORY` | Granular commodity classification | `Plates` |
| `ITEM_ID` | Customer SKU / part code | `MAT-PLT-10` |
| `ITEM_DESCRIPTION` | Line-item description | `Carbon Steel Plate 10mm` |
| `SPECIFICATION` | Engineering standard | `ASTM A36 / IS 2062` |
| `GRADE` | Commercial material grade | `Grade A` |
| `UOM` | Harmonized unit of measure | `MT` |
| `QUANTITY` | Delivered order quantity | `1,000` |
| `UNIT_PRICE` | Invoiced unit purchase price | `₹65,000.00` |
| `CURRENCY` | Transaction currency | `INR` |
| `TOTAL_VALUE` | Extended invoice spend | `₹6,50,00,000.00` |
| `DELIVERY_LOCATION` | Consignee plant / destination | `Plant Jamshedpur` |
| `CONTRACT_STATUS` | Agreement validity | `ACTIVE_CONTRACT` |
| `CONTRACT_REFERENCE` | Master agreement reference | `MSA-STANDARD-2025` |
| `PAYMENT_TERMS` | Credit settlement period | `Net 45 Days` |
| `INCOTERM` | Freight & logistics delivery term | `FOR Destination` |
| `SOURCE_DOCUMENT` | ERP data origin | `ERP_PURCHASE_ORDER` |
| `SOURCE_ROW` | Staging line-item index | `Row #1` |
| `DATA_QUALITY_STATUS` | Attribute completeness | `VERIFIED` |
| `COMPARABILITY_STATUS` | Cross-supplier comparison validity | `COMPARABLE` |

---

## 4. Lowest Credible Price vs. Lowest Observed Price

Module 2 strictly avoids using the absolute historical minimum as an automatic target.
- **Lowest Observed Price**: The mathematical minimum unit price in the dataset (often a one-off surplus dump, sample lot, or distressed sale).
- **Lowest Credible Price**: Established from transactions that satisfy:
  1. $\ge 5\%$ of total category volume.
  2. Price $\ge 65\%$ of category median (prevents erroneous dump rates).
  3. Supplier with $\ge 2$ repeat qualifying transactions.
  4. Recency window $\le 24$ months.

---

## 5. Opportunity Exclusion Ledger (11 Governed Codes)

Excluded transactions are isolated into an audit ledger:
- `EXCLUDED_SPEC_MISMATCH`: Specification divergence.
- `EXCLUDED_UOM_MISMATCH`: Unharmonized units.
- `EXCLUDED_CURRENCY_MISMATCH`: Non-comparable currency.
- `EXCLUDED_GEOGRAPHY`: Unique freight/duty distortion.
- `EXCLUDED_SINGLE_SOURCE_OUTLIER`: Statistical outlier outside $1.5 \times \text{IQR}$.
- `EXCLUDED_LOW_VOLUME`: Micro-order $< 0.5\%$ of spend.
- `EXCLUDED_CONTRACT_LOCK`: Legally encumbered contract.
- `EXCLUDED_NON_RECURRING`: Non-repeat prototype or spot purchase.
- `EXCLUDED_INVALID_TRANSACTION`: Zero or negative price/quantity.
- `EXCLUDED_INSUFFICIENT_DATA`: Missing essential attributes.
- `EXCLUDED_PRICE_NOT_COMPARABLE`: Unbundled tooling or services.

---

## 6. Spend Addressability Hierarchy

```
TOTAL HISTORICAL SPEND (Gross Ingested Customer Category Spend)
       ↓
COMPARABLE SPEND (Spend after subtracting unharmonized specifications/UOMs)
       ↓
PRICE-ADDRESSABLE SPEND (Volume qualified for unit price benchmarking)
       ↓
EXECUTABLE SPEND (Contractually free spend ready for market tender)
       ↓
REALIZABLE SAVINGS (Certified strictly in Module 4 execution)
```
