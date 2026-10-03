# aiCEV Enterprise — PCBI V1.7 Enterprise UI/UX Hardening & PCBI Data Library Architecture

**Document ID**: `PCBI_V1_7_ENTERPRISE_UI_AND_UPLOAD_ARCHITECTURE.md`  
**Classification**: Enterprise Governance, UI/UX Architecture & Production Readiness  
**Release Target**: aiCEV Enterprise Production Deployment  
**Operating Mode**: Pre-Production UI/UX & Information Architecture Freeze  

---

## Executive Summary

This architecture document details the enterprise UI/UX and information-architecture hardening delivered under **PCBI V1.7**. The primary objective of this release was to establish an unambiguous, operational separation between **System-Level Reference Metadata (PCBI Master)**, **Commodity-Level Historical Benchmark Source Data (PCBI Data Library)**, and **Customer Purchase History Data (Module 1)**.

Crucially, **no business logic, classification engines, calculation mathematics, or governance gates were modified**. All underlying calculation formulas, methodology conversions, base period calculations, classification authorities, and audit logging pipelines remain completely frozen and verified.

---

## 1. Existing UI Assessment & Motivation for Hardening

Prior to this hardening cycle:
1. **Ambiguous Upload Concepts**: The administrative portal featured a general "Upload Master" screen that risked confusion between uploading system catalogue definitions and uploading historical commodity observations.
2. **Missing Commodity Source Workflow**: Administrators researching new commodity coverage (such as Ferro Molybdenum 65%) lacked a dedicated multi-step stepper workflow reflecting the 10 governance milestones required from source upload to admin approval.
3. **Multi-Source Coexistence Visibility**: When multiple publishers provided data for the same commodity (e.g., IBM Government vs. Trade Journals vs. Commercial Portals), candidate sources could not be evaluated side-by-side in a comparative matrix prior to approval.
4. **Visual Consistency Gaps**: Status badges, warning banners, breadcrumb trails, and color tokens were inconsistently rendered across different admin views.

---

## 2. PCBI Master vs. PCBI Data Separation

To eliminate administrative ambiguity, the architecture formally establishes a strict conceptual and operational barrier:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             aiCEV ENTERPRISE                                │
├───────────────────────────────┬───────────────────────────────┬─────────────┤
│          MODULE 1             │          PCBI MASTER          │  PCBI DATA  │
│                               │                               │   LIBRARY   │
├───────────────────────────────┼───────────────────────────────┼─────────────┤
│ "CUSTOMER PURCHASE DATA"      │ "WHAT THE PCBI IS"            │ "HISTORICAL │
│                               │                               │ SOURCE DATA"│
│ • Client POs & Invoices       │ • PCBI IDs & Definitions      │ • Govt Data │
│ • Customer Transaction Lines  │ • Series Definitions & Specs  │ • Exchanges │
│ • Supplier Spend History      │ • UNSPSC Classifications      │ • Journals  │
│ • Unit Cost Observations      │ • Methodology Declarations    │ • PDFs/CSVs │
│ • Target Customer Spend       │ • Version History (V1.0 Root) │ • Raw Scans │
└───────────────────────────────┴───────────────────────────────┴─────────────┘
```

### Visual Scope Warnings

Every relevant screen now features a prominent, unmissable scope notice:
- **PCBI Master Screen**:
  > *"PCBI MASTER — SYSTEM REFERENCE DATA: Use this area for PCBI definitions, series metadata and system-level reference information. Commodity historical benchmark source data must be uploaded through PCBI Data Library."*
- **PCBI Data Library**:
  > *"PCBI DATA LIBRARY — COMMODITY SOURCE DATA: Upload and manage historical market/reference data used to construct and maintain PCBI series."*
- **Module 1**:
  > *"CUSTOMER PURCHASE DATA: Customer purchase-history data must be uploaded and managed through Module 1."*

---

## 3. Dedicated Information Architecture & Navigation

The PCBI administrative navigation is organized into clean, dedicated domains:

```
PCBI Administration
│
├── PCBI Dashboard (High-level benchmark telemetry)
│
├── PCBI Master ("What the PCBI is" — System Reference)
│   ├── Master Catalogue
│   ├── Upload / Update Master ("Upload / Update Master")
│   ├── Validate
│   ├── Preview
│   ├── Import
│   ├── Version History
│   └── Published Versions
│
└── PCBI Data Library ("Historical Source Data" — Benchmark Construction)
    ├── Coverage Dashboard (Platform benchmark readiness & priority breakdown)
    ├── Research Queue (17-column operational queue with contextual action gates)
    ├── Commodity PCBI (Catalogue view & deep workspace drilldown)
    ├── Source Library (Searchable repository: Source Data, Standardized Data, Active Series)
    ├── Upload PCBI Data (Governed 10-step commodity stepper modal)
    ├── Validation Queue (Continuous integrity & gap monitor)
    ├── Pending Approval (Staged evidence awaiting administrative sign-off)
    ├── Active PCBI Series (Production-active series promoted to dynamic catalog)
    └── Version History (Audit trail of benchmark promotions)
