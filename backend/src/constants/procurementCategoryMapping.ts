/**
 * Procurement Category Mapping & Classification Constants
 * Version: 1.0.0
 * Compliant with Rule 7, 8, 9: isolated constants, strictly typed, max 300 lines
 */

import authoritativeMapRaw from './authoritativeMaterialGroupMap.json';

export const UNMAPPED_CATEGORY_LABEL = 'Unmapped Category';

export const AUTHORITATIVE_MATERIAL_GROUP_TO_CATEGORY: Record<string, string> =
  authoritativeMapRaw as Record<string, string>;

const BASE_APPROVED_CATEGORIES: string[] = [
  'SERVICES',
  'E&I',
  'PROJECT CAPEX',
  'Packing',
  'PACKING',
  'HARDWARES',
  'REVNUE CAPEX',
  'PIPES & FITTINGS',
  'RGP',
  'MECHANICAL SPARES',
  'ADMIN',
  'FASTNERS',
  'SEALS & GASKETS',
  'BEARINGS & ACESSORIES',
  'PRINTING & STATIONARY',
  'MRP',
  'DTY MECHANICAL',
  'OEM SPARES',
  'VALVES',
  'DRIVE & TRANSMISSION',
  'MHE',
  'PAINT',
  'PUMPS AND SPARES',
  'STEEL',
  'SAFETY',
  'LAB CHEMICALS & EQUIP.',
  'LUBRICANTS',
  'FUEL',
  'CFHTM CAPEX',
  'COMPRESSOR SPARES',
  'PROJ SERVICES',
  'UTILITY SPARES',
  'FILTER & SPARES',
  'REFRACTORY',
  'UTILITY CHEMICALS',
  'INDUSTRIAL GAS',
  'CAPEX',
  'COOLING TOWER SPARES',
  'BOILER SPARES',
  'CEMENT',
  'DG SPARES',
  'Direct Materials',
  'Packaging Materials',
  'Packaging',
  'PACKAGING',
  'ELECTRICAL',
  'Electrical',
  'Chemicals',
  'Raw Materials',
  'Equipment',
  'Indirect & MRO',
  'Logistics & Freight',
  'Unclassified / Review Required'
];

export const APPROVED_PROCUREMENT_CATEGORIES: readonly string[] = Array.from(
  new Set([...BASE_APPROVED_CATEGORIES, ...Object.values(AUTHORITATIVE_MATERIAL_GROUP_TO_CATEGORY)])
);
