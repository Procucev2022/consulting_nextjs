/**
 * Canonical Schema Matching Field Definitions (Part A)
 * 
 * Identification and Supplier Canonical Fields.
 */

import type { CanonicalFieldName, FieldCategory } from '../types/schemaMatching';

export interface CanonicalFieldDefinition {
  field: CanonicalFieldName;
  label: string;
  category: FieldCategory;
  isMandatory: boolean;
  exactAliases: string[];
  normalizedAliases: string[];
  disallowedKeywords?: string[];
}

export const IDENTIFICATION_AND_SUPPLIER_FIELDS: CanonicalFieldDefinition[] = [
  // --- IDENTIFICATION ---
  {
    field: 'purchaseOrderNumber',
    label: 'Purchase Order Number',
    category: 'IDENTIFICATION',
    isMandatory: false,
    exactAliases: [
      'Purch.Doc.',
      'Purchasing Document',
      'PO Number',
      'PO No',
      'PO #',
      'Purchase Order',
      'Order Number',
      'Order No',
      'EBELN',
      'PO_NUMBER',
      'PURCHASE_ORDER'
    ],
    normalizedAliases: [
      'purchdoc',
      'purchasingdocument',
      'ponumber',
      'pono',
      'purchaseorder',
      'ordernumber',
      'orderno',
      'ebeln',
      'po',
      'docnumber'
    ]
  },
  {
    field: 'purchaseOrderLine',
    label: 'Purchase Order Line Item',
    category: 'IDENTIFICATION',
    isMandatory: false,
    exactAliases: [
      'Item',
      'PO Item',
      'Line Item',
      'Line No',
      'Line Number',
      'EBELP',
      'PO_LINE',
      'LINE_NO'
    ],
    normalizedAliases: [
      'item',
      'poitem',
      'lineitem',
      'lineno',
      'linenumber',
      'ebelp',
      'poline'
    ]
  },
  {
    field: 'documentNumber',
    label: 'Document / Transaction Number',
    category: 'IDENTIFICATION',
    isMandatory: false,
    exactAliases: [
      'Document',
      'Doc Number',
      'Transaction Number',
      'Invoice Number',
      'Reference Doc',
      'BELNR'
    ],
    normalizedAliases: [
      'document',
      'docnumber',
      'transactionnumber',
      'invoicenumber',
      'referencedoc',
      'belnr'
    ]
  },
  {
    field: 'documentDate',
    label: 'Posting / Document Date',
    category: 'IDENTIFICATION',
    isMandatory: true,
    exactAliases: [
      'Doc. Date',
      'Doc Date',
      'Document Date',
      'Posting Date',
      'Transaction Date',
      'PO Date',
      'Order Date',
      'Date',
      'BEDAT',
      'BUDAT',
      'ENTRY_DATE',
      'DOC_DATE'
    ],
    normalizedAliases: [
      'docdate',
      'documentdate',
      'postingdate',
      'transactiondate',
      'podate',
      'orderdate',
      'date',
      'bedat',
      'budat',
      'invoicedate'
    ]
  },
  {
    field: 'fiscalPeriod',
    label: 'Fiscal Period / Month',
    category: 'IDENTIFICATION',
    isMandatory: false,
    exactAliases: [
      'Purchase Month',
      'Fiscal Period',
      'Posting Period',
      'Fiscal Month',
      'Month',
      'MONAT'
    ],
    normalizedAliases: [
      'purchasemonth',
      'fiscalperiod',
      'postingperiod',
      'fiscalmonth',
      'month',
      'monat'
    ]
  },

  // --- SUPPLIER ---
  {
    field: 'vendorName',
    label: 'Supplier / Vendor Name',
    category: 'SUPPLIER',
    isMandatory: true,
    exactAliases: [
      'Vendor Name',
      'Supplier Name',
      'Vendor',
      'Supplier',
      'Vendor Name 1',
      'Supplier Description',
      'Partner Name',
      'NAME1',
      'LIFNR_NAME',
      'VENDOR_NAME'
    ],
    normalizedAliases: [
      'vendorname',
      'suppliername',
      'vendor',
      'supplier',
      'vendorname1',
      'supplierdescription',
      'partnername'
    ],
    disallowedKeywords: ['code', 'id', 'num', 'number', 'address', 'city', 'country', 'site']
  },
  {
    field: 'vendorCode',
    label: 'Supplier / Vendor Code',
    category: 'SUPPLIER',
    isMandatory: false,
    exactAliases: [
      'vendor code',
      'Vendor Code',
      'Supplier Code',
      'Supplier ID',
      'Vendor ID',
      'Vendor Number',
      'LIFNR',
      'SUPPLIER_ID',
      'VENDOR_CODE'
    ],
    normalizedAliases: [
      'vendorcode',
      'suppliercode',
      'supplierid',
      'vendorid',
      'vendornumber',
      'lifnr'
    ]
  }
];