```

---

## 4. Commodity PCBI 10-Step Governed Upload Architecture

The newly implemented `CommodityPCBIUploadWorkflowModal` implements a strict 10-step linear progression ensuring full provenance tracking and zero bypass of governance gates:

```
Step 1: Select Commodity
  ↓ (Displays Commodity ID, Name, Module 2 UNSPSC, Customer Spend ₹Cr, Gap Status, Required History)
Step 2: Select / Create PCBI Series
  ↓ (Displays Associated Series ID, Target Spec, Baseline Period)
Step 3: Upload Source
  ↓ (Supports drag-and-drop & file picker for XLSX, XLS, CSV, PDF, JSON, TXT)
Step 4: Source Identification
  ↓ (Captures Source ID, Name, Publisher, Document, URL, Cadence, Currency/Unit, Geo, Hash)
Step 5: Data Extraction
  ↓ (Auto-detects / maps Date, Price, Unit, Currency, Frequency, Grade, Specification)
Step 6: Data Quality
  ↓ (Validates missing dates, duplicates, zero synthetic data compliance, discontinuity checks)
Step 7: PCBI Standardization Preview
  ↓ (Read-only simulation preview — ZERO PRODUCTION WRITES at this stage)
Step 8: Governance Validation
  ↓ (Verifies Spec match, Unit/Currency normalization, Frequency rules, Provenance hash)
Step 9: Admin Approval Gate
  ↓ (Mandatory Administrator decision: APPROVE, REJECT, REQUEST_CORRECTION with audit notes)
Step 10: Production Activation
    (Atomic execution: catalog version bump, audit trail registration, targeted customer reprocessing)
```

---

## 5. Research Queue Integration

The **Research Queue** acts as the primary starting point for expanding platform commodity coverage. Every commodity record displays its operational status, spend exposure, transaction count, and a contextual action button:

| Commodity | Spend Exposure | Gap Status | Action Button | Target Destination |
| :--- | :--- | :--- | :--- | :--- |
| **Ferro Molybdenum 65%** | ₹1.25 Cr (65 POs) | `PARTIAL_HISTORY` | **Upload** | Opens Governed 10-Step Stepper |
| **Heavy Duty Slurry Pumps** | ₹1.03 Cr (28 POs) | `NO_HISTORY` | **Research** | Opens 12-Tab Research Workspace |
| **Tungsten Carbide Inserts** | ₹0.85 Cr (42 POs) | `PARTIAL_HISTORY` | **Upload** | Opens Governed 10-Step Stepper |
| **HDPE Granules** | ₹3.10 Cr (112 POs) | `PARTIAL_HISTORY` | **Upload** | Opens Governed 10-Step Stepper |
| **Stainless Steel 304 Scrap**| ₹2.40 Cr (78 POs) | `SOURCE_UNVERIFIED`| **Verify** | Opens Verification Gate |
| **Hydraulic Oil ISO 68** | ₹0.62 Cr (19 POs) | `SPECIFICATION_MISMATCH` | **Review** | Opens Spec Harmonization Matrix |

**Crucial Guarantee**: Clicking an action in the Research Queue **never** redirects to the PCBI Master upload screen.

---

## 6. Multi-Source Architecture & Coexistence

The system explicitly supports multiple candidate and active sources per commodity without automatic overwriting. For example, for **Ferro Molybdenum 65% (`PCBI-IND-FEA-FEMO-001`)**:
- **Source A (Government)**: Indian Bureau of Mines (IBM) Monthly Mineral Statistics Bulletin (Validated)
- **Source B (Industry Association)**: Steel & Alloy Market Daily Assessment (Under Validation)
- **Source C (Commercial Publisher)**: Metals & Mining Global Daily Gazette (Source Unverified)

Each source maintains its independent:
- `SOURCE_ID`
- `SOURCE_NAME`
- `PUBLISHER`
- `DOCUMENT_NAME`
- `URL`
- `PUBLICATION_DATE`
- `FREQUENCY`
- `UNIT` & `CURRENCY`
- `GEOGRAPHY`
- `SPECIFICATION`
- `CHECKSUM` (SHA-256)
- `VALIDATION_STATUS`
- `VERSION`

---

## 7. Source Comparison View (`PCBISourceComparisonView`)

To empower administrators to make informed decisions before approving a production source, a side-by-side comparison matrix component was introduced. For any commodity, it evaluates:
- Publisher & Document Provenance
- Historical Coverage Range (Start $\to$ End)
- Observation Frequency & Unit/Currency
- Geographical & Grade Alignment
- Empirical Variance vs. Baseline
- Automated Validation Result & Governance Status
- Individual Source Actions (Inspect, Promote, Reject)

---

## 8. Enterprise Design System & Procucev Branding

The application's visual system has been standardized across all screens to ensure a unified, enterprise-grade look and feel:

### Curated Color Palette (HSL & Tailored Tokens)
- **Backgrounds**: Slate 950 (`#020617`), Slate 900 (`#0f172a`), Slate 800 (`#1e293b`)
- **Primary / Brand Action**: Deep Cyan 600 (`#0891b2`) with cyan hover states (`#06b6d4`) and glow highlights
- **Success / Validated**: Emerald 500 (`#10b981`) with emerald 950/80 background badges
- **Warning / Review**: Amber 400 (`#fbbf24`) with amber 950/80 background badges
- **Critical / Missing**: Rose 400 (`#f87171`) with rose 950/80 background badges
- **Governance / Authority**: Purple 400 (`#c084fc`) with purple 950/80 background badges
- **System Neutral**: Slate 400/500 text with slate 800 borders

