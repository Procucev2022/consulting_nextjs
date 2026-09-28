# PCBI MODULE 3 — CONTROLLED PILOT READINESS & COMMODITY EXPANSION REPORT (V1.6)

## Gate Status: PRODUCTION_READY_FOR_CONTROLLED_PILOT

**Report Date**: September 28, 2026  
**Module Status**: `PRODUCTION_READY_FOR_CONTROLLED_PILOT`  
**Operating Mode**: Controlled Pilot / Dynamic Expansion (Pre-Commercial)  
**Safety Locks**:
- Module 1 (Customer Data Processing): **FROZEN**
- Module 2 (Commodity Classification Authority): **FROZEN**
- PCBI Master V1.0: **IMMUTABLE**
- Module 4 (Savings & Procurement Negotiations): **DISCONNECTED**
- Commercial Savings Calculated: **ZERO**
- Paid / Commercial Purchases: **ZERO**

---

## Executive Summary

The PCBI Module 3 Calculation Engine has transitioned from Architecture Validation to **Controlled Pilot & Dynamic Library Expansion (V1.6)**. All 20 Product Acceptance Tests have passed cleanly (100% pass rate).

The platform establishes that **Module 3 is immediately operable with certified commodities** without waiting for the entire universe of global raw materials to be indexed. Missing or partially defined commodities generate actionable research queue items without blocking active benchmark computations.

---

## Phase 1 — Certified Customer Spend Audit

- **Customer Dataset**: Certified Module 1 + Module 2 Customer Spend Dataset (`Purchase_History_Multi_Currency_Sample.xlsx`)
- **Full Dataset Confirmed**: **YES**
- **Total Customer Spend**: **₹86,317,055** (`₹8.6317 Cr`)
- **Total Transactions Audited**: **15**
- **Total Customer Commodity Families**: **13** (12 physical commodities + 1 excluded service contract)
- **Spend Breakdown**:
  - Certified Production-Ready Spend: **₹32,120,405** (37.2%)
  - Actionable Research Queue Spend: **₹38,459,325** (44.6%)
  - Excluded Service Spend: **₹15,737,325** (18.2%)

---

## Phase 2 — Pilot Dashboard Metrics

| Metric | Certified Count | Notes |
| :--- | :--- | :--- |
| **Total Customer Spend** | **₹86,317,055** | Certified purchase history (15 txns) |
| **Total Commodities** | **13** | 12 material families + 1 service |
| **PCBI Defined** | **11** | Specifications established |
| **PCBI Missing** | **1** | Ferro Molybdenum 65% (P1 Critical) |
| **Complete History (75m)** | **9** | 2020-04 to 2026-06 coverage |
| **Partial History (42m)** | **2** | Carbide Inserts, HDPE Granules |
| **No History (0m)** | **2** | Slurry Pumps, Ferro Molybdenum |
| **Source Verified** | **6** | AMAI, WPI Metals, WPI Paper, JPC, LME, MEPS |
| **Source Pending** | **4** | Candidate feeds under review |
| **Methodology Approved** | **6** | Validated transformation logic |
| **Methodology Pending** | **3** | Scrap discount, fortnightly interp. |
| **Ready for Calculation** | **6** | Active indexing pipeline |
| **Production Ready** | **6** | Steel HRC, Kraft Paper, TMT, SS316L, Copper, Caustic |
| **High Impact Gaps (> ₹1.0 Cr)**| **2** | Ferro Moly (₹1.25 Cr), Slurry Pumps (₹1.03 Cr) |

---

## Phase 3 — Live Customer Gap Research Queue (Top Gaps by Spend)

Sorted primarily by customer spend descending to direct research resources to highest financial exposure:

| Priority | Commodity | UNSPSC | Customer Spend | Status | Required Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1_CRITICAL** | Ferro Molybdenum 65% | 30102400 | ₹12,500,000 (`₹1.25 Cr`) | `PCBI_MISSING` | `[CREATE PCBI]` |
| **P1_CRITICAL** | Slurry Pumps & Impellers | 40151500 | ₹10,309,200 (`₹1.03 Cr`) | `PCBI_DEFINED_NO_HISTORY` | `[UPLOAD HISTORY]` |
| **P2_HIGH** | Carbide Cutting Inserts | 27112803 | ₹7,723,750 (`₹0.77 Cr`) | `PARTIAL_HISTORY` (42m) | `[APPEND HISTORY]` |
| **P2_HIGH** | HDPE Granules Grade 5502 | 13102005 | ₹3,026,875 (`₹0.30 Cr`) | `FREQUENCY_MISMATCH` | `[ADD METHODOLOGY]` |
| **P3_MEDIUM** | SS 304 Scrap Turnings | 11101704 | ₹2,850,000 (`₹0.29 Cr`) | `METHODOLOGY_PENDING` | `[VALIDATE METHODOLOGY]` |
| **P3_MEDIUM** | Mobil DTE 25 Hydraulic Oil | 15121500 | ₹1,850,000 (`₹0.19 Cr`) | `SPECIFICATION_MISMATCH` | `[ADD SOURCE]` |
| **P4_LOW** | Engineering & Advisory | 81101500 | ₹15,737,325 (`₹1.57 Cr`) | `NOT_BENCHMARKABLE` | Service exclusion |

---

## Phase 4 — Normalized Analytical Preview (Zero Savings Enforced)

All customer values are strictly reported in **INR (₹)** with invoice units, and PCBI benchmark values are separately reported with their respective currencies and units:

