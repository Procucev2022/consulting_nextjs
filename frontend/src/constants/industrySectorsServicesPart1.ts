import type { IndustryMaterialProfile } from '../types/industry';

export const INDUSTRY_SECTORS_SERVICES_PART1: IndustryMaterialProfile[] = [
  {
    majorSector: 'IT, Software & Cloud Services',
    minorSector: 'Enterprise Software & SaaS Subscriptions',
    sectorCode: 'IT-SAAS',
    tagline: 'Enterprise Software, Multi-Tenant SaaS Platforms, API Subscriptions & Workloads',
    description:
      'Procurement of mission-critical enterprise resource planning (ERP), customer relationship management (CRM), collaborative software, and developer tools.',
    typicalDirectMaterials: [
      'Enterprise Core ERP & HCM Subscription Licenses',
      'Customer Relationship Management (CRM) Seats',
      'API Gateway & Microservices Platform Licenses',
      'Cybersecurity Endpoint & SIEM Monitoring Subscriptions',
      'Relational & NoSQL Database Licensing'
    ],
    typicalPackagingMaterials: [
      'Digital Entitlement Keys & Token Certificates',
      'Hardware Security Module (HSM) Cryptographic Tokens',
      'Hardware Dongles & Authentication Fobs'
    ],
    typicalLogisticsCategories: [
      'Dedicated Cloud Interconnect & MPLS Network Circuits',
      'Content Delivery Network (CDN) Edge Egress Bandwidth',
      'Emergency Hardware Appliance Courier Transit'
    ],
    typicalMroCategories: [
      'Workstation Monitors, Docks & Ergonomic Mounts',
      'High-Speed Cat6A & Fiber Optic Patch Leads',
      'Uninterruptible Power Supply (UPS) Replacement Batteries'
    ],
    characteristicUNSPSCPrefixes: ['43', '81', '80'],
    benchmarkSpendSplit: {
      directPct: 68,
      packagingPct: 2,
      logisticsPct: 18,
      mroPct: 12
    },
    categorizationGuidance:
      'Core enterprise software subscriptions and SaaS seat licenses are classified as direct operational technology spend.',
    keyKeywords: ['software', 'saas', 'license', 'subscription', 'cloud', 'database', 'cybersecurity', 'crm', 'erp']
  },
  {
    majorSector: 'IT, Software & Cloud Services',
    minorSector: 'Cloud Infrastructure & Hosting (IaaS/PaaS)',
    sectorCode: 'IT-CLOUD',
    tagline: 'Scalable Compute Instances, Managed Kubernetes, Object Storage & Cloud Data Centers',
    description:
      'Hyperscale public and private cloud environments (AWS, Azure, GCP), data center colocation, server hosting, and edge computing nodes.',
    typicalDirectMaterials: [
      'Elastic Compute Instances & Virtual Machines',
      'Scalable Block & Object Storage Volumes (S3/Blob)',
      'Serverless Function Computes & Container Registries',
      'Managed Kubernetes Cluster Nodes',
      'Big Data Analytics & Data Warehousing Capacity'
    ],
    typicalPackagingMaterials: [
      'Data Center Server Rack Mount Chassis Kits',
      'Hot-Aisle Containment Baffle Panels',
      'Anti-Static Component Storage Totes'
    ],
    typicalLogisticsCategories: [
      'Direct Connect & ExpressRoute Dedicated Bandwidth',
      'Global WAN Peering & Data Transit Services',
      'Physical Data Transfer Appliance Shipping (Snowball)'
    ],
    typicalMroCategories: [
      'Server Hot-Swap Redundant Power Supplies',
      'High-Flow Server Rack Cooling Fans & Filters',
      'Optical SFP+ Transceiver Modules & Fiber Cleaners'
    ],
    characteristicUNSPSCPrefixes: ['43', '81', '39'],
    benchmarkSpendSplit: {
      directPct: 72,
      packagingPct: 2,
      logisticsPct: 16,
      mroPct: 10
    },
    categorizationGuidance:
      'Virtual compute capacity, object storage tiers, and cloud egress bandwidth are evaluated as core direct tech infrastructure.',
    keyKeywords: ['cloud', 'compute', 'storage', 'aws', 'azure', 'hosting', 'server', 'datacenter', 'kubernetes', 'instance']
  },
  {
    majorSector: 'Professional, Legal & Consulting Services',
    minorSector: 'Strategic & Management Consulting',
    sectorCode: 'PROF-CONS',
    tagline: 'Strategy Advisory, Operational Transformation, Due Diligence & Executive Counsel',
    description:
      'High-impact corporate advisory, mergers & acquisitions due diligence, digital transformation, and organizational redesign services.',
    typicalDirectMaterials: [
      'Strategy Transformation Retainer Agreements',
      'Operational Efficiency & Lean Six Sigma Engagements',
      'Commercial Due Diligence & Valuation Studies',
      'Executive Leadership Coaching & Talent Roadmaps',
      'Enterprise Risk Management Diagnostic Audits'
    ],
    typicalPackagingMaterials: [
      'Custom Hardbound Executive Presentation Folios',
      'Secure Client Portal Deliverable Repositories',
      'Corporate Workshop Materials & Case Folios'
    ],
    typicalLogisticsCategories: [
      'Partner & Consultant Domestic Air Travel',
      'Executive Accommodations & Corporate Hotels',
      'Client On-Site Facilitation Courier Services'
    ],
    typicalMroCategories: [
      'High-Yield Executive Office Paper & Toner',
      'Video Collaboration Software Subscriptions',
      'Ergonomic Executive Seating & Office Furniture'
    ],
    characteristicUNSPSCPrefixes: ['80', '84', '86'],
    benchmarkSpendSplit: {
      directPct: 74,
      packagingPct: 2,
      logisticsPct: 18,
      mroPct: 6
    },
    categorizationGuidance:
      'Consulting statements of work (SOW), partner billing rates, and diagnostic deliverables are classified as direct professional services.',
    keyKeywords: ['consulting', 'advisory', 'strategy', 'transformation', 'study', 'due diligence', 'roadmap', 'audit']
  },
  {
    majorSector: 'Professional, Legal & Consulting Services',
    minorSector: 'Corporate Legal & Regulatory Counsel',
    sectorCode: 'PROF-LEGAL',
    tagline: 'Litigation Counsel, Patent Filings, Regulatory Compliance & Contract Arbitrations',
    description:
      'Retained corporate law firms, intellectual property patent prosecution, antitrust compliance, and cross-border commercial dispute counsel.',
    typicalDirectMaterials: [
      'Outside Corporate Legal Counsel Retainers',
      'Patent Preparation & Trademark Prosecution Fees',
      'Regulatory Compliance Review & Filings',
      'Commercial Contract Arbitration & Litigation Support',
      'e-Discovery Document Review Platforms'
    ],
    typicalPackagingMaterials: [
      'Notarized Legal Deed Envelopes & Document Seals',
      'Tamper-Evident Court Deposition Evidence Boxes',
      'Archival Acid-Free Legal Document Folders'
    ],
    typicalLogisticsCategories: [
      'Same-Day Legal Courier & Process Server Transit',
      'Certified Legal Mail & Diplomatic Pouch Shipping',
      'Court Hearing Witness & Attorney Travel'
    ],
    typicalMroCategories: [
      'Legal Citation Research Database Subscriptions',
      'High-Speed Document Scanners & Stamp Printers',
      'Encrypted Shredding & Document Destruction Consumables'
    ],
    characteristicUNSPSCPrefixes: ['80', '84', '44'],
    benchmarkSpendSplit: {
      directPct: 78,
      packagingPct: 2,
      logisticsPct: 12,
      mroPct: 8
    },
    categorizationGuidance:
      'External counsel fees, patent filings, and legal retainers are mapped to core corporate governance direct services.',
    keyKeywords: ['legal', 'attorney', 'counsel', 'litigation', 'patent', 'trademark', 'compliance', 'arbitration', 'law firm']
  },
  {
    majorSector: 'Banking, Financial Services & Insurance (BFSI)',
    minorSector: 'Payment Processing & Merchant Gateways',
    sectorCode: 'BFSI-PAY',
    tagline: 'Payment Interchange, Credit Card Acquiring, Settlement Rails & FinTech Platforms',
    description:
      'Electronic funds transfer, card scheme interchange, payment gateway integration, fraud scoring, and multi-currency merchant clearing.',
    typicalDirectMaterials: [
      'Credit & Debit Card Scheme Interchange Fees',
      'Payment Gateway Transaction Processing Fees',
      'Real-Time Fraud Prevention & Risk Scoring Feeds',
      'Multi-Currency FX Settlement Margins',
      'Cardholder KYC & AML Sanction Screening Services'
    ],
    typicalPackagingMaterials: [
      'Security-Sealed Chip Card Mailing Envelopes',
      'Tamper-Proof Banking Token Retail Blister Packs',
      'Merchant POS Terminal Shipping Cartons'
    ],
    typicalLogisticsCategories: [
      'Armored Carrier Cash & Asset Transport',
      'Express Secure Courier for Payment Hardware',
      'Dedicated Financial SWIFT Leased Data Lines'
    ],
    typicalMroCategories: [
      'POS Terminal Thermal Receipt Paper Rolls',
      'Contactless NFC Reader Mounting Brackets',
      'Magnetic Stripe Head Cleaning Cards'
    ],
    characteristicUNSPSCPrefixes: ['84', '43', '80'],
    benchmarkSpendSplit: {
      directPct: 76,
      packagingPct: 4,
      logisticsPct: 14,
      mroPct: 6
    },
    categorizationGuidance:
      'Interchange margins, gateway licensing, and settlement services are categorized as direct financial processing expenses.',
    keyKeywords: ['payment', 'processing', 'gateway', 'interchange', 'settlement', 'fintech', 'merchant', 'transaction', 'fraud']
  },
  {
    majorSector: 'Banking, Financial Services & Insurance (BFSI)',
    minorSector: 'Corporate Banking & Treasury Services',
    sectorCode: 'BFSI-TREAS',
    tagline: 'Cash Management, Syndicated Credit Facilities, Hedging & Escrow Operations',
    description:
      'Institutional banking credit lines, foreign exchange hedging contracts, interest rate swaps, escrow management, and liquidity pooling.',
    typicalDirectMaterials: [
      'Syndicated Revolving Credit Facility Commitment Fees',
      'FX Forward & Options Hedging Derivative Contracts',
      'Liquidity Pooling & Automated Sweep Account Fees',
      'Commercial Paper Placement & Underwriting Margins',
      'Treasury Management System (TMS) Maintenance'
    ],
    typicalPackagingMaterials: [
      'Corporate Banking Security Seal Folios',
      'High-Security Safe Deposit Key Containers',
      'Archival Bond Certificate Folders'
    ],
    typicalLogisticsCategories: [
      'Bond Courier & Securities Hand-Delivery Transit',
      'Secure Electronic SWIFT Network Connections',
      'Physical Bank Guarantee Document Delivery'
    ],
    typicalMroCategories: [
      'Financial Market Terminal Feeds (Bloomberg/Refinitiv)',
      'Cheque Encoders & MICR Reader Ribbons',
      'Secured Dual-Control Safe Keypads'
    ],
    characteristicUNSPSCPrefixes: ['84', '80', '43'],
    benchmarkSpendSplit: {
      directPct: 82,
      packagingPct: 1,
      logisticsPct: 10,
      mroPct: 7
    },
    categorizationGuidance:
      'Financing facility fees, derivative hedging premiums, and liquidity pooling tariffs are categorized as direct treasury spend.',
    keyKeywords: ['banking', 'treasury', 'hedging', 'credit line', 'syndicated', 'liquidity', 'fx forward', 'escrow', 'derivative']
  }
];