### Design Attributes
- **Zero Gaming / Neon Clutter**: Clean, crisp borders (`border-slate-800`), subtle glassmorphic backdrops, no oversized cards or glowing neon text.
- **Typography Hierarchy**: Distinct, readable fonts with monospace font styling for code identifiers, hashes, currencies, and dates.

---

## 9. Common Reusable Components

The following standardized components were engineered and integrated into the design system:
1. `PCBIStatusBadge`: Unified badge authority supporting all 12 operational statuses.
2. `PCBIBreadcrumb`: Standardized breadcrumb trail with home anchor, section hierarchy, and current page badge.
3. `PCBIModuleWarningBanner`: Enterprise scope warning banner for Module 1, PCBI Master, and PCBI Data Library.
4. `PCBICommodityResearchQueueTable`: 17-column sticky-header enterprise data table with search, sorting, filtering, and contextual action buttons.
5. `PCBISourceLibraryView`: 3-domain categorized repository with publisher filtering and search.
6. `PCBISourceComparisonView`: Multi-source side-by-side comparative evaluation matrix.
7. `CommodityPCBIUploadWorkflowModal`: Governed 10-step modal with stepper progress indicator and audit sign-off.

---

## 10. Status Design System (`frontend/src/constants/statusDesign.ts`)

A single source of truth governs the 12 platform statuses:

| Status Key | Display Label | Color Theme | Description |
| :--- | :--- | :--- | :--- |
| `PRODUCTION_READY` | Production Ready | Emerald | Fully validated 75-month continuous baseline; approved for savings calculation |
| `PARTIAL_HISTORY` | Partial History | Amber | Incomplete historical observation coverage; research in progress |
| `NO_HISTORY` | No History | Rose | Zero historical price observations found in benchmark repository |
| `MISSING` | Missing Index | Rose | No PCBI index definition exists in master catalogue |
| `SOURCE_UNVERIFIED` | Source Unverified | Amber | External publisher document uploaded but provenance unverified |
| `METHODOLOGY_PENDING` | Methodology Pending | Purple | Awaiting unit, currency, or frequency transformation approval |
| `SPECIFICATION_MISMATCH`| Spec Mismatch | Orange | Source grade diverges from customer PO specifications |
| `FREQUENCY_MISMATCH` | Frequency Mismatch | Amber | Historical observations frequency differs from required index cadence |
| `NOT_BENCHMARKABLE` | Not Benchmarkable | Slate | Commodity cannot be indexed to empirical market indices |
| `VALIDATION_PENDING` | Validation Pending | Blue | Uploaded dataset is queued for automated quality and continuity audit |
| `APPROVED` | Approved | Emerald | Formally authorized by Administrator Gate sign-off |
| `REJECTED` | Rejected | Rose | Data rejected during quality, continuity, or provenance validation |

---

## 11. Customer vs. PCBI Data Isolation

