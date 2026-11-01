/**
 * Borosil Executive Brief Slide Groups Constants (Prompt 589)
 * Authoritative 8-group presentation structure for Borosil Ltd (AIC-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type { ExecutiveBriefSlideGroup } from '../types/executiveBriefExportTypes';

export const BOROSIL_SLIDE_GROUPS: ExecutiveBriefSlideGroup[] = [
  {
    groupId: '01',
    groupNumber: '01',
    title: 'Executive Overview & Sourcing Architecture',
    slideRange: 'Slides 01–03',
    summary: 'Executive summary of procurement diagnostic, baseline spend, and modelled opportunity identified for commercial validation.',
    background: 'Specialty glassware manufacturing footprint evaluated across Bharuch (1120) and Jaipur (6101, 8202) units.',
    objective: 'Establish definitive C-suite alignment on spend baseline, deduplicated opportunity, and governance.',
    finding: 'Evaluated ₹556.535 Cr spend yields ₹87.100 Cr net opportunity and Modelled Opportunity Excluding Lever 2: ₹75.121 Cr (Client-Approved: ₹0, Realized: ₹0).',
    evidence: '27,777 verified PO line items across 1,537 Active SAP Supplier Accounts reconciled with zero variance.',
    outcome: 'Structured 3-wave implementation roadmap targeting ₹12.90 Cr proposed Year 1 sourcing target.',
    recommendedAction: 'Convene joint Borosil-Procucev steering committee to authorize Wave 1 execution charter.',
    nextStep: 'Mobilize category sourcing specialists for direct price harmonization on chemicals and packaging tenders.',
    detailCards: []
  },
  {
    groupId: '02',
    groupNumber: '02',
    title: 'Customer Context & Manufacturing Footprint',
    slideRange: 'Slides 04–05',
    summary: 'Borosil enterprise context, evaluated plant operations, and category spend Pareto distribution.',
    background: 'Operations across 3 key manufacturing facilities with ₹168.658 Cr addressable sourcing spend.',
    objective: 'Map direct materials, plant consumables, packaging, and spares to specialized sourcing strategies.',
    finding: 'Dense Soda Ash, Silica Sand, and packaging comprise over 50% of direct addressable spend.',
    evidence: 'Audited ERP purchase records across FY2026-27 YTD (205 days) with 100% data lineage.',
    outcome: 'Targeted sourcing levers mapped to qualified supplier panels and regional distribution hubs.',
    recommendedAction: 'Standardize commercial payment terms to 60 days and establish direct manufacturer agreements.',
    nextStep: 'Finalize multi-plant master framework agreements for core chemical feedstocks.',
    detailCards: []
  },
  {
    groupId: '03',
    groupNumber: '03',
    title: 'Module 1: Spend Hygiene & Baseline Ingestion',
    slideRange: 'Slide 06',
    summary: 'Forensic normalization across 27,777 canonical PO rows and 1,537 Active SAP Supplier Accounts.',
    background: 'Cleaned transaction ledger reconciled across plant operations under AES-256-GCM encryption.',
    objective: 'Ensure zero synthetic variance and total line-item lineage back to purchase orders.',
    finding: 'Certified baseline spend of ₹556.535 Cr across 8,976 catalog items and 133 material groups.',
    evidence: 'Granular PO-level ex-works unit rates normalized for freight, duties, and plant delivery terms.',
    outcome: 'Defensible foundation established for cross-plant price harmonization and volume pooling.',
    recommendedAction: 'Maintain automated baseline hygiene checks for all future invoice feeds.',
    nextStep: 'Ingest monthly incremental ERP lines under identical validation rules.',
    detailCards: []
  },
  {
    groupId: '04',
    groupNumber: '04',
    title: 'Module 2: Strategic Sourcing Levers (Lever 1)',
    slideRange: 'Slide 07',
    summary: 'Cross-plant unit price harmonization and direct manufacturer negotiation (Dense Soda Ash, Silica Sand).',
    background: 'Price dispersion observed across Bharuch and Jaipur plants for identical chemical grades.',
    objective: 'Harmonize purchase prices to lowest contracted rates and execute primary producer master contracts.',
    finding: 'Gross opportunity of ₹104.094 Cr yields ₹73.769 Cr net modelled opportunity across 89 qualified packages.',
    evidence: 'PO line comparisons between plant receipts and supplier contracted rate cards.',
    outcome: 'Net modelled opportunity of ₹73.769 Cr identified for commercial validation.',
    recommendedAction: 'Initiate master supplier negotiations with primary soda ash producers (e.g. GHCL).',
    nextStep: 'Issue consolidated enterprise RFP tenders across all 3 plant locations.',
    detailCards: []
  },
  {
    groupId: '05',
    groupNumber: '05',
    title: 'Module 2: Vendor Consolidation Safeguard (Lever 2)',
    slideRange: 'Slide 08',
    summary: 'Status: Under Commercial Validation — Savings Not Yet Established (Addressable Spend: ₹12.081 Cr).',
    background: 'Tail supplier fragmentation identified across plant electrical, mechanical, and consumable spares.',
    objective: 'Conduct rigorous commercial qualification before establishing definitive savings figures.',
    finding: 'Relevant addressable spend of ₹12.081 Cr evaluated across 4 high-fragmentation categories (₹11.978 Cr modelled opportunity).',
    evidence: '1,537 Active SAP Supplier Accounts audited; ₹11.978 Cr modelled opportunity held in governance reserve.',
    outcome: 'Status: Under Commercial Validation — Savings Not Yet Established (₹0 customer-facing contribution).',
    recommendedAction: 'Complete plant engineering and technical validation of alternate supplier panels.',
    nextStep: 'Execute joint commercial market validation to establish confirmed contract savings.',
    detailCards: []
  },
  {
    groupId: '06',
    groupNumber: '06',
    title: 'Module 2: Dynamic E-Auction Bidding (Lever 3)',
    slideRange: 'Slide 09',
    summary: 'Competitive multi-round reverse dynamic e-auctions for packaging and indirect materials.',
    background: 'Standardized corrugated packaging and cartons ready for competitive multi-vendor bidding.',
    objective: 'Discover real-time market prices without technical specification compromise.',
    finding: 'Gross opportunity of ₹1.440 Cr yields ₹1.352 Cr net modelled opportunity across 12 qualified categories.',
    evidence: 'Market vendor density analysis across 12 qualified commodity packaging categories.',
    outcome: 'Net modelled opportunity of ₹1.352 Cr identified for dynamic reverse e-auction validation.',
    recommendedAction: 'Schedule Wave 2 multi-round reverse e-auctions for corrugated boxes and cartons.',
    nextStep: 'Onboard vetted regional packaging converters to the Procucev e-auction portal.',
    detailCards: []
  },
  {
    groupId: '07',
    groupNumber: '07',
    title: 'Module 3: PCBI Independent Market Benchmarks',
    slideRange: 'Slide 10',
    summary: 'Status: Research Closed — No Operational Benchmark Data Available (0% coverage, ₹0 savings).',
    background: 'Commodity indices and trade data evaluated for Borosil specialty chemical SKUs.',
    objective: 'Protect client trust through empirical pricing integrity and zero synthetic data extrapolation.',
    finding: 'Module 3 research closed: 0% coverage and ₹0 savings to prevent ungrounded claims.',
    evidence: 'PCBI data lab audit confirms 0.00% operational coverage for assessment timeline.',
    outcome: 'Status: Research Closed — No Operational Benchmark Data Available.',
    recommendedAction: 'Rely strictly on proven internal baseline rate dispersion and e-auction price discovery.',
    nextStep: 'Maintain research records in the PCBI commodity registry for future monitoring.',
    detailCards: []
  },
  {
    groupId: '08',
    groupNumber: '08',
    title: 'Module 4: Savings Realization Governance & Execution',
    slideRange: 'Slides 11–15',
    summary: 'Value governance framework, execution roadmap, and audit provenance attestation.',
    background: 'Four-stage value governance strictly separating modelled from approved, contracted, and realized savings.',
    objective: 'Ensure zero unrealized claims and provide CFO-grade audit trail for P&L impact.',
    finding: 'Modelled Opportunity Excluding Lever 2: ₹75.121 Cr; proposed Year 1 sourcing target of ₹12.90 Cr (Client-Approved: ₹0, Realized: ₹0).',
    evidence: 'Reconciliation: L1 (₹73.769 Cr) + L3 (₹1.352 Cr) = ₹75.121 Cr modelled opportunity identified for commercial validation (L2 ₹11.978 Cr in governance reserve). Zero variance.',
    outcome: 'Clear operational roadmap across Wave 1 (Direct), Wave 2 (E-Auction), and Wave 3 (Panels).',
    recommendedAction: 'Adopt Procucev Value Governance Charter for downstream savings realization tracking.',
    nextStep: 'Mobilize steering committee and launch Wave 1 commercial RFP tenders.',
    detailCards: []
  }
];
