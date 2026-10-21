/**
 * Module 2 — Ten Strategic Sourcing Levers Overview Constants
 * Compliant with Rule 8, 9, strict type isolation and barrel exports
 */

import type { LeverOverviewItem } from '../types/module2Components';

export const TEN_LEVERS_OVERVIEW_CONFIG: LeverOverviewItem[] = [
  {
    id: 1,
    code: 'LEV-01',
    name: 'Direct Price Improvement',
    purpose: 'Identifies historical purchase rate disparities and unit price dispersion across facilities and purchase orders for identical materials, establishing lowest achieved historical unit rate as benchmark.',
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'IMPLEMENTED & AUDITED',
    historicalOpportunityCr: null, // Populated dynamically from calculation engine
    validatedSavingsCr: 0.00,
    methodologySummary: 'Annual lowest comparable historical unit price methodology grouped by FY, clean material code, UOM, and currency. Arithmetically reconciled against underlying transactions.',
    requiredFields: ['material_code', 'uom', 'currency', 'unit_price', 'quantity', 'po_date', 'po_number', 'vendor_code'],
    preconditions: ['Clean material code matching', 'Identical UOM & currency', 'Supplier quote verification', 'Contractual price amendment']
  },
  {
    id: 2,
    code: 'LEV-02',
    name: 'E-Auction / Dynamic Bidding',
    purpose: 'Introduces real-time competitive market tension through reverse electronic bidding and dynamic lot auctions across pre-qualified suppliers for liquid spend categories.',
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'IMPLEMENTED & AUDITED',
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: 'Evaluates repeat purchases, multi-supplier history, and price dispersion across SAP purchase history to identify candidate categories and materials for competitive dynamic bidding.',
    requiredFields: ['spend_category', 'material_code', 'total_spend_inr', 'po_number', 'vendor_code'],
    preconditions: ['Supplier auction participation agreement', 'Specification comparability review', 'Binding electronic bid confirmation']
  },
  {
    id: 3,
    code: 'LEV-03',
    name: 'Vendor Base Consolidation',
    purpose: 'Consolidates fractured vendor tail-spend within material categories to primary strategic suppliers to eliminate administrative overhead and capture volume tier discounts.',
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'IMPLEMENTED & AUDITED',
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: 'Evaluates supplier count per category, supplier shift capacity (<= 30% reallocation limit), and verified lower unit price.',
    requiredFields: ['vendor_code', 'vendor_name', 'spend_category', 'material_code', 'unit_price', 'quantity'],
    preconditions: ['Supplier capacity audit', 'Supply continuity approval', 'Quality certification for target supplier']
  },

  {
    id: 4,
    code: 'LEV-04',
    name: 'Volume Aggregation',
    purpose: 'Aggregates fragmented purchasing volume across business units, regional hubs, and operational quarters into institutional procurement lots.',
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'IMPLEMENTED & AUDITED',
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: 'Multi-facility volume aggregation modeling with strict separation of Tier 1 Identical, Tier 2 Comparable, and Tier 3 Category opportunities.',
    requiredFields: ['plant', 'division', 'material_code', 'quantity', 'uom', 'total_spend_inr'],
    preconditions: ['Documented technical validation for Tier 2', 'Verified density for cross-dimensional UOM', 'Inter-plant logistics harmonization']
  },
  {
    id: 5,
    code: 'LEV-05',
    name: 'Payment Terms Optimisation',
    purpose: 'Harmonizes disparate credit terms and payment windows across suppliers to improve operating working capital and capture early-payment cash discounts.',
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'IMPLEMENTED & AUDITED',
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: 'Procucev standard 1.5% linear financing rate per 30 days of credit extension and working capital modeling. Strict data availability transparency and segregation.',
    requiredFields: ['payment_terms', 'vendor_code', 'vendor_name', 'total_spend_inr', 'po_number', 'po_date'],
    preconditions: ['Verified source ERP payment terms extract', 'Approved commercial credit extension scenario']
  },
  {
    id: 6,
    code: 'LEV-06',
    name: 'Category Specialisation',
    purpose: 'Identifies procurement categories requiring specialised category management, models 10 planning opportunity heads, and prioritises procurement resourcing.',
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'IMPLEMENTED & AUDITED',
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: 'Multi-dimensional category assessment (Priority A/B/C), 10 opportunity head assumptions, resource planning, and mandatory cross-lever deduplication controls.',
    requiredFields: ['spend_category', 'vendor_name', 'material_desc', 'total_spend_inr', 'plant', 'po_number'],
    preconditions: ['Documented category governance charter', 'Authorised planning assumptions', 'Cross-lever deduplication review']
  },
  {
    id: 7,
    code: 'LEV-07',
    name: 'Logistics & Packaging Specifications',
    purpose: 'Optimizes consignment shipping routes, freight consolidation, palletization standards, and container utilization to reduce inbound landed logistics costs. Deferred pending benchmark prices and supporting data.',
    implementationStatus: 'COMING_SOON',
    statusLabel: 'COMING SOON',
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: 'Analyzes freight-to-value ratios, secondary packaging unitization, and multi-drop transport logistics optimization. Benchmark prices and supporting data are not currently available.',
    requiredFields: ['freight_cost', 'shipping_mode', 'incoterms', 'packaging_spec', 'container_fill_pct'],
    preconditions: ['Logistics carrier contract rate sheets', 'Standardized packaging dimension approvals']
  },
  {
    id: 8,
    code: 'LEV-08',
    name: 'Specification Rationalisation',
    purpose: 'Identifies potentially duplicate, redundant, non-standard, or unnecessarily varied material specifications across facilities and routes candidates for authorised technical review.',
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'IMPLEMENTED (PHASE 1)',
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: 'Staged description normalisation, technical attribute extraction (dimensions, grades, ratings), attribute comparison matrix with critical vs non-critical flags, and authorised technical review workflows. Financial savings deferred to Phase 2.',
    requiredFields: ['material_code', 'material_desc', 'spend_category', 'plant', 'quantity', 'total_spend_inr'],
    preconditions: ['Authorised technical review & engineering sign-off', 'Inter-plant specification harmonisation approval', 'No automated commercial assumptions in Phase 1']
  },
  {
    id: 9,
    code: 'LEV-09',
    name: 'Procurement Compliance & Control',
    purpose: 'Identifies potential procurement-control gaps, transaction anomalies, price inconsistencies, and purchasing exceptions from available customer data without falsely claiming contractual violations or realised savings.',
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'IMPLEMENTED (CONTROL & AUDIT)',
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: 'Defensible transaction auditing, price inconsistency detection across identical items/UOM, deterministic duplicate transaction matching, and formal review workflows. Contract-document integration deferred.',
    requiredFields: ['po_number', 'vendor_name', 'material_code', 'material_desc', 'quantity', 'total_spend_inr'],
    preconditions: ['Deterministic data matching validation', 'Authorised audit review & governance sign-off', 'No assumed contractual breaches']
  },
  {
    id: 10,
    code: 'LEV-10',
    name: 'New-Vendor Development & Alternate Sourcing',
    purpose: 'Discovers potential alternate suppliers across 600,000+ national vendor repository based on category mapping and Option C geographic filtering for single-sourced and critical materials, maintaining strict separation between vendor discovery and qualification.',
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'IMPLEMENTED (VENDOR DISCOVERY)',
    historicalOpportunityCr: null,
    validatedSavingsCr: 0.00,
    methodologySummary: 'Algorithmic category and geographic matching against 600,000+ vendor records, single-source dependency risk identification, and conservative entity deduplication. Commercial savings and technical qualification deferred.',
    requiredFields: ['material_code', 'spend_category', 'customer_plant', 'current_supplier_count', 'relevant_spend_inr'],
    preconditions: ['Category taxonomy alignment', 'Deterministic customer supplier exclusion', 'Administrative location mapping']
  }
];