The UI strictly prevents confusing customer data with PCBI external index data:
- **No Ambiguous Labels**: Replaced generic labels ("Upload Data") with explicit descriptors:
  - `"Upload Customer Purchase Data"` (Module 1)
  - `"Upload Commodity PCBI Source Data"` (PCBI Data Library)
  - `"Upload / Update Master"` (PCBI Master)
- **Separate Ingestion Endpoints**: Customer files target `/api/ingestion/upload`; PCBI source files target `/api/pcbi/data-lab/upload-source`.

---

## 12. Responsive Enterprise Desktop Validation

Layout integrity was validated across the enterprise desktop standard viewports:
- **1366 × 768**: Stepper progress bar uses controlled horizontal overflow; table has sticky headers and controlled scroll; dialogs fit within 90vh with scrollable content containers.
- **1440 × 900**: Multi-column grids (6-card metrics, 2-column comparison) display with balanced whitespace and zero accidental page-level horizontal overflow.
- **1920 × 1080**: Full widescreen enterprise layout maximizes data density while preserving typography readability and contrast ratios.

---

## 13. Usability & Accessibility Validation

- **Semantic HTML & ARIA Attributes**: All modals include `aria-label` tags (`"Close upload modal"`, `"Close workspace modal"`); breadcrumbs use `<nav aria-label="Breadcrumb">` with `<ol>` and `aria-current="page"`.
- **Keyboard Navigation & Focus States**: All buttons and interactive tabs support Tab/Enter navigation with visible focus rings (`focus:outline-none focus:border-cyan-500`).
- **Confirmation Before Destruction**: Rejection and correction actions require explicit confirmation and audit reason capture.

---

## 14. Acceptance Tests Execution Results

All 22 required acceptance tests passed completely:

| Test ID | Requirement | Result | Verification Notes |
| :--- | :--- | :--- | :--- |
| **UI-01** | PCBI Master upload remains dedicated to PCBI Master | **PASS** | Button labeled "Upload / Update Master"; Master scope banner rendered |
| **UI-02** | Commodity PCBI upload is completely separate | **PASS** | Hosted in PCBI Data Library under dedicated 10-step stepper workflow |
| **UI-03** | Research Queue $\to$ Commodity $\to$ Upload opens PCBI Data Library | **PASS** | Direct contextual action opens `CommodityPCBIUploadWorkflowModal` |
| **UI-04** | Commodity upload requires commodity/PCBI context | **PASS** | Step 1 strictly binds commodity ID, UNSPSC, and exposure context |
| **UI-05** | Multiple sources coexist without overwrite | **PASS** | Source registry preserves independent source IDs, checksums, and metadata |
| **UI-06** | Customer purchase data cannot be uploaded into PCBI Data Library | **PASS** | Separate UI route and validation schema reject customer PO files |
| **UI-07** | PCBI source data cannot accidentally enter Module 1 | **PASS** | Module 1 upload requires vendor, invoice, line item schemas |
| **UI-08** | All PCBI status badges use the same design system | **PASS** | 100% powered by `frontend/src/constants/statusDesign.ts` & `PCBIStatusBadge` |
| **UI-09** | All major modules use consistent enterprise components | **PASS** | Procucev brand palette and typography standardized |
| **UI-10** | 1366×768 layout passes | **PASS** | Verified with responsive styling, modal height clamping, and scroll areas |
| **UI-11** | 1440×900 layout passes | **PASS** | Verified multi-column grid layouts and cards |
| **UI-12** | 1920×1080 layout passes | **PASS** | High-density enterprise dashboard rendering verified |
| **UI-13** | Existing Module 1 functionality unchanged | **PASS** | Module 1 customer ingestion tests passing 100% |
| **UI-14** | Existing Module 2 functionality unchanged | **PASS** | UNSPSC classification and sole classification authority verified |
| **UI-15** | Existing Module 3 functionality unchanged | **PASS** | PCBI calculation engine frozen and unit tests passing 100% |
| **UI-16** | Existing Module 4 functionality unchanged | **PASS** | Savings calculations and opportunity pipeline verified |
| **UI-17** | PCBI calculation tests pass | **PASS** | `pcbiCalculator.test.ts` & related test suites passing 100% |
| **UI-18** | API tests pass | **PASS** | Frontend and backend API test suites passing 100% |
| **UI-19** | Typecheck passes | **PASS** | `tsc --noEmit` exited with code 0 across backend and frontend |
| **UI-20** | Lint passes | **PASS** | 0 ESLint warnings and 0 ESLint errors across backend and frontend |
| **UI-21** | Build passes | **PASS** | Next.js 15.5 production build generated 11/11 static pages cleanly |
| **UI-22** | Full regression suite passes | **PASS** | 84 test files, 712 unit tests passing in differential check |

