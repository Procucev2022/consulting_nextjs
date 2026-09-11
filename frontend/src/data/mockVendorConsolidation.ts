import type { RecurringConsolidationItem, VendorConsolidationSummary } from '../types';

export const mockRecurringConsolidationItems: RecurringConsolidationItem[] = [
  {
    id: 'CONSOL-PKG-01',
    category: 'Packaging Materials',
    item_group_title: 'Corrugated Packaging & Heavy-Duty Shipper Cartons',
    item_group_code: 'GRP-PKG-CARTONS',
    unspsc_family: 'Packaging boxes and bags and containers',
    unspsc_code: '24111500',
    total_spend_inr_cr: 38.45,
    vendor_count: 8, // Strictly > 5
    recurring_monthly: true,
    procurement_cadence: '12 / 12 Months Recurring',
    monthly_po_avg: 42,
    annual_units: 3200000,
    unit_of_measure: 'Boxes',
    price_variance_pct: 14.8,
    target_consolidated_vendors: 2,
    est_volume_savings_pct: 14.5,
    est_volume_savings_cr: 5.58,
    recommended_auction_type: 'Dynamic Multi-Round Reverse Auction',
    auction_platform: 'DPS NXT',
    suppliers: [
      {
        vendor_id: 'VND-PKG-01',
        vendor_name: 'Amcor Packaging India Ltd',
        annual_spend_inr_cr: 11.20,
        spend_share_pct: 29.1,
        unit_rate_index: 100.0,
        monthly_po_count: 12,
        status: 'Primary'
      },
      {
        vendor_id: 'VND-PKG-02',
        vendor_name: 'Parksons Packaging Solutions',
        annual_spend_inr_cr: 8.40,
        spend_share_pct: 21.8,
        unit_rate_index: 104.2,
        monthly_po_count: 9,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-PKG-03',
        vendor_name: 'TCPL Packaging Containers',
        annual_spend_inr_cr: 5.60,
        spend_share_pct: 14.6,
        unit_rate_index: 107.5,
        monthly_po_count: 6,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-PKG-04',
        vendor_name: 'Universal Corrugators Pvt Ltd',
        annual_spend_inr_cr: 4.10,
        spend_share_pct: 10.7,
        unit_rate_index: 109.8,
        monthly_po_count: 5,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-PKG-05',
        vendor_name: 'Bhavani Paper & Cartons',
        annual_spend_inr_cr: 3.50,
        spend_share_pct: 9.1,
        unit_rate_index: 112.0,
        monthly_po_count: 4,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-PKG-06',
        vendor_name: 'Shree Krishna Packaging Co',
        annual_spend_inr_cr: 2.80,
        spend_share_pct: 7.3,
        unit_rate_index: 113.5,
        monthly_po_count: 3,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-PKG-07',
        vendor_name: 'Apex Kraft Containers',
        annual_spend_inr_cr: 1.65,
        spend_share_pct: 4.3,
        unit_rate_index: 114.2,
        monthly_po_count: 2,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-PKG-08',
        vendor_name: 'Regional Carton Works (Ad-hoc)',
        annual_spend_inr_cr: 1.20,
        spend_share_pct: 3.1,
        unit_rate_index: 114.8,
        monthly_po_count: 1,
        status: 'Spot / Peripheral'
      }
    ],
    consolidation_roadmap: [
      'Standardize 14 disparate carton ply/bursting specifications into 4 unified master SKUs.',
      'Aggregate pan-plant annual commitment of 3.2M units into DPS NXT dynamic reverse auction.',
      'Consolidate 8 vendors to 2 strategic vendors with 70/30 volume allocation.',
      'Mandate index-pegged quarterly paper pricing tied to Crisil/ICIS kraft index.'
    ]
  },
  {
    id: 'CONSOL-DIR-02',
    category: 'Direct Materials',
    item_group_title: 'Industrial Process Solvents & Specialty Cleaning Chemicals',
    item_group_code: 'GRP-DIR-SOLVENTS',
    unspsc_family: 'Solvents and thinners',
    unspsc_code: '12191600',
    total_spend_inr_cr: 42.80,
    vendor_count: 7, // Strictly > 5
    recurring_monthly: true,
    procurement_cadence: '12 / 12 Months Recurring',
    monthly_po_avg: 36,
    annual_units: 850000,
    unit_of_measure: 'Liters',
    price_variance_pct: 16.2,
    target_consolidated_vendors: 2,
    est_volume_savings_pct: 14.5,
    est_volume_savings_cr: 6.20,
    recommended_auction_type: 'Dynamic Multi-Round Reverse Auction',
    auction_platform: 'DPS NXT',
    suppliers: [
      {
        vendor_id: 'VND-CHM-01',
        vendor_name: 'Deepak Fertilisers & Petrochemicals',
        annual_spend_inr_cr: 14.50,
        spend_share_pct: 33.9,
        unit_rate_index: 100.0,
        monthly_po_count: 12,
        status: 'Primary'
      },
      {
        vendor_id: 'VND-CHM-02',
        vendor_name: 'Aarti Industries Chemical Div',
        annual_spend_inr_cr: 10.20,
        spend_share_pct: 23.8,
        unit_rate_index: 105.4,
        monthly_po_count: 8,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-CHM-03',
        vendor_name: 'Galaxy Surfactants Chemicals',
        annual_spend_inr_cr: 6.80,
        spend_share_pct: 15.9,
        unit_rate_index: 108.9,
        monthly_po_count: 6,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-CHM-04',
        vendor_name: 'Gujarat Fluorochemicals Supply',
        annual_spend_inr_cr: 4.50,
        spend_share_pct: 10.5,
        unit_rate_index: 111.3,
        monthly_po_count: 4,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-CHM-05',
        vendor_name: 'Chemplast Sanmar Dist',
        annual_spend_inr_cr: 3.20,
        spend_share_pct: 7.5,
        unit_rate_index: 113.8,
        monthly_po_count: 3,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-CHM-06',
        vendor_name: 'Sudarshan Chemical Labs',
        annual_spend_inr_cr: 2.10,
        spend_share_pct: 4.9,
        unit_rate_index: 115.0,
        monthly_po_count: 2,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-CHM-07',
        vendor_name: 'Premier Chemical Traders',
        annual_spend_inr_cr: 1.50,
        spend_share_pct: 3.5,
        unit_rate_index: 116.2,
        monthly_po_count: 1,
        status: 'Spot / Peripheral'
      }
    ],
    consolidation_roadmap: [
      'Standardize solvent purity tolerances across 3 formulation plants.',
      'Eliminate high-markup regional traders and run reverse e-auction directly with primary producers on DPS NXT.',
      'Consolidate 7 vendors into 2 national petrochemical manufacturers (75/25 dual-source).',
      'Lock in baseline index-formula pricing against Platts petrochemical markers.'
    ]
  },
  {
    id: 'CONSOL-LOG-03',
    category: 'Logistics & Freight',
    item_group_title: 'Primary FTL Line-Haul Transportation & Regional Freight',
    item_group_code: 'GRP-LOG-LINEHAUL',
    unspsc_family: 'Freight transport services',
    unspsc_code: '78101800',
    total_spend_inr_cr: 54.30,
    vendor_count: 9, // Strictly > 5
    recurring_monthly: true,
    procurement_cadence: '12 / 12 Months Recurring',
    monthly_po_avg: 68,
    annual_units: 8200,
    unit_of_measure: 'Truckloads',
    price_variance_pct: 18.5,
    target_consolidated_vendors: 3,
    est_volume_savings_pct: 14.5,
    est_volume_savings_cr: 7.87,
    recommended_auction_type: 'Lane-Wise Multi-Round Dynamic e-Auction',
    auction_platform: 'DPS NXT',
    suppliers: [
      {
        vendor_id: 'VND-LOG-01',
        vendor_name: 'TCI Freight Logistics',
        annual_spend_inr_cr: 16.40,
        spend_share_pct: 30.2,
        unit_rate_index: 100.0,
        monthly_po_count: 22,
        status: 'Primary'
      },
      {
        vendor_id: 'VND-LOG-02',
        vendor_name: 'VRL Logistics Network',
        annual_spend_inr_cr: 11.80,
        spend_share_pct: 21.7,
        unit_rate_index: 106.1,
        monthly_po_count: 15,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-LOG-03',
        vendor_name: 'Gati-KWE Transport',
        annual_spend_inr_cr: 8.50,
        spend_share_pct: 15.7,
        unit_rate_index: 109.8,
        monthly_po_count: 11,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-LOG-04',
        vendor_name: 'Safexpress Supply Chain',
        annual_spend_inr_cr: 6.20,
        spend_share_pct: 11.4,
        unit_rate_index: 112.5,
        monthly_po_count: 8,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-LOG-05',
        vendor_name: 'Mahindra Logistics FTL',
        annual_spend_inr_cr: 4.10,
        spend_share_pct: 7.6,
        unit_rate_index: 114.3,
        monthly_po_count: 5,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-LOG-06',
        vendor_name: 'Associated Road Carriers',
        annual_spend_inr_cr: 3.20,
        spend_share_pct: 5.9,
        unit_rate_index: 115.9,
        monthly_po_count: 3,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-LOG-07',
        vendor_name: 'North-East Express Lines',
        annual_spend_inr_cr: 1.90,
        spend_share_pct: 3.5,
        unit_rate_index: 117.2,
        monthly_po_count: 2,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-LOG-08',
        vendor_name: 'Shree Maruti Transport',
        annual_spend_inr_cr: 1.20,
        spend_share_pct: 2.2,
        unit_rate_index: 118.0,
        monthly_po_count: 1,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-LOG-09',
        vendor_name: 'Local Spot Broker Fleet',
        annual_spend_inr_cr: 1.00,
        spend_share_pct: 1.8,
        unit_rate_index: 118.5,
        monthly_po_count: 1,
        status: 'Spot / Peripheral'
      }
    ],
    consolidation_roadmap: [
      'Bundle 28 disparate manufacturing origin-destination freight lanes into 4 core regional transit corridors.',
      'Eliminate spot market booking premiums and establish dedicated contractual lane capacity.',
      'Execute dynamic reverse auction on DPS NXT across verified 3PL logistics carriers.',
      'Consolidate 9 carriers to 3 strategic logistics partners with strict SLAs and diesel-indexed rate cards.'
    ]
  },
  {
    id: 'CONSOL-MRO-04',
    category: 'Indirect & MRO',
    item_group_title: 'MRO Bearings, Fasteners & Power Transmission Spares',
    item_group_code: 'GRP-MRO-BEARINGS',
    unspsc_family: 'Bearings and bushings and wheels and gears',
    unspsc_code: '31171500',
    total_spend_inr_cr: 26.90,
    vendor_count: 11, // Strictly > 5
    recurring_monthly: true,
    procurement_cadence: '12 / 12 Months Recurring',
    monthly_po_avg: 55,
    annual_units: 450000,
    unit_of_measure: 'Units',
    price_variance_pct: 22.0,
    target_consolidated_vendors: 2,
    est_volume_savings_pct: 15.0,
    est_volume_savings_cr: 4.03,
    recommended_auction_type: 'Basket Lot Reverse e-Auction',
    auction_platform: 'DPS NXT',
    suppliers: [
      {
        vendor_id: 'VND-MRO-01',
        vendor_name: 'SKF India Industrial Dist',
        annual_spend_inr_cr: 7.80,
        spend_share_pct: 29.0,
        unit_rate_index: 100.0,
        monthly_po_count: 16,
        status: 'Primary'
      },
      {
        vendor_id: 'VND-MRO-02',
        vendor_name: 'Schaeffler India Spares',
        annual_spend_inr_cr: 5.40,
        spend_share_pct: 20.1,
        unit_rate_index: 106.8,
        monthly_po_count: 11,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-MRO-03',
        vendor_name: 'Timken Bearing Services',
        annual_spend_inr_cr: 3.60,
        spend_share_pct: 13.4,
        unit_rate_index: 109.5,
        monthly_po_count: 8,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-MRO-04',
        vendor_name: 'National Bearing Supply Co',
        annual_spend_inr_cr: 2.70,
        spend_share_pct: 10.0,
        unit_rate_index: 113.2,
        monthly_po_count: 6,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-MRO-05',
        vendor_name: 'Precision Fasteners Dist',
        annual_spend_inr_cr: 2.10,
        spend_share_pct: 7.8,
        unit_rate_index: 115.4,
        monthly_po_count: 4,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-MRO-06',
        vendor_name: 'Bharat Industrial Spares',
        annual_spend_inr_cr: 1.50,
        spend_share_pct: 5.6,
        unit_rate_index: 117.0,
        monthly_po_count: 3,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-MRO-07',
        vendor_name: 'Apex MRO Trading Corp',
        annual_spend_inr_cr: 1.10,
        spend_share_pct: 4.1,
        unit_rate_index: 118.6,
        monthly_po_count: 2,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-MRO-08',
        vendor_name: 'Universal Hardware Supplies',
        annual_spend_inr_cr: 0.90,
        spend_share_pct: 3.3,
        unit_rate_index: 119.8,
        monthly_po_count: 2,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-MRO-09',
        vendor_name: 'Kolkata Bearing Agency',
        annual_spend_inr_cr: 0.70,
        spend_share_pct: 2.6,
        unit_rate_index: 120.5,
        monthly_po_count: 1,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-MRO-10',
        vendor_name: 'Southern Spares Depot',
        annual_spend_inr_cr: 0.60,
        spend_share_pct: 2.2,
        unit_rate_index: 121.2,
        monthly_po_count: 1,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-MRO-11',
        vendor_name: 'Ad-hoc Plant Hardware Stores',
        annual_spend_inr_cr: 0.50,
        spend_share_pct: 1.9,
        unit_rate_index: 122.0,
        monthly_po_count: 1,
        status: 'Spot / Peripheral'
      }
    ],
    consolidation_roadmap: [
      'Consolidate 11 fragmented plant distributors into an integrated MRO Vendor Managed Inventory (VMI) model.',
      'Eliminate +22% local dealer markups through central manufacturer distribution agreement.',
      'Deploy basket lot reverse e-auction on DPS NXT with primary OEM distributors.',
      'Consolidate volume to 2 authorized national distribution partners (70/30 share).'
    ]
  },
  {
    id: 'CONSOL-PKG-05',
    category: 'Packaging Materials',
    item_group_title: 'Heavy Industrial Pallets & Returnable Packaging Crates',
    item_group_code: 'GRP-PKG-PALLETS',
    unspsc_family: 'Pallets and skids',
    unspsc_code: '24112700',
    total_spend_inr_cr: 18.25,
    vendor_count: 6, // Strictly > 5
    recurring_monthly: true,
    procurement_cadence: '12 / 12 Months Recurring',
    monthly_po_avg: 28,
    annual_units: 180000,
    unit_of_measure: 'Pallets',
    price_variance_pct: 12.4,
    target_consolidated_vendors: 2,
    est_volume_savings_pct: 14.0,
    est_volume_savings_cr: 2.55,
    recommended_auction_type: 'Dynamic Multi-Round Reverse Auction',
    auction_platform: 'DPS NXT',
    suppliers: [
      {
        vendor_id: 'VND-PLT-01',
        vendor_name: 'CHEP India Pallet Systems',
        annual_spend_inr_cr: 6.80,
        spend_share_pct: 37.3,
        unit_rate_index: 100.0,
        monthly_po_count: 10,
        status: 'Primary'
      },
      {
        vendor_id: 'VND-PLT-02',
        vendor_name: 'Schoeller Allibert India',
        annual_spend_inr_cr: 4.50,
        spend_share_pct: 24.7,
        unit_rate_index: 105.1,
        monthly_po_count: 7,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-PLT-03',
        vendor_name: 'Supreme Industries Pallet Div',
        annual_spend_inr_cr: 3.10,
        spend_share_pct: 17.0,
        unit_rate_index: 108.3,
        monthly_po_count: 5,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-PLT-04',
        vendor_name: 'Timbercraft Industrial Pallets',
        annual_spend_inr_cr: 1.85,
        spend_share_pct: 10.1,
        unit_rate_index: 110.4,
        monthly_po_count: 3,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-PLT-05',
        vendor_name: 'Western Timber Works',
        annual_spend_inr_cr: 1.20,
        spend_share_pct: 6.6,
        unit_rate_index: 111.9,
        monthly_po_count: 2,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-PLT-06',
        vendor_name: 'National Wooden Crates',
        annual_spend_inr_cr: 0.80,
        spend_share_pct: 4.3,
        unit_rate_index: 112.4,
        monthly_po_count: 1,
        status: 'Spot / Peripheral'
      }
    ],
    consolidation_roadmap: [
      'Transition from one-way wooden pallets to standardized returnable plastic pallets.',
      'Aggregate demand across warehousing hubs into DPS NXT reverse auction event.',
      'Consolidate 6 vendors to 2 strategic pallet manufacturers.',
      'Achieve 14% bottom-line volume savings with guaranteed take-or-pay rate cards.'
    ]
  },
  {
    id: 'CONSOL-MRO-06',
    category: 'Indirect & MRO',
    item_group_title: 'Plant Safety PPE, Consumables & Technical Workwear',
    item_group_code: 'GRP-MRO-SAFETY',
    unspsc_family: 'Safety apparel and protective gear',
    unspsc_code: '46181500',
    total_spend_inr_cr: 14.60,
    vendor_count: 6, // Strictly > 5
    recurring_monthly: true,
    procurement_cadence: '12 / 12 Months Recurring',
    monthly_po_avg: 32,
    annual_units: 240000,
    unit_of_measure: 'Units',
    price_variance_pct: 15.5,
    target_consolidated_vendors: 2,
    est_volume_savings_pct: 14.5,
    est_volume_savings_cr: 2.12,
    recommended_auction_type: 'Catalog Reverse e-Auction',
    auction_platform: 'DPS NXT',
    suppliers: [
      {
        vendor_id: 'VND-SAF-01',
        vendor_name: 'Mallcom India Safety Equip',
        annual_spend_inr_cr: 5.20,
        spend_share_pct: 35.6,
        unit_rate_index: 100.0,
        monthly_po_count: 11,
        status: 'Primary'
      },
      {
        vendor_id: 'VND-SAF-02',
        vendor_name: 'Karam Safety Solutions',
        annual_spend_inr_cr: 3.80,
        spend_share_pct: 26.0,
        unit_rate_index: 107.2,
        monthly_po_count: 8,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-SAF-03',
        vendor_name: '3M India Safety Division',
        annual_spend_inr_cr: 2.40,
        spend_share_pct: 16.4,
        unit_rate_index: 110.8,
        monthly_po_count: 5,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-SAF-04',
        vendor_name: 'Sure Safety Consumables',
        annual_spend_inr_cr: 1.50,
        spend_share_pct: 10.3,
        unit_rate_index: 112.5,
        monthly_po_count: 4,
        status: 'Incumbent'
      },
      {
        vendor_id: 'VND-SAF-05',
        vendor_name: 'Frontline Safety Gear',
        annual_spend_inr_cr: 1.00,
        spend_share_pct: 6.9,
        unit_rate_index: 114.2,
        monthly_po_count: 2,
        status: 'Spot / Peripheral'
      },
      {
        vendor_id: 'VND-SAF-06',
        vendor_name: 'Local Safety Trading Depot',
        annual_spend_inr_cr: 0.70,
        spend_share_pct: 4.8,
        unit_rate_index: 115.5,
        monthly_po_count: 2,
        status: 'Spot / Peripheral'
      }
    ],
    consolidation_roadmap: [
      'Standardize safety gloves, helmets, and protective footwear to EN/IS compliance standards.',
      'Deploy punch-out electronic catalog on DPS NXT with primary PPE manufacturers.',
      'Consolidate 6 distributors into 2 direct OEM suppliers (75/25 dual-sourcing).',
      'Lock in tiered annual volume discounts with automated replenishment triggers.'
    ]
  }
];

export const calculateVendorConsolidationSummary = (
  items: RecurringConsolidationItem[] = mockRecurringConsolidationItems
): VendorConsolidationSummary => {
  const totalFragmentedSpendCr = Number(
    items.reduce((acc, curr) => acc + curr.total_spend_inr_cr, 0).toFixed(2)
  );

  const categoriesCount = items.length;

  const totalActiveVendors = items.reduce((acc, curr) => acc + curr.vendor_count, 0);

  const avgVendorsPerCategory = categoriesCount > 0
    ? Number((totalActiveVendors / categoriesCount).toFixed(1))
    : 0;

  const potentialVolumeSavingsCr = Number(
    items.reduce((acc, curr) => acc + curr.est_volume_savings_cr, 0).toFixed(2)
  );

  const avgSavingsPct = totalFragmentedSpendCr > 0
    ? Number(((potentialVolumeSavingsCr / totalFragmentedSpendCr) * 100).toFixed(1))
    : 0;

  return {
    totalFragmentedSpendCr,
    categoriesCount,
    totalActiveVendors,
    avgVendorsPerCategory,
    potentialVolumeSavingsCr,
    avgSavingsPct
  };
};
