/**
 * Borosil Alternative Suppliers and Procurement Transformation Levers
 * Authoritative models for Part 4 and Part 5.
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type {
  AlternativeSupplierEvaluationItem,
  ProcurementTransformationLeverItem
} from '../types/borosilCommercialScenarios';

export const BOROSIL_ALTERNATIVE_SUPPLIERS: AlternativeSupplierEvaluationItem[] = [
  {
    materialCategory: 'Dense Soda Ash (Active)',
    materialDescription: 'Dense Soda Ash (Na2CO3 >= 99.2%) for specialty glass melting furnace',
    currentSupplier: 'GHCL Limited (Active SAP Vendor 703717)',
    potentialAlternative: 'GHCL Limited (Sutrapada, Gujarat)',
    entityClassification: 'PRIMARY_PRODUCER',
    qualificationStatus: 'EXISTING_APPROVED_HISTORICAL',
    qualificationStatusLabel: 'Existing Approved Primary Manufacturer',
    geographicProximity: 'Sutrapada / Dahej, Gujarat (<120 km from Bharuch Plant 1120)',
    capacityDeliveryCapability: 'High (>1.1M MT/year total capacity; bulk pneumatic tankers)',
    qualityCertifications: 'ISO 9001:2015, ISO 14001, OHSAS 18001, furnace certified',
    indicativeCompetitiveness: 'Active direct supplier (6 PO lines, ₹58.117 Cr, 19,600 MT, WAP ₹29,652/MT)',
    commercialPaymentTerms: 'Existing contract terms; target formula-based pricing pegging',
    supplyContinuityRisk: 'LOW',
    evaluationRecommendation: 'Retain as core manufacturer; negotiate annual volume contract tied to ex-works index.'
  },
  {
    materialCategory: 'Printed Inner Cartons (Active)',
    materialDescription: 'Inner packaging boxes and protective cartons for consumer glassware',
    currentSupplier: 'Parksons Packaging Ltd (Active SAP Vendor 1901090)',
    potentialAlternative: 'Parksons Packaging Ltd (Plant 6101 Supplier)',
    entityClassification: 'CONVERTER',
    qualificationStatus: 'EXISTING_APPROVED_HISTORICAL',
    qualificationStatusLabel: 'Existing Approved Packaging Converter',
    geographicProximity: 'Regional converting plants with direct supply to Plant 6101',
    capacityDeliveryCapability: 'High (Automated offset printing & carton folding lines)',
    qualityCertifications: 'ISO 9001, FSC Certified paperboard chain of custody',
    indicativeCompetitiveness: 'Active supplier (PO 1005008312, ₹0.027 Cr spend, 28,700 EA)',
    commercialPaymentTerms: 'Standard 45-day commercial terms',
    supplyContinuityRisk: 'LOW',
    evaluationRecommendation: 'Active approved vendor; include in competitive dynamic reverse auctions for larger lots.'
  },
  {
    materialCategory: 'Dense Soda Ash (Candidate)',
    materialDescription: 'Dense Soda Ash primary producer alternative for dual-sourcing',
    currentSupplier: 'GHCL Limited / RSPL Limited (Active Direct Suppliers)',
    potentialAlternative: 'Tata Chemicals Limited (Mithapur, Gujarat)',
    entityClassification: 'PRIMARY_PRODUCER',
    qualificationStatus: 'POTENTIAL_ALTERNATIVE_QUALIFICATION_REQUIRED',
    qualificationStatusLabel: 'Potential Alternative — Qualification Required',
    geographicProximity: 'Mithapur, Gujarat (~450 km rail/road to Bharuch)',
    capacityDeliveryCapability: 'Very High (>1.0M MT/year; dedicated bulk rail siding)',
    qualityCertifications: 'ISO 9001, ISO 14001, REACH compliant chemical grades',
    indicativeCompetitiveness: 'Primary domestic producer; 0 records in Borosil SAP master',
    commercialPaymentTerms: 'Subject to commercial tender and credit evaluation',
    supplyContinuityRisk: 'LOW',
    evaluationRecommendation: 'Potential alternative requiring qualification; conduct furnace melt trial before tender award.'
  },
  {
    materialCategory: 'Dense Soda Ash (Candidate)',
    materialDescription: 'Dense Soda Ash domestic synthetic manufacturer alternative',
    currentSupplier: 'GHCL Limited / RSPL Limited (Active Direct Suppliers)',
    potentialAlternative: 'Nirma Limited (Porbandar / Kalatalav)',
    entityClassification: 'PRIMARY_PRODUCER',
    qualificationStatus: 'POTENTIAL_ALTERNATIVE_QUALIFICATION_REQUIRED',
    qualificationStatusLabel: 'Potential Alternative — Qualification Required',
    geographicProximity: 'Porbandar / Kalatalav, Gujarat (~380 km to Bharuch)',
    capacityDeliveryCapability: 'High (>800,000 MT/year synthetic soda ash production)',
    qualityCertifications: 'ISO 9001:2015, technical grade purity compliance',
    indicativeCompetitiveness: 'Primary domestic producer; 0 records in Borosil SAP master',
    commercialPaymentTerms: 'Subject to commercial tender and credit evaluation',
    supplyContinuityRisk: 'MEDIUM',
    evaluationRecommendation: 'Potential alternative requiring qualification; assess logistics lead time and physical bulk density.'
  },
  {
    materialCategory: 'Industrial MRO & Spares (Candidate)',
    materialDescription: 'Mechanical spares, power tools, safety gear, and plant consumables',
    currentSupplier: '42 Fragmented Local Traders and Stockists',
    potentialAlternative: 'Moglix (Mogli Labs Pvt Ltd)',
    entityClassification: 'DISTRIBUTOR',
    qualificationStatus: 'POTENTIAL_ALTERNATIVE_QUALIFICATION_REQUIRED',
    qualificationStatusLabel: 'Potential Alternative — Qualification Required',
    geographicProximity: 'National distribution fulfillment network with Western regional depots',
    capacityDeliveryCapability: 'High (>500,000 SKUs digital catalog with punch-out ERP integration)',
    qualityCertifications: 'OEM Authorized distribution certifications',
    indicativeCompetitiveness: 'National distributor aggregator; 0 records in Borosil SAP master',
    commercialPaymentTerms: 'Target 60-day monthly consolidated billing',
    supplyContinuityRisk: 'LOW',
    evaluationRecommendation: 'Potential alternative requiring qualification; audit catalog pricing and delivery SLA adherence.'
  },
  {
    materialCategory: 'Industrial Hardware & Tools (Candidate)',
    materialDescription: 'Fasteners, electrical switches, bearings, and maintenance supplies',
    currentSupplier: 'Fragmented Regional Hardware Vendors',
    potentialAlternative: 'Industrybuying (Emart Solutions)',
    entityClassification: 'DISTRIBUTOR',
    qualificationStatus: 'POTENTIAL_ALTERNATIVE_QUALIFICATION_REQUIRED',
    qualificationStatusLabel: 'Potential Alternative — Qualification Required',
    geographicProximity: 'Multi-hub distribution centers across Western and Northern India',
    capacityDeliveryCapability: 'Medium-High (Broad industrial MRO product portfolio)',
    qualityCertifications: 'Manufacturer warranty pass-through compliance',
    indicativeCompetitiveness: 'E-distributor aggregator; 0 records in Borosil SAP master',
    commercialPaymentTerms: 'Subject to trade credit agreement',
    supplyContinuityRisk: 'LOW',
    evaluationRecommendation: 'Potential alternative requiring qualification; evaluate rate cards for high-frequency hardware items.'
  },
  {
    materialCategory: 'Flexible Packaging & Films (Candidate)',
    materialDescription: 'Polyethylene shrink wrap, stretch films, and plastic packaging rolls',
    currentSupplier: 'Local Converting and Extrusion Vendors',
    potentialAlternative: 'Uflex Limited (Packaging Division)',
    entityClassification: 'MANUFACTURER',
    qualificationStatus: 'POTENTIAL_ALTERNATIVE_QUALIFICATION_REQUIRED',
    qualificationStatusLabel: 'Potential Alternative — Qualification Required',
    geographicProximity: 'Major manufacturing units in NCR and Western India corridors',
    capacityDeliveryCapability: 'Very High (World-scale automated film extrusion plants)',
    qualityCertifications: 'ISO 9001, ISO 22000, BRC packaging certifications',
    indicativeCompetitiveness: 'Primary packaging manufacturer; 0 records in Borosil SAP master',
    commercialPaymentTerms: 'Subject to commercial RFQ negotiation',
    supplyContinuityRisk: 'LOW',
    evaluationRecommendation: 'Potential alternative requiring qualification; execute drop test and line compatibility trials.'
  },
  {
    materialCategory: 'Plant Freight & Logistics (Candidate)',
    materialDescription: 'Full truckload (FTL) transport corridors between plants and distribution hubs',
    currentSupplier: 'Fragmented Regional Transporters and Brokers',
    potentialAlternative: 'V-Trans (India) Limited',
    entityClassification: 'DISTRIBUTOR',
    qualificationStatus: 'POTENTIAL_ALTERNATIVE_QUALIFICATION_REQUIRED',
    qualificationStatusLabel: 'Potential Alternative — Qualification Required',
    geographicProximity: 'Extensive branch network with dedicated fleet in Gujarat and Maharashtra',
    capacityDeliveryCapability: 'High (>1,000 GPS-tracked commercial vehicles nationwide)',
    qualityCertifications: 'IBA Approved, ISO 9001 certified logistics operations',
    indicativeCompetitiveness: 'National transport carrier; 0 records in Borosil SAP master',
    commercialPaymentTerms: 'Target 45-day freight credit against audited lorry receipts',
    supplyContinuityRisk: 'LOW',
    evaluationRecommendation: 'Potential alternative requiring qualification; conduct fragile glassware handling audit.'
  }
];

export const BOROSIL_TRANSFORMATION_LEVERS: ProcurementTransformationLeverItem[] = [
  {
    leverIndex: 1,
    leverName: 'Demand Consolidation',
    whatProcucevAnalyzes: 'Aggregate annual purchasing quantities across Bharuch and Jaipur plants to eliminate fragmented lot sizes.',
    proposedIntervention: 'Establish centralized enterprise buying agreements for chemicals, packaging, and indirect consumables.',
    expectedBusinessBenefit: 'Enhanced volume leverage, maximum tier rebate thresholds, and priority supplier allocation.',
    requiredData: 'Annual bill of materials (BOM), quarterly plant production plans, and storage capacities.',
    financialClassification: 'FINANCIAL'
  },
  {
    leverIndex: 2,
    leverName: 'Specification Standardization',
    whatProcucevAnalyzes: 'Identify minor non-functional specification variances (e.g., box grammage, pallet dimensions, film microns).',
    proposedIntervention: 'Harmonize packaging and consumable specifications across all manufacturing divisions to common SKUs.',
    expectedBusinessBenefit: 'Consolidated procurement volumes, lower manufacturing setup charges, and reduced SKU complexity.',
    requiredData: 'Technical product specification sheets, QA tolerance limits, and plant line specifications.',
    financialClassification: 'FINANCIAL'
  },
  {
    leverIndex: 3,
    leverName: 'Make-versus-Buy Analysis',
    whatProcucevAnalyzes: 'Assess captive vs outsourced services including mold maintenance, wooden pallet fabrication, and internal transport.',
    proposedIntervention: 'Benchmark internal full-absorption operating costs against specialized third-party turnkey providers.',
    expectedBusinessBenefit: 'Capex optimization, conversion of fixed maintenance overheads into variable cost per unit.',
    requiredData: 'Internal labor rates, machine downtime logs, capex depreciation, and vendor benchmark proposals.',
    financialClassification: 'FINANCIAL'
  },
  {
    leverIndex: 4,
    leverName: 'Payment Terms Harmonization',
    whatProcucevAnalyzes: 'Audit supplier payment terms across active POs (ranging from advance/15 days to 60 days).',
    proposedIntervention: 'Standardize commercial payment terms to 60 days net across all direct and indirect contracts.',
    expectedBusinessBenefit: 'Significant working capital expansion (up to ₹8–12 Cr cash flow release) without price escalation.',
    requiredData: 'Supplier master payment terms, historical accounts payable aging, and vendor credit ratings.',
    financialClassification: 'WORKING_CAPITAL_PROCESS'
  },
  {
    leverIndex: 5,
    leverName: 'Freight and Logistics Optimization',
    whatProcucevAnalyzes: 'Compare ex-works versus FOR delivered purchase orders for heavy minerals, chemicals, and corrugated boxes.',
    proposedIntervention: 'Consolidate plant inbound logistics under competitive third-party logistics (3PL) contracts where advantageous.',
    expectedBusinessBenefit: 'Elimination of hidden supplier freight markups and route optimization for multi-plant pickups.',
    requiredData: 'Inbound freight manifests, weighbridge slips, vehicle utilization rates, and transit lead times.',
    financialClassification: 'FINANCIAL'
  },
  {
    leverIndex: 6,
    leverName: 'Purchase Order Consolidation',
    whatProcucevAnalyzes: 'Analyze high PO transaction frequency with small invoice values (<₹25,000) across maintenance and consumables.',
    proposedIntervention: 'Transition from ad-hoc spot POs to blanket purchase orders and scheduled monthly delivery releases.',
    expectedBusinessBenefit: 'Up to 35% reduction in procurement administrative processing costs and improved delivery adherence.',
    requiredData: 'ERP PO generation frequency, line item counts, administrative approval workflow records.',
    financialClassification: 'NON_FINANCIAL'
  },
  {
    leverIndex: 7,
    leverName: 'Inventory and Procurement Planning',
    whatProcucevAnalyzes: 'Assess plant safety stock buffers, reorder triggers, and dead inventory across engineering and raw material stores.',
    proposedIntervention: 'Implement Vendor Managed Inventory (VMI) and consignment stock agreements for critical spare parts.',
    expectedBusinessBenefit: 'Working capital reduction, elimination of production stock-outs, and reduced warehouse footprint.',
    requiredData: 'Monthly consumption trends, lead times, minimum order quantities (MOQ), and holding costs.',
    financialClassification: 'WORKING_CAPITAL_PROCESS'
  },
  {
    leverIndex: 8,
    leverName: 'Contract & Rate-Card Management',
    whatProcucevAnalyzes: 'Identify spend occurring off-contract on spot purchase orders without formal master framework agreements.',
    proposedIntervention: 'Implement mandatory digital master rate cards in SAP with automated tolerance lock mechanisms.',
    expectedBusinessBenefit: 'Zero maverick spend leakage, guaranteed contract compliance, and automated price verification.',
    requiredData: 'Current active vendor agreements, ERP pricing condition records, and spot invoice audit trails.',
    financialClassification: 'FINANCIAL'
  },
  {
    leverIndex: 9,
    leverName: 'Supplier Performance Management',
    whatProcucevAnalyzes: 'Track vendor delivery reliability (OTIF), rejection rates, invoice dispute frequency, and technical support.',
    proposedIntervention: 'Deploy quarterly supplier scorecards with structured reward/remedy mechanisms linked to tender allocation.',
    expectedBusinessBenefit: 'Direct reduction in plant rejection downtime, superior delivery punctuality, and strategic supplier alignment.',
    requiredData: 'Goods receipt inspection logs, delivery date vs promise date timestamps, and credit note history.',
    financialClassification: 'NON_FINANCIAL'
  },
  {
    leverIndex: 10,
    leverName: 'Tail-Spend Management',
    whatProcucevAnalyzes: 'Evaluate the long-tail vendor base (bottom 20% of spend dispersed across >1,000 ad-hoc suppliers).',
    proposedIntervention: 'Implement digital tail-spend management platform / curated marketplace with pre-negotiated catalogs.',
    expectedBusinessBenefit: 'Drastic supplier base reduction (from 1,537 to <600 active accounts) and lower vendor master maintenance cost.',
    requiredData: 'Vendor master active status, one-time vendor transactions, and indirect catalog categories.',
    financialClassification: 'NON_FINANCIAL'
  }
];