| Commodity | Customer Purchase Price | PCBI Base (2020-04) | PCBI Current (2026-06) | PCBI Index | Movement | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Domestic Semi-Kraft Paper 140 GSM** | ₹72,645.00 / PCS | 120.00 INDEX_POINTS | 168.00 INDEX_POINTS | **140.00** | +40.0% | ANALYTICAL PREVIEW — NOT SAVINGS |
| **Hot Rolled Steel Coils IS 2062** | ₹66,678.25 / MT | ₹36,500.00 / MT | ₹54,750.00 / MT | **150.00** | +50.0% | ANALYTICAL PREVIEW — NOT SAVINGS |
| **TMT Rebars Fe 500D** | ₹52,000.00 / MT | ₹38,200.00 / MT | ₹53,480.00 / MT | **140.00** | +40.0% | ANALYTICAL PREVIEW — NOT SAVINGS |
| **SS Seamless Pipes SS 316L** | ₹507,500.00 / MT | €2,600.00 / MT | €3,640.00 / MT | **140.00** | +40.0% | ANALYTICAL PREVIEW — NOT SAVINGS |
| **Refined Copper Cathode Grade A** | ₹824,000.00 / MT | $6,450.00 / MT | $9,675.00 / MT | **150.00** | +50.0% | ANALYTICAL PREVIEW — NOT SAVINGS |
| **Caustic Soda Lye 48%** | ₹3,992.58 / LTR | ₹28,500.00 / MT | ₹39,900.00 / MT | **140.00** | +40.0% | ANALYTICAL PREVIEW — NOT SAVINGS |

---

## Phase 5 — 20/20 Product Acceptance Test Verification

All 20 product acceptance tests passed with zero failures:
- **TEST 01** (`TEST_01`): Existing eligible PCBI calculates successfully -> **PASSED**
- **TEST 02** (`TEST_02`): Missing PCBI generates actionable gap -> **PASSED**
- **TEST 03** (`TEST_03`): Admin uploads XLSX -> **PASSED**
- **TEST 04** (`TEST_04`): Admin uploads PDF -> **PASSED**
- **TEST 05** (`TEST_05`): Admin uploads CSV -> **PASSED**
- **TEST 06** (`TEST_06`): System detects columns and frequency -> **PASSED**
- **TEST 07** (`TEST_07`): System blocks unapproved frequency conversion -> **PASSED**
- **TEST 08** (`TEST_08`): Admin approves methodology -> **PASSED**
- **TEST 09** (`TEST_09`): Admin approves PCBI -> **PASSED**
- **TEST 10** (`TEST_10`): Commodity transitions through all 4 lifecycle states -> **PASSED**
- **TEST 11** (`TEST_11`): New historical data can be appended -> **PASSED**
- **TEST 12** (`TEST_12`): Version history remains immutable -> **PASSED**
- **TEST 13** (`TEST_13`): Second source can be added concurrently -> **PASSED**
- **TEST 14** (`TEST_14`): Source provenance remains separate -> **PASSED**
- **TEST 15** (`TEST_15`): One blocked commodity does not prevent eligible calculation -> **PASSED**
- **TEST 16** (`TEST_16`): Module 1 remains unchanged -> **PASSED**
- **TEST 17** (`TEST_17`): Module 2 remains unchanged -> **PASSED**
- **TEST 18** (`TEST_18`): Module 4 remains disconnected -> **PASSED**
- **TEST 19** (`TEST_19`): Savings remains ZERO -> **PASSED**
- **TEST 20** (`TEST_20`): Commercial purchasing remains ZERO -> **PASSED**

---

## Phase 6 — Five Final Deliverables Summary

1. **IMPLEMENTED**:
   - V1.5 Calculation engine frozen as baseline.
   - 10-state lifecycle state machine.
   - Non-blocking execution architecture.
   - Live Customer Gap Matrix & permanent research queue sorted by customer spend.
   - Multi-format upload detection engine (XLSX, XLS, CSV, PDF, JSON, TXT).
   - Preview mode before admin approval (zero silent ingestion).
   - 24-field standardized observation record schema.
   - Display normalization separating Customer INR metrics from PCBI indices.
   - Targeted single-commodity rerun without global dataset interruption.
2. **PASSING TESTS**:
   - 20/20 Product Acceptance Tests passed (100%).
   - All backend and frontend unit tests passed.
3. **REMAINING PRODUCT GAPS**:
   - 2 High-Impact Gaps (> ₹1.0 Cr): Ferro Molybdenum 65% (₹1.25 Cr) and Slurry Pumps (₹1.03 Cr).
   - 2 Partial/Frequency Gaps: Carbide Inserts (42m), HDPE Granules (Fortnightly feed).
   - 2 Methodology/Specification Gaps: SS 304 Scrap (-18% formula), Hydraulic Oil (Automotive feed).
4. **CURRENT PCBI RESEARCH QUEUE**:
   - Prioritized in `PCBI_V1_6_GAP_RESEARCH_QUEUE.xlsx`.
   - Top priority: Indian Metallurgical Assessment Bulletin for FeMo 65% and Machinery Feed for Slurry Pumps.
5. **ADMIN ACTION REQUIRED**:
   - Access Admin Portal at `/api/v1/pcbi/admin/pilot/gap-matrix`.
   - Initiate `[CREATE PCBI]` for Ferro Molybdenum 65%.
   - Ingest candidate historical observations via `[UPLOAD DATA]`.
   - Validate detection preview and execute approval sign-off.
   - System will automatically rerun Ferro Molybdenum in isolation and promote it to `PRODUCTION_READY`.

---

## Final Operating Gate

```
MODULE3_STATUS = PRODUCTION_READY_FOR_CONTROLLED_PILOT
```
