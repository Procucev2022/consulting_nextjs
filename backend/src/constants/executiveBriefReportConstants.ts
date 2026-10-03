/**
 * Executive Brief Report Constants
 * Constant definitions for slide groups, traceability lineage, and audit artifacts.
 */

import { BRIEF_FINDING_CARDS } from './executiveBriefConstants';
import type {
  ExecutiveBriefSlideGroup,
  ExecutiveBriefTraceabilityItem,
  ExecutiveBriefArtifactItem
} from '../types/executiveBriefExportTypes';

export const BRIEF_SLIDE_GROUPS: ExecutiveBriefSlideGroup[] = [
  {
    groupId: '01',
    groupNumber: '01',
    title: 'Executive Overview',
    slideRange: 'Slides 01–02',
    summary: 'Strategic summary of procurement diagnostic, baseline spend, and defensible savings potential.',
    background: 'Multi-year procurement history evaluated across 24 plants, clinker units, and terminals.',
    objective: 'Establish definitive C-suite alignment on spend baseline, opportunity envelope, and governance.',
    finding: 'Total addressable spend of ₹4,931 Cr yields ₹412 Cr gross potential and ₹143 Cr approved savings.',
    evidence: '31,671 verified transaction records across 1,482 suppliers reconciled with zero variance.',
    outcome: 'Defensible 4-wave implementation roadmap targeting verified P&L EBITDA expansion.',
    recommendedAction: 'Form Joint Executive Steering Committee and authorize Wave 1 execution charter.',
    nextStep: 'Mobilize dedicated Procucev Category Specialists for immediate Wave 1 tender execution.',
    detailCards: BRIEF_FINDING_CARDS.slice(0, 1)
  },
  {
    groupId: '02',
    groupNumber: '02',
    title: 'Procucev & Client Context',
    slideRange: 'Slides 03–06',
    summary: 'Procucev analytical capability, sector expertise, and operating footprint understanding.',
    background: 'Comprehensive alignment with corporate operating scale (152.7 MTPA operating capacity).',
    objective: 'Benchmark national volume scale against category-specific procurement practices.',
    finding: 'Regional decentralization causes procurement friction, vendor sprawl, and rate variation.',
    evidence: 'Public statutory filings, investor presentations, and audited annual report operational metrics.',
    outcome: 'Tailored category sourcing architecture mapped directly to manufacturing clusters.',
    recommendedAction: 'Harmonize commercial terms, standard contract templates, and master vendor panels.',
    nextStep: 'Finalize multi-plant master framework agreements for high-consumption consumables.',
    detailCards: []
  },
  {
    groupId: '03',
    groupNumber: '03',
    title: 'Module 1: Spend Diagnostic',
    slideRange: 'Slides 07–13',
    summary: 'Forensic baseline across 31,671 transactions, Pareto distribution, and inter-plant rate dispersion.',
    background: 'Consolidated purchase ledger spanning FY22–FY25 across 6 regional operating clusters.',
    objective: 'Establish definitive spend baseline, addressable base, and inter-plant rate creep.',
    finding: '340 standardized repeat items show 18.5% average inter-plant price spread across plants.',
    evidence: 'Granular PO-level ex-works unit rates normalized for regional logistics and tax differentials.',
    outcome: 'Identified direct rate harmonization opportunity anchored strictly in addressable spend base.',
    recommendedAction: 'Enforce mandatory corporate rate cards with indexed logistics adders across all plants.',
    nextStep: 'Issue centralized contract amendments and transition fragmented spend into master panels.',
    detailCards: BRIEF_FINDING_CARDS.slice(0, 1)
  },
  {
    groupId: '04',
    groupNumber: '04',
    title: 'Module 2: Strategic Sourcing',
    slideRange: 'Slides 14–19',
    summary: 'Multi-lever analysis: vendor consolidation, PO productivity, competitive RFQs, e-auctions, and risk mitigation.',
    background: 'Comprehensive assessment of vendor fragmentation, contract mechanisms, and market liquidity.',
    objective: 'Apply disciplined category-specific sourcing levers with explicit modelling assumptions.',
    finding: 'Vendor consolidation (5% volume discount assumption), 20% PO effort reduction, and targeted e-auctions unlock value.',
    evidence: 'Complete vendor master audit, market supplier indexes, and historical tender spreads.',
    outcome: 'Balanced sourcing strategy where e-auction is evaluated as one execution lever, not sole savings source.',
    recommendedAction: 'Execute vendor consolidation waves and launch competitive RFQs/auctions on qualified categories.',
    nextStep: 'Finalize master distributor framework contracts and publish competitive bidding rulebooks.',
    detailCards: [BRIEF_FINDING_CARDS[1], BRIEF_FINDING_CARDS[2], BRIEF_FINDING_CARDS[4]]
  },
  {
    groupId: '05',
    groupNumber: '05',
    title: 'Module 3: PCBI Benchmarking',
    slideRange: 'Slides 20–22',
    summary: 'Independent commodity intelligence against Procucev Commodity Benchmark Index (PCBI) and price trends.',
    background: 'Core commodity index tracking petcoke, PP resin, imported thermal coal, and steel.',
    objective: 'Benchmark landed contract rates independently of sourcing mechanisms and capture market timing.',
    finding: 'Imported petcoke and PP resin show 6.28% and 7.41% variance against PCBI benchmarks.',
    evidence: 'PCBI Grade A+ independent global landed indices and port customs shipment records.',
    outcome: 'Market-linked pricing formulas insulating client from non-market commodity markups.',
    recommendedAction: 'Structure formula-based contracts pegged to monthly PCBI market index movements.',
    nextStep: 'Renegotiate petcoke import contracts with index-linked price adjustment corridors.',
    detailCards: [BRIEF_FINDING_CARDS[3]]
  },
  {
    groupId: '06',
    groupNumber: '06',
    title: 'Module 4: Savings Execution',
    slideRange: 'Slides 23–24',
    summary: 'Consolidated savings waterfall, multi-lever deduplication, and P&L realization tracking.',
    background: 'Multi-lever overlap analysis removing mutual cannibalization between price and volume levers.',
    objective: 'Deliver an audited, board-defensible savings total separating hard savings, avoidance, and productivity.',
    finding: 'Gross opportunity deduplicated with overlap groups; hard savings separated from soft productivity benefits.',
    evidence: 'Mathematical overlap matrices, double-counting filters, and category leader approvals.',
    outcome: 'Audited EBITDA expansion pathway with verified P&L cash flow milestones.',
    recommendedAction: 'Implement real-time invoice matching against negotiated contract rates in ERP.',
    nextStep: 'Track monthly realized savings ledger with finance sign-off on invoice credit notes.',
    detailCards: []
  },
  {
    groupId: '07',
    groupNumber: '07',
    title: 'Recommendations & Roadmap',
    slideRange: 'Slides 25–29',
    summary: 'Execution roadmap across 4 phased waves, risk mitigation, and executive governance.',
    background: 'Turnkey procurement transformation plan structured across 180 operating days.',
    objective: 'Sequence sourcing waves to capture rapid high-confidence savings while minimizing plant risk.',
    finding: 'Wave 1 (Days 1–45) captures 58% of approved savings with zero plant operational disruption.',
    evidence: 'Category readiness scoring, supplier contract expiration schedules, and inventory buffer audits.',
    outcome: 'Smooth execution transition supported by Procucev on-site sourcing engineering pods.',
    recommendedAction: 'Authorize Wave 1 procurement charters across packaging, petcoke, and plant hardware.',
    nextStep: 'Convene weekly joint execution standups with plant procurement directors.',
    detailCards: []
  },
  {
    groupId: '08',
    groupNumber: '08',
    title: 'Evidence & Audit',
    slideRange: 'Slide 30',
    summary: 'Complete mathematical proofs, transaction provenance, checksums, and audit artifacts.',
    background: 'End-to-end cryptographic and forensic chain of custody for all diagnostic calculations.',
    objective: 'Provide full transparent lineage from individual ERP invoice to board executive KPI.',
    finding: '100% reconciliation achieved across all 4 modules with ₹0.00 mathematical variance.',
    evidence: 'SHA-256 checksums, immutable audit ledgers, and forensic validation report.',
    outcome: 'Unassailable external audit defense and institutional stakeholder confidence.',
    recommendedAction: 'Archive certified audit package in enterprise governance and compliance portal.',
    nextStep: 'Enable continuous audit synchronization for subsequent quarterly reporting cycles.',
    detailCards: []
  }
];

