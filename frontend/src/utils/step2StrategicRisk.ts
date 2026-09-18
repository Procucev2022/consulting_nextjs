/**
 * Strategic Single/Dominant Vendor Risk Engine Calculator
 */

import type { LineItemMapping, StrategicSingleVendorItem, CoreBucket } from '../types';
import { lookupUNSPSCDetails, lookupUNSPSCByDescription } from '../data/unspscTaxonomy';

interface MaterialVendorAggregate {
  materialCode: string;
  materialDesc: string;
  coreBucket: string;
  unspscCode: string;
  unspscCommodity: string;
  unspscClass: string;
  vendorSpends: Map<string, { spend: number; vendorId: string; poCount: number }>;
  totalSpend: number;
  totalQty: number;
  unit: string;
  totalPos: number;
}

export function calculateStrategicVendorRisk(
  lineItems: LineItemMapping[] = []
): StrategicSingleVendorItem[] {
  if (!lineItems || lineItems.length === 0) {
    return [];
  }

  const materialMap = new Map<string, MaterialVendorAggregate>();

  lineItems.forEach((item, idx) => {
    aggregateMaterialRecord(item, idx, materialMap);
  });

  const strategicItems: StrategicSingleVendorItem[] = [];

  materialMap.forEach((mat) => {
    const sortedVendors = Array.from(mat.vendorSpends.entries()).sort((a, b) => b[1].spend - a[1].spend);
    if (sortedVendors.length === 0) return;

    const [primaryName, primaryData] = sortedVendors[0];
    const primaryShare = (primaryData.spend / (mat.totalSpend || 1)) * 100;
    const secondary = sortedVendors[1];
    const secondaryShare = secondary ? (secondary[1].spend / (mat.totalSpend || 1)) * 100 : 0;

    const isSole = sortedVendors.length === 1 || primaryShare >= 95;
    const isDominant = primaryShare >= 75 && secondaryShare < 15;

    if (isSole || isDominant) {
      strategicItems.push(
        buildStrategicItem(mat, primaryName, primaryData, primaryShare, secondary, secondaryShare, isSole)
      );
    }
  });

  return strategicItems.sort((a, b) => b.total_spend_inr_cr - a.total_spend_inr_cr);
}

function resolveTaxonomyInfo(desc: string, bucket: string): { code: string; commodity: string; classTitle: string } {
  const descMatch = lookupUNSPSCByDescription(desc);
  const fallback = lookupUNSPSCDetails(desc, bucket);
  return {
    code: descMatch?.commodityCode || '10000000',
    commodity: descMatch?.commodityTitle || fallback.commodityTitle,
    classTitle: descMatch?.classTitle || fallback.classTitle
  };
}

function createMaterialAggregate(
  item: LineItemMapping,
  idx: number
): MaterialVendorAggregate {
  const tax = resolveTaxonomyInfo(item.raw_desc, item.core_bucket);
  return {
    materialCode: item.material_code || `MAT-${1000 + idx}`,
    materialDesc: item.raw_desc || item.material_desc || 'Industrial Material',
    coreBucket: item.core_bucket || 'Direct Materials',
    unspscCode: item.unspsc_code || tax.code,
    unspscCommodity: item.unspsc_commodity_title || tax.commodity,
    unspscClass: item.unspsc_class_title || tax.classTitle,
    vendorSpends: new Map(),
    totalSpend: 0,
    totalQty: 0,
    unit: 'Units',
    totalPos: 0
  };
}

function aggregateMaterialRecord(
  item: LineItemMapping,
  idx: number,
  materialMap: Map<string, MaterialVendorAggregate>
): void {
  const matKey = (item.material_code || item.raw_desc || `Item-${idx}`).trim();
  let entry = materialMap.get(matKey);
  if (!entry) {
    entry = createMaterialAggregate(item, idx);
    materialMap.set(matKey, entry);
  }

  const spendCr = item.inr_crores || (item.total_spend ? item.total_spend / 10000000 : 0.5);
  entry.totalSpend += spendCr;
  entry.totalQty += item.qty || 100;
  entry.totalPos += 1;

  const vName = item.vendor_identified || 'Unknown Supplier';
  const existingV = entry.vendorSpends.get(vName);
  if (existingV) {
    existingV.spend += spendCr;
    existingV.poCount += 1;
  } else {
    entry.vendorSpends.set(vName, {
      spend: spendCr,
      vendorId: item.master_supplier_id || `VND-${Math.abs(vName.split('').reduce((a, b) => a + b.charCodeAt(0), 0))}`,
      poCount: 1
    });
  }
}

function buildStrategicItem(
  mat: MaterialVendorAggregate,
  primaryName: string,
  primaryData: { spend: number; vendorId: string; poCount: number },
  primaryShare: number,
  secondary: [string, { spend: number; vendorId: string; poCount: number }] | undefined,
  secondaryShare: number,
  isSole: boolean
): StrategicSingleVendorItem {
  const riskLevel = isSole ? 'SOLE_SOURCE_CRITICAL' : 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY';
  const riskScore = isSole ? 94 : 82;
  const urgency = isSole ? 'IMMEDIATE_ACTION' : 'HIGH_PRIORITY';

  return {
    material_code: mat.materialCode,
    material_desc: mat.materialDesc,
    total_spend_inr_cr: Number(mat.totalSpend.toFixed(2)),
    core_bucket: mat.coreBucket as CoreBucket,
    unspsc_code: mat.unspscCode,
    unspsc_commodity_title: mat.unspscCommodity,
    unspsc_class_title: mat.unspscClass,
    unspsc_family_title: `${mat.unspscClass} Family`,
    segment_code: mat.unspscCode.slice(0, 2),
    primary_vendor: {
      vendor_name: primaryName,
      vendor_id: primaryData.vendorId,
      spend_inr_cr: Number(primaryData.spend.toFixed(2)),
      share_percentage: Number(primaryShare.toFixed(1)),
      is_primary: true,
      is_secondary_single_digit: false
    },
    secondary_vendor: secondary
      ? {
          vendor_name: secondary[0],
          vendor_id: secondary[1].vendorId,
          spend_inr_cr: Number(secondary[1].spend.toFixed(2)),
          share_percentage: Number(secondaryShare.toFixed(1)),
          is_primary: false,
          is_secondary_single_digit: secondaryShare < 10
        }
      : undefined,
    risk_level: riskLevel,
    risk_score: riskScore,
    annual_quantity: mat.totalQty,
    unit_of_measure: mat.unit,
    po_count: mat.totalPos,
    mitigation_urgency: urgency,
    actionable_mitigation: isSole
      ? `Sole Source Alert: ${primaryName} holds 100% supply share. Qualify dual suppliers.`
      : `High Concentration: ${primaryName} controls ${primaryShare.toFixed(1)}% volume. Scale secondary.`,
    suggested_action_plan: [
      `Initiate vendor discovery and pre-qualification RFP for ${mat.materialDesc}`,
      'Implement dual-sourcing framework with minimum 20% volume split',
      'Establish indexed pricing corridor linked to commodity benchmarks'
    ]
  };
}
