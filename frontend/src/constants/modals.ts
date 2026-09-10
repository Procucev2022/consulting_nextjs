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

export const DEFAULT_MASTER_ITEMS = [
  {
    code: 'ITM-HDPE-101',
    name: 'High Density Polyethylene (HDPE) Polymers (25kg Bags)',
    category: 'Direct Materials',
    column_l_code: '13101502',
    aliases: [
      'High Density Polyethylene Granules (25kg Bags)',
      'HDPE Granules Grade B - 25kg Pack',
      'Polyethylene Polymer Pellets High Density'
    ]
  },
  {
    code: 'ITM-BOX-202',
    name: 'Heavy Duty Double-Wall Corrugated Cartons (48x40x36)',
    category: 'Packaging Materials',
    column_l_code: '14121506',
    aliases: [
      'Double Wall Corrugated Pallet Container 48x40x36',
      'Corrugated Shipping Box 48x40x36 Heavy Duty',
      'Double Wall Pallet Boxes 48x40x36'
    ]
  },
  {
    code: 'ITM-CHEM-303',
    name: 'Hydrochloric Acid 37% Technical Grade (Bulk Tanker)',
    category: 'Direct Materials',
    column_l_code: '12352204',
    aliases: [
      'Hydrochloric Acid 37% Tech Grade Bulk Tanker',
      'HCL 37% Tech Grade Solution Bulk Delivery',
      'Muriatic Acid 37% Industrial Tanker'
    ]
  }
] as const;