export const BRIEF_TRACEABILITY_LINEAGE: ExecutiveBriefTraceabilityItem[] = [
  {
    findingId: 'FIND-01',
    module: 'Module 1',
    category: 'Grinding Media & Mill Consumables',
    item: 'High Chrome Alloy Grinding Balls 60mm',
    supplier: 'AIA Engineering Ltd',
    erpRecord: 'PO-2024-88419 (Bhilwara Plant)',
    calculation: 'Rate Dispersion: ₹142.50/kg vs Median ₹128.20/kg (+11.1%)',
    opportunity: 'Inter-plant corporate rate harmonization',
    savings: '₹24.60 Cr Approved'
  },
  {
    findingId: 'FIND-02',
    module: 'Module 1',
    category: 'Industrial Plant Hardware & MRO',
    item: 'Standardized SS Flanges & Industrial Fasteners',
    supplier: 'Regional Industrial Spares Corp (912 tail vendors)',
    erpRecord: 'PO-2024-31044 (Rajashree Cement Works)',
    calculation: 'Tail fragmentation discount penalty: 18.2% vs national master panel',
    opportunity: 'Consolidation of 912 tail vendors to 4 master distributors',
    savings: '₹47.20 Cr Approved'
  },
  {
    findingId: 'FIND-03',
    module: 'Module 2',
    category: 'Packaging Materials',
    item: '50kg HDPE / PP Laminated Woven Sacks',
    supplier: 'Multiple Regional Fabricators (14 suppliers)',
    erpRecord: 'PO-2024-77102 (Aditya Cement)',
    calculation: 'Dynamic multi-round English reverse auction spread: 16.2%',
    opportunity: 'Structured electronic reverse auction with dynamic bidding',
    savings: '₹36.00 Cr Approved'
  },
  {
    findingId: 'FIND-04',
    module: 'Module 3',
    category: 'Solid Energy Fuels',
    item: 'Imported Petroleum Coke (6.5% Max Sulfur, 8200 GCV)',
    supplier: 'Global Commodity Trading Houses (Port Landed)',
    erpRecord: 'PO-2024-19208 (Gujarat Grinding Unit)',
    calculation: 'Customer landed ₹13,850/MT vs PCBI Index ₹12,980/MT (-6.28%)',
    opportunity: 'Formula-based indexing tied to PCBI global landed index',
    savings: '₹35.20 Cr Defensible'
  }
];

