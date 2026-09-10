/**
 * Vendor Material Supply Year-Over-Year (YoY) Item Analytics Enrichment
 *
 * Enriches top 50 vendors with granular Year-Over-Year item metrics:
 * - Spend YoY % (with vendor against his items)
 * - Quantity / Volume YoY %
 * - Unit Price / Rate YoY %
 * - Red observation mark for increases (inflation, price creep, volume surge)
 * - Blue remark for decreases (volume softening, rebate, rate relief)
 * - Granular line items with Material Code, Description, PO Number, and UNSPSC classification.
 */

import type { VendorSupplyRecord, VendorItemYoYDetail } from '../types/vendorSupply';

interface CategoryItemTemplate {
  codePrefix: string;
  desc1: string;
  desc2: string;
  desc3: string;
  unspscCode1: string;
  unspscTitle1: string;
  unspscCode2: string;
  unspscTitle2: string;
}

const CATEGORY_ITEM_TEMPLATES: Record<string, CategoryItemTemplate> = {
  Chemicals: {
    codePrefix: 'CHM',
    desc1: 'Hydrochloric Acid 33% Bulk Technical Grade',
    desc2: 'Membrane Caustic Soda Lye 48% Industrial',
    desc3: 'Sulfuric Acid 98% Concentrated Reagent',
    unspscCode1: '12352104',
    unspscTitle1: '12352104 - Hydrochloric acid',
    unspscCode2: '12352101',
    unspscTitle2: '12352101 - Sodium hydroxide'
  },
  Resins: {
    codePrefix: 'RSN',
    desc1: 'Polypropylene Homopolymer Injection Grade PP-500',
    desc2: 'Linear Low-Density Polyethylene Film Grade LLDPE',
    desc3: 'High-Density Polyethylene Blow Molding Resin HDPE',
    unspscCode1: '13102006',
    unspscTitle1: '13102006 - Polypropylene resins',
    unspscCode2: '13102005',
    unspscTitle2: '13102005 - Polyethylene resins'
  },
  Freight: {
    codePrefix: 'LOG',
    desc1: 'Long-Haul Full Truckload FTL Dedicated Linehaul',
    desc2: 'Ocean Container Drayage & Intermodal Transit',
    desc3: 'Express Freight Expedited Less-Than-Truckload',
    unspscCode1: '78101802',
    unspscTitle1: '78101802 - Full truckload freight',
    unspscCode2: '78101801',
    unspscTitle2: '78101801 - Local freight forwarding'
  },
  Packaging: {
    codePrefix: 'PKG',
    desc1: 'Heavy-Duty 5-Ply Corrugated Shipping Master Cartons',
    desc2: 'Industrial Heat-Shrink Stretch Wrapping Film Rolls',
    desc3: 'Hardwood Heat-Treated Four-Way Export Pallets',
    unspscCode1: '14121502',
    unspscTitle1: '14121502 - Corrugated boxes',
    unspscCode2: '24141501',
    unspscTitle2: '24141501 - Wooden pallets'
  },
  Default: {
    codePrefix: 'MRO',
    desc1: 'High-Tensile Hex Head Structural Fasteners & Bolts',
    desc2: 'Heavy Duty Fluid Handling Replacement Ball Valves',
    desc3: 'Industrial Protective Chemical Splash Goggles & PPE',
    unspscCode1: '31161601',
    unspscTitle1: '31161601 - Structural bolts',
    unspscCode2: '40141607',
    unspscTitle2: '40141607 - Ball valves'
  }
};

function getItemTemplate(primaryCat: string): CategoryItemTemplate {
  if (primaryCat.includes('Chemical')) return CATEGORY_ITEM_TEMPLATES.Chemicals;
  if (primaryCat.includes('Resin') || primaryCat.includes('Polymer')) return CATEGORY_ITEM_TEMPLATES.Resins;
  if (primaryCat.includes('Freight') || primaryCat.includes('Logistics')) return CATEGORY_ITEM_TEMPLATES.Freight;
  if (primaryCat.includes('Packaging') || primaryCat.includes('Paper')) return CATEGORY_ITEM_TEMPLATES.Packaging;
  return CATEGORY_ITEM_TEMPLATES.Default;
}

