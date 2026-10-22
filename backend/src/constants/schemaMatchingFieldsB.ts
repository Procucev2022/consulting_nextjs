/**
 * Canonical Schema Matching Field Definitions (Part B)
 * 
 * Material Canonical Fields.
 */

import type { CanonicalFieldDefinition } from './schemaMatchingFieldsA';

export const MATERIAL_FIELDS: CanonicalFieldDefinition[] = [
  // --- MATERIAL ---
  {
    field: 'materialCode',
    label: 'Material / Item Code',
    category: 'MATERIAL',
    isMandatory: false,
    exactAliases: [
      'Material',
      'Material Code',
      'Item Code',
      'Item No',
      'SKU',
      'Product Code',
      'Part Number',
      'Part No',
      'MATNR',
      'ITEM_CODE',
      'MATERIAL_NUMBER'
    ],
    normalizedAliases: [
      'material',
      'materialcode',
      'itemcode',
      'sku',
      'productcode',
      'partnumber',
      'partno',
      'matnr'
    ],
    disallowedKeywords: ['group', 'desc', 'description', 'text', 'category', 'class']
  },
  {
    field: 'materialDescription',
    label: 'Material / Item Description',
    category: 'MATERIAL',
    isMandatory: false,
    exactAliases: [
      'Short Text',
      'Material Description',
      'Item Description',
      'Product Description',
      'Description',
      'Part Description',
      'TXZ01',
      'ITEM_DESCRIPTION',
      'MATERIAL_DESC'
    ],
    normalizedAliases: [
      'shorttext',
      'materialdescription',
      'itemdescription',
      'productdescription',
      'description',
      'partdescription',
      'txz01',
      'itemdesc'
    ]
  },
  {
    field: 'materialGroup',
    label: 'Material Group / Commodity',
    category: 'MATERIAL',
    isMandatory: false,
    exactAliases: [
      'Matl Group',
      'Material Group',
      'Category',
      'Commodity',
      'Commodity Code',
      'UNSPSC',
      'Product Group',
      'MATKL',
      'MATERIAL_GROUP'
    ],
    normalizedAliases: [
      'matlgroup',
      'materialgroup',
      'category',
      'commodity',
      'commoditycode',
      'unspsc',
      'productgroup',
      'matkl'
    ]
  },
  {
    field: 'procurementCategory',
    label: 'Procurement Category',
    category: 'MATERIAL',
    isMandatory: false,
    exactAliases: [
      'Procurement Category',
      'PO Category',
      'PO_Category',
      'Purchasing Category',
      'Spend Category',
      'Class',
      'Class Title',
      'Commodity Title',
      'Segment',
      'Family',
      'Department',
      'Dept',
      'Department Name'
    ],
    normalizedAliases: [
      'procurementcategory',
      'pocategory',
      'po_category',
      'purchasingcategory',
      'spendcategory',
      'class',
      'classtitle',
      'commoditytitle',
      'segment',
      'family',
      'department',
      'dept',
      'departmentname'
    ]
  }
];
