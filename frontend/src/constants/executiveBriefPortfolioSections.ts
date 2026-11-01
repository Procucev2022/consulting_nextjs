/**
 * Executive Brief Portfolio Sections Configuration
 * Prompt 590: Authoritative Borosil Ltd (AIC-2026-0002) Sourcing Portfolio Sections
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

export const EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS = {
  headlineTitle: 'PROCUCEV PROCUREMENT VALUE OPPORTUNITY ASSESSMENT',
  headlineSubtitle: 'Data-led procurement transformation and value discovery for Borosil Ltd',
  totalAddressableSpend: '₹168.658 Cr',
  netIndicativeOpportunity: '₹87.100 Cr',
  netOpportunityPercent: '16.54%',
  hardSavingsCr: '₹75.121 Cr',
  costAvoidanceCr: '₹0.00 Cr',
  overlapDeductionCr: '-₹30.412 Cr',
  exclusionsCr: '₹0.00 Cr',
  processProductivity: 'PO frequency reduction non-monetized to protect CFO trust',
  riskMitigation: 'Dual-sourcing and vendor capability qualification (Not monetized)',
  validatedSavings: '₹75.121 Cr Modelled Opportunity Excluding Lever 2 (Client-Approved: ₹0, Realized: ₹0)',
  eauctionShareNote: 'E-auction is Lever 3 execution mechanism under Strategic Sourcing; represents ₹1.352 Cr modelled opportunity.',
  expanders: {
    sec1Title: '1. Customer Spend Baseline (Module 1 Forensic Base: ₹556.535 Cr)',
    sec2Title: '2. Vendor Consolidation (Module 2 Lever 2: ₹12.081 Cr Spend Under Commercial Validation)',
    sec3Title: '3. PO Consolidation & Process Productivity (Non-Monetized Governance Baseline)',
    sec4Title: '4. Category Sourcing Diagnostics (Module 2: 133 Categories / 106 Sourcing Packages)',
    sec5Title: '5. Combined Strategic Sourcing (Module 2 Lever 1: ₹73.769 Cr Modelled Opportunity)',
    sec6Title: '6. Supply Security & Risk Mitigation (Operational Governance)',
    sec7Title: '7. Market Benchmark Disclosure (Module 3: Research Closed — 0% Coverage)',
    sec8Title: '8. Master Opportunity Register (Single Source of Truth Table)',
    sec9Title: '9. Double Count Reconciliation & CFO Waterfall Bridge (₹30.412 Cr Deductions)',
    sec10Title: '10. Governance Registers (Assumption & Customer Validation Checklists)',
    sec11Title: '11. Execution Roadmap & Realization Governance (Proposed Year 1 Target: ₹12.90 Cr)'
  }
} as const;
