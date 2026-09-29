# MODULE 2 — STRATEGIC SOURCING INTELLIGENCE, E-AUCTION & VENDOR CONSOLIDATION
## ARCHITECTURE & MASTER LOGIC HARDENING SPECIFICATION V2.0
**Version**: `MODULE_2_SOURCING_LOGIC_V2.0`  
**Scope**: Module 2 Only (Strictly isolated from Module 1, Module 3/PCBI, and Module 4)

---

### 1. Executive Summary & Core Principle
The Strategic Sourcing Intelligence Engine evaluates customer historical procurement transaction data to identify commercially defensible sourcing opportunities without relying on synthetic multipliers, industry percentage assumptions (3%, 5%, 8%, 10%), or external benchmarks.

#### Axiom: Benefit ≠ Spend
$$\text{Addressable Spend} \longrightarrow \text{Eligible Spend} \longrightarrow \text{Historical Reference} \longrightarrow \text{Defensible Spread} \longrightarrow \text{Net Quantifiable Benefit}$$

- **Addressable Spend**: Total spend in analyzed category/item portfolio.
- **Eligible Spend**: Subset with comparable specifications, harmonized UOM, active currency, and multi-supplier competition.
- **Gross Opportunity**: Sum of candidate levers prior to deduplication.
- **Overlapping Opportunity**: Inter-lever redundancy eliminated via mutually exclusive waterfall controls.
- **Net Quantifiable Benefit**: Defensible commercial opportunity supported by customer historical transactions.
- **Identified But Not Yet Quantifiable**: Opportunities recognized by strategic structure where price or volume-tier evidence is absent in historical data.

---

### 2. Unit-Level Calculation Hierarchy
Every opportunity metric originates at the atomic transaction level:
$$\text{Item Code / Description} + \text{Category} + \text{Supplier} + \text{UOM} + \text{Quantity} + \text{Unit Price} + \text{Period} + \text{Contract Status}$$

No calculation is derived from category total approximations alone. Data aggregates upwards:
$$\text{Enterprise} \longrightarrow \text{Category} \longrightarrow \text{Sub-Category} \longrightarrow \text{Item} \longrightarrow \text{Supplier} \longrightarrow \text{Transactions} \longrightarrow \text{Mathematical Formula}$$

---

### 3. The Five Modular Sourcing Levers & Logic

#### Lever 1: E-Auction / Dynamic Reverse Bidding Opportunity
- **Qualification Criteria**:
  1. Recurring demand ($\ge 6$ active months).
  2. $\ge 3$ qualified comparable suppliers.
  3. Meaningful price dispersion ($\text{IQR} / \text{Median} > 1.0\%$).
  4. Credible historical lowest price passing outlier & volume criteria ($\ge 5\%$ volume share).
- **Formula**:
  $$\text{Unit Benefit} = \max(0, \text{Baseline Weighted Price} - \text{Credible Reference Price})$$
  $$\text{E-Auction Benefit} = \text{Unit Benefit} \times \text{Addressable Quantity}$$
- **Scenarios**:
  - *Conservative*: Target price = $P_{25}$.
  - *Base*: Target price = Lowest Credible Historical Price.
  - *Stretch*: Target price = Demonstrated volume-tier best price.

#### Lever 2: Vendor Consolidation & Demand Pooling
- **Qualification Criteria**:
  - Distinguishes core suppliers from fragmented tail suppliers.
  - Tail suppliers purchasing at higher empirical unit rates than core suppliers.
- **Commercial Benefit Formula**:
  $$\text{Commercial Benefit} = \sum_{\text{tail } i} \max(0, \text{Price}_{\text{tail } i} - \text{Best Core Price}) \times \text{Qty}_{\text{tail } i}$$
- **Administrative Benefit Formula**:
  $$\text{Admin Benefit} = \text{PO Reduction Count} \times \text{Customer Cost Per PO}$$
  *(Marked `NOT_QUANTIFIABLE` if customer transaction cost is not explicitly provided).*
- **Target Supplier Structure**:
  - 1 supplier: Maintain sole supplier.
  - 2–3 suppliers: Maintain structure.
  - 4–5 suppliers: Consolidate to 2.
  - $\ge 6$ suppliers: Consolidate to 2–3 qualified suppliers.

#### Lever 3: Category Specialist Re-Sourcing (Direction A: Generalist → Specialist)
- **Qualification Criteria**:
  - Identifies multi-category generalists supplying across unrelated categories.
  - Compares generalist unit rates against verified category specialists in the customer's dataset.
- **Formula**:
  $$\text{Specialist Realignment Benefit} = \sum (\text{Generalist Unit Price} - \text{Specialist Unit Price}) \times \text{Generalist Eligible Qty}$$
- Zero savings generated if the generalist is already cheaper than specialists.

#### Lever 4: Volume Bundling & Batch Pooling (Direction B: Tail → Sourcing Lots)
- **Qualification Criteria**:
  - Combines fragmented demand across small suppliers ($<20\%$ share).
  - Requires empirical volume-tier discount evidence from customer historical transaction batches.
- **Formula**:
  $$\text{Volume Bundling Benefit} = (\text{Current Weighted Price} - \text{Demonstrated Higher-Tier Price}) \times \text{Bundled Qty}$$

#### Lever 5: PO Consolidation & Order Frequency Efficiency
- **Order-Frequency Optimization**:
  - Evaluates current annual PO count against cadences: Monthly (12), Quarterly (4), Half-Yearly (2), Annual (1).
  - Transaction efficiency percentage is reported, but ₹ value is quantified strictly if customer-provided cost per PO exists.

---

### 4. Overlap Removal & Sequential Waterfall Logic
To guarantee that a single rupee of spend is never credited twice:
$$\text{Gross Opportunity} = \text{E-Auction} + \text{Consolidation} + \text{Specialist} + \text{Volume Bundling} + \text{Admin}$$
$$\text{Commercial Best} = \max(\text{E-Auction}, \text{Consolidation}, \text{Specialist}, \text{Volume Bundling})$$
$$\text{Net Quantifiable Benefit} = \text{Commercial Best} + \text{Quantifiable Admin Benefit}$$
$$\text{Overlapping Opportunity Removed} = \text{Gross Opportunity} - \text{Net Quantifiable Benefit}$$

---

### 5. Data Traceability & "How Calculated?" Transparency
Every rupee displayed in the application is drillable via an interactive 9-step audit drawer:
1. Current Category Spend
2. Eligible Spend
3. Eligible Quantity
4. Current Weighted Unit Price
5. Historical Reference Price
6. Price Differential
7. Gross Opportunity
8. Overlap Adjustment
9. Net Quantifiable Opportunity
