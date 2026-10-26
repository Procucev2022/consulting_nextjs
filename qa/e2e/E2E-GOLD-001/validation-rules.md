# E2E-GOLD-001 Independent Validation Rules

## Rule 1: Multi-Currency FX Normalization
- All foreign currencies are converted to INR using transaction-date or prior approved trading day FX observations.
- Converted Line Spend = `Order Quantity * (Net Price / Price Unit) * FX Rate`.

## Rule 2: Exclusions & Quarantine
- Deletion indicators `L` (deleted line) and `X` (cancelled PO) are excluded from spend.
- Transactions with `Quantity == 0` or `Price == 0` (FOC samples) are excluded.
- Transactions with negative quantities/prices or blank material groups are quarantined as forensic anomalies.

## Rule 3: Zero Double Counting
- Gross Opportunity = `Vendor Consolidation + Benchmark Price Gap + Strategic Tail Sourcing`.
- Multi-lever overlap is calculated across shared qualifying lines and subtracted: `Net Direct Savings = Gross Opportunity - Overlap Deduction`.

## Rule 4: Non-Additive Classifications
- Cost Avoidance / Supply Risk is classified separately from cash savings.
- Strategic Market Value (commodity market indices) is classified separately from supplier negotiations.