export const BRIEF_REPORT_ARTIFACTS: ExecutiveBriefArtifactItem[] = [
  {
    name: 'Executive Brief Audit',
    filename: 'EXECUTIVE_BRIEF_AUDIT.md',
    description: 'Forensic audit trail of spend baseline, methodology, and numerical reconciliations.',
    endpoint: '/api/reports/executive-brief/audit'
  },
  {
    name: 'Executive Brief Validation Report',
    filename: 'EXECUTIVE_BRIEF_VALIDATION_REPORT.md',
    description: '30-slide structural completeness, chart inventory, and gate verification sign-off.',
    endpoint: '/api/reports/executive-brief/report?format=validation'
  },
  {
    name: 'Executive Brief JSON Data',
    filename: 'EXECUTIVE_BRIEF_REPORT.json',
    description: 'Structured machine-readable report metadata and certified financial metrics.',
    endpoint: '/api/reports/executive-brief/report'
  },
  {
    name: 'Official Executive Report (PDF)',
    filename: 'EXECUTIVE_BRIEF.pdf',
    description: 'High-definition 30-slide 16:9 board presentation deliverable.',
    endpoint: '/api/reports/executive-brief/download/pdf'
  },
  {
    name: 'Editable Executive Presentation (PPTX)',
    filename: 'EXECUTIVE_BRIEF.pptx',
    description: 'Fully editable PowerPoint presentation with identical certified data.',
    endpoint: '/api/reports/executive-brief/download/pptx'
  }
];