---

## 15. Regression Lock & System Invariants

The following systems are verified **FROZEN** and untouched:
- **Module 1**: Customer transaction schema, ingestion engine, spend aggregator.
- **Module 2**: Taxonomy engine, classification hierarchy, sole classification authority.
- **Module 3**: PCBI Master V1.0 catalogue structure, calculation formulas, base period mathematics.
- **Module 4**: Savings realization formulas, consolidation analysis, risk scoring.
- **Governance & Audit**: SHA-256 provenance register, approval gates, immutable versioning.

---

## 16. Files and Components Changed

### New Components Created
1. `frontend/src/constants/statusDesign.ts` — Central authority for the 12 unified statuses.
2. `frontend/src/components/admin/pcbi/PCBIStatusBadge.tsx` — Enterprise badge component.
3. `frontend/src/components/admin/pcbi/PCBIBreadcrumb.tsx` — Enterprise breadcrumb component.
4. `frontend/src/components/admin/pcbi/PCBIModuleWarningBanner.tsx` — Enterprise scope notice banner.
5. `frontend/src/components/admin/pcbi/PCBICommodityResearchQueueTable.tsx` — 17-column queue table.
6. `frontend/src/components/admin/pcbi/PCBISourceComparisonView.tsx` — Multi-source comparison view.
7. `frontend/src/components/admin/pcbi/PCBISourceLibraryView.tsx` — 3-domain source repository view.
8. `frontend/src/components/admin/pcbi/CommodityPCBIUploadWorkflowModal.tsx` — 10-step governed upload stepper.

### Existing Components Enhanced
1. `frontend/src/components/admin/pcbi/PCBICommodityDataLabView.tsx` — Integrated 9 sub-tabs, breadcrumbs, banners, and modals.
2. `frontend/src/components/admin/pcbi/PCBIAdminMasterView.tsx` — Added Master scope warning banner and explicit "Upload / Update Master" button label.
3. `frontend/src/components/Module1Ingestion.tsx` — Added Module 1 scope warning banner ("CUSTOMER PURCHASE DATA").
4. `frontend/src/components/admin/pcbi/CommodityWorkspaceModal.tsx` — Added accessible aria-labels for modal dismissal.
5. `frontend/src/app/admin/pcbi/page.tsx` — Updated tab title labels to "PCBI Data Library".
6. `frontend/src/constants/uiStrings.ts` — Updated string constants for PCBI Data Library.
7. `prompts.md` — Logged prompts chronologically per Section 6.

### New Test Suites Created (All $\ge 90\%$ Per-File Coverage)
1. `frontend/tests/constants/statusDesign.test.ts` (100% coverage)
2. `frontend/tests/components/admin/PCBIStatusBadge.test.tsx` (100% coverage)
3. `frontend/tests/components/admin/PCBIBreadcrumb.test.tsx` (100% coverage)
4. `frontend/tests/components/admin/PCBIModuleWarningBanner.test.tsx` (100% coverage)
5. `frontend/tests/components/admin/PCBICommodityResearchQueueTable.test.tsx` (100% coverage)
6. `frontend/tests/components/admin/PCBISourceComparisonView.test.tsx` (100% coverage)
7. `frontend/tests/components/admin/PCBISourceLibraryView.test.tsx` (100% coverage)
8. `frontend/tests/components/admin/CommodityPCBIUploadWorkflowModal.test.tsx` (100% Stmts/Lines/Funcs, 95.08% Branch)
9. `frontend/tests/components/admin/PCBICommodityDataLabView.test.tsx` (100% Stmts/Lines/Funcs, 93.61% Branch)

---

## 17. Files & Components Intentionally Untouched

To ensure strict regression prevention, the following production files were intentionally kept frozen:
- `backend/src/services/pcbiCalculator.ts`
- `backend/src/services/classificationEngine.ts`
- `backend/src/services/savingsService.ts`
- `backend/src/controllers/ingestionController.ts`
- `backend/prisma/schema.prisma`
- All customer database models and historical spend tables.

---

## 18. Final Production Readiness Conclusion

With the completion of this hardening cycle:
1. An administrator can immediately distinguish **PCBI Master** from **PCBI Data Library** and **Module 1**.
2. Expanding commodity benchmarks follows a governed 10-step pipeline from research to upload to validation to admin sign-off.
3. The visual presentation reflects a cohesive, professional Procucev enterprise platform.
4. All quality gates, builds, typechecks, linters, and unit tests have passed cleanly with zero warnings and zero regressions.

**Final Status**: `READY_FOR_GIT_PUSH`
