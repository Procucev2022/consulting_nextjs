/**
 * Executive Brief Corporate & Geometry Constants
 */

export const EXECUTIVE_BRIEF_VERSION = 'EXECUTIVE_BRIEF_PDF_V1.0';

export const BRIEF_GEOMETRY = {
  PAGE_WIDTH: 960,
  PAGE_HEIGHT: 540,
  MARGIN_X: 40,
  MARGIN_Y: 30,
  CONTENT_WIDTH: 880,
  CONTENT_HEIGHT: 480
} as const;

export const BRIEF_COLORS = {
  PRIMARY_NAVY: '#0F172A',
  CARD_BG_DARK: '#1E293B',
  ACCENT_BLUE: '#2563EB',
  ACCENT_LIGHT_BLUE: '#38BDF8',
  SUCCESS_GREEN: '#10B981',
  WARNING_AMBER: '#F59E0B',
  DANGER_RED: '#EF4444',
  TEXT_LIGHT: '#F8FAFC',
  TEXT_MUTED: '#94A3B8',
  BORDER_COLOR: '#334155',
  BG_SLATE: '#0F172A',
  CARD_BG: '#1E293B'
} as const;

export const PROCUCEV_PROFILE = {
  name: 'Procucev / aiCEV',
  tagline: 'Enterprise Procurement Intelligence & Savings Execution',
  positioning: 'Procurement Domain Expertise + Advanced Analytical Technology + Execution Management',
  methodologyStages: [
    { stage: 'DIAGNOSE', desc: '100% forensic spend visibility & price variance discovery' },
    { stage: 'STRATEGIZE', desc: 'Multi-lever opportunity prioritization & market alignment' },
    { stage: 'SOURCE', desc: 'Dynamic e-auctions, strategic RFPs & vendor rationalization' },
    { stage: 'EXECUTE', desc: 'Downstream implementation, contract lock-in & compliance' },
    { stage: 'REALIZE', desc: 'Audited invoice tracking & realized P&L benefit verification' },
    { stage: 'MONITOR', desc: 'Continuous price creep prevention & supplier governance' }
  ],
  capabilities: [
    'Procurement Spend Forensic Diagnostics',
    'Strategic Sourcing & Category Management',
    'Cross-Plant Price Dispersion Analytics',
    'Electronic Competitive Bidding (E-Auction)',
    'Vendor Base Consolidation & Rationalization',
    'PCBI Independent Commodity Market Benchmarking',
    'Volume Aggregation & Specification Optimization',
    'Commercial Contract Compliance & Price Leakage Audit',
    'Managed Sourcing & Turnkey Execution Services',
    'Sustained Savings Realization & Governance'
  ],
  verifiedSectors: [
    'Cement & Building Materials',
    'Steel & Heavy Metals',
    'Specialty Chemicals & Polymers',
    'Pharmaceuticals & API Manufacturing',
    'Textiles & Industrial Technical Fibers',
    'Automotive Components & Assemblies',
    'Renewable Energy & Solar Equipment',
    'Consumer Durables & Electrical Equipment'
  ],
  contact: {
    website: 'https://procucev.com',
    email: 'executive-brief@procucev.com',
    confidentiality: 'CONFIDENTIAL — Prepared exclusively for client executive leadership'
  }
} as const;

export const DEFAULT_CLIENT_PROFILE = {
  clientName: 'UltraTech Cement Limited',
  group: 'Aditya Birla Group',
  analysisPeriod: 'FY 2021-22 to FY 2024-25 (48 Months)',
  publicFacts: [
    {
      characteristic: 'Market Leadership',
      fact: 'Largest manufacturer of grey cement, Ready Mix Concrete (RMC) and white cement in India',
      source: 'UltraTech Annual Report FY24',
      sourceDate: 'May 2024',
      implication: 'Unmatched national volume scale requires corporate rate harmonization across regions.',
      analyticalQuestion: 'Are identical technical inputs procured at varying prices across manufacturing clusters?'
    },
    {
      characteristic: 'Operating Footprint',
      fact: '24 integrated manufacturing plants, 1 clinkerisation plant, 33 grinding units, and 8 bulk terminals',
      source: 'Investor Presentation Q4 FY24',
      sourceDate: 'April 2024',
      implication: 'Decentralized local plant purchasing creates price creep and fragmented vendor supply.',
      analyticalQuestion: 'How many uncertified local vendors supply standardized mechanical and consumable items?'
    },
    {
      characteristic: 'Production Capacity',
      fact: '152.7 MTPA consolidated operating capacity with target of 200 MTPA by FY27',
      source: 'Investor Presentation Q2 FY25',
      sourceDate: 'October 2024',
      implication: 'Substantial upcoming capex and brownfield expansion demands strategic procurement pooling.',
      analyticalQuestion: 'Can capital equipment and structural steel packages be bundled across expansion sites?'
    },
    {
      characteristic: 'Cost Structure',
      fact: 'Energy, fuel and logistics account for approximately 50–55% of total cement manufacturing expenditure',
      source: 'Audited Financial Results FY24',
      sourceDate: 'April 2024',
      implication: 'Micro-percentage gains in thermal fuel, petcoke, and logistics translate to tens of crores.',
      analyticalQuestion: 'How does contracted petcoke and coal pricing compare against port-landed spot indices?'
    },
    {
      characteristic: 'Sustainability & ESG',
      fact: 'Committed to EP100, RE100, and targeting 60%+ green power and alternate fuel share',
      source: 'Sustainability Report FY24',
      sourceDate: 'June 2024',
      implication: 'Sourcing of alternate fuels (AFR), biomass, and renewable PPAs requires specialized contracts.',
      analyticalQuestion: 'What long-term contracting mechanisms protect against biomass seasonal supply volatility?'
    }
  ]
};
