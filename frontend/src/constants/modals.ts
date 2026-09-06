/**
 * Modal Constants Module (Frontend)
 */

export const DEFAULT_INVITED_SUPPLIERS = [
  'Amcor Packaging Group',
  'International Paper Co.',
  'WestRock Packaging Corp',
  'Smurfit Kappa Group',
  'Packaging Corp of America'
] as const;

export const DEFAULT_PROCPX_BASELINE = 1850000;

export const DEFAULT_MASTER_SUPPLIERS = [
  {
    id: 'SUP-DHL-001',
    name: 'DHL Global Forwarding & Logistics SE',
    subsidiaries: ['DHL Express Inc', 'DHL Logistics GmbH', 'DHL Global Mail']
  },
  {
    id: 'SUP-AMCOR-001',
    name: 'Amcor Packaging Group Global',
    subsidiaries: ['Amcor Flexibles LLC', 'Amcor Rigid Plastics', 'Amcor Speciality']
  },
  {
    id: 'SUP-ACME-102',
    name: 'Acme Chemical Holdings Corp',
    subsidiaries: ['Acme Chem Co LLC', 'Acme Specialty Resins', 'Acme Industrial']
  }
] as const;

export const DEFAULT_MAX_PRICE_CREEP_CAP = 3.0;
export const DEFAULT_INDEX_PEGGING = 'LME & ICIS Official Benchmark';