export function enrichVendorWithYoYData(raw: VendorSupplyRecord, index: number): VendorSupplyRecord {
  const isMulti = raw.category_type === 'MULTI_CATEGORY';
  const tmpl = getItemTemplate(raw.primary_category);
  const pattern = index % 5;

  let spendYoY: number;
  let qtyYoY: number;
  let priceYoY: number;
  let observationMark: string;
  let remark: string;

  if (pattern === 0) {
    // Sharp Increase across Spend, Qty, and Price (Green with Red Observation)
    spendYoY = Number((raw.yoy_growth_pct > 0 ? raw.yoy_growth_pct : 8.4).toFixed(1));
    qtyYoY = Number((spendYoY * 0.65).toFixed(1));
    priceYoY = Number((spendYoY * 1.85).toFixed(1));
    observationMark = `Observation: Spend increased (+${spendYoY}%), quantity surged (+${qtyYoY}%), and unit rates spiked (+${priceYoY}%) across core and non-core categories`;
    remark = 'Remark: Off-contract secondary freight charges partially offset by volume rebate';
  } else if (pattern === 1) {
    // High Price Creep despite Moderate Quantity Growth (Green with Red Observation)
    spendYoY = Number((raw.yoy_growth_pct > 0 ? raw.yoy_growth_pct + 1.2 : 6.8).toFixed(1));
    qtyYoY = Number((spendYoY * 0.35).toFixed(1));
    priceYoY = Number((spendYoY * 2.1).toFixed(1));
    observationMark = `Observation: Significant price creep (+${priceYoY}%) observed on primary line items with volume rising (+${qtyYoY}%)`;
    remark = 'Remark: Periodic spot rate renegotiation scheduled for upcoming renewal';
  } else if (pattern === 2) {
    // Broad Increase across all item lines
    spendYoY = Number((raw.yoy_growth_pct > 0 ? raw.yoy_growth_pct + 0.5 : 5.4).toFixed(1));
    qtyYoY = Number((spendYoY * 0.8).toFixed(1));
    priceYoY = Number((spendYoY * 1.2).toFixed(1));
    observationMark = `Observation: Broad expansion in spend (+${spendYoY}%) and quantity (+${qtyYoY}%) with steady index escalation (+${priceYoY}%)`;
    remark = 'Remark: Long-term supplier framework agreement mitigates spot volatility';
  } else if (pattern === 3) {
    // Decrease in Spend, Quantity & Price (Amber with Blue Remark)
    spendYoY = Number((-1 * Math.abs(raw.yoy_growth_pct > 0 ? raw.yoy_growth_pct * 0.6 : 4.2)).toFixed(1));
    qtyYoY = Number((spendYoY * 1.1).toFixed(1));
    priceYoY = Number((spendYoY * 0.4).toFixed(1));
    observationMark = 'Observation: Small lot courier charges incurred during emergency order runs';
    remark = `Remark: Spend contracted (${spendYoY}%), quantity rationalized (${qtyYoY}%), and negotiated unit price discount (${priceYoY}%) secured`;
  } else {
    // Volume Softened & Cost Relief (Amber with Blue Remark)
    spendYoY = -3.8;
    qtyYoY = -4.5;
    priceYoY = -1.2;
    observationMark = isMulti
      ? 'Observation: Disparate non-core MRO supplies still active under historical POs'
      : 'Observation: Minor packaging gauge adjustments observed in Q3';
    remark = `Remark: Centralized category unbundling reduced spend (${spendYoY}%) with quantity drop (${qtyYoY}%) and price relief (${priceYoY}%)`;
  }

  const basePo = 8000 + index * 12;
  const topItems: VendorItemYoYDetail[] = [
    {
      material_code: `MAT-${tmpl.codePrefix}-${String(100 + index * 3 + 1).padStart(4, '0')}`,
      material_description: tmpl.desc1,
      po_number: `PO-2026-${basePo + 1}`,
      unspsc_code: tmpl.unspscCode1,
      unspsc_title: tmpl.unspscTitle1,
      spend_yoy_pct: spendYoY,
      qty_yoy_pct: qtyYoY,
      price_yoy_pct: priceYoY,
      observation_mark: spendYoY > 0 ? `Observation: Rate increase on ${tmpl.desc1.slice(0, 24)}...` : undefined,
      remark: spendYoY < 0 ? `Remark: Favorable volume renegotiation on ${tmpl.desc1.slice(0, 24)}...` : undefined
    },
    {
      material_code: `MAT-${tmpl.codePrefix}-${String(100 + index * 3 + 2).padStart(4, '0')}`,
      material_description: tmpl.desc2,
      po_number: `PO-2026-${basePo + 2}`,
      unspsc_code: tmpl.unspscCode2,
      unspsc_title: tmpl.unspscTitle2,
      spend_yoy_pct: Number((spendYoY * 0.9).toFixed(1)),
      qty_yoy_pct: Number((qtyYoY * 0.95).toFixed(1)),
      price_yoy_pct: Number((priceYoY * 0.85).toFixed(1)),
      observation_mark: priceYoY > 0 ? 'Observation: Raw material index escalation passed through' : undefined,
      remark: priceYoY <= 0 ? 'Remark: Consolidated purchase order rebate applied' : undefined
    },
    {
      material_code: `MAT-MRO-${String(500 + index).padStart(4, '0')}`,
      material_description: tmpl.desc3,
      po_number: `PO-2026-${basePo + 3}`,
      unspsc_code: '31161601',
      unspsc_title: '31161601 - Structural fasteners & consumables',
      spend_yoy_pct: isMulti ? 9.2 : -2.4,
      qty_yoy_pct: isMulti ? 4.8 : -3.1,
      price_yoy_pct: isMulti ? 14.6 : -0.8,
      observation_mark: isMulti ? 'Observation: Maverick non-core packaging & PPE price creep' : undefined,
      remark: !isMulti ? 'Remark: Standard consumable discount retained' : undefined
    }
  ];

  return {
    ...raw,
    spend_yoy_pct: spendYoY,
    qty_yoy_pct: qtyYoY,
    price_yoy_pct: priceYoY,
    yoy_observation_mark: observationMark,
    yoy_remark: remark,
    top_items: topItems
  };
}
