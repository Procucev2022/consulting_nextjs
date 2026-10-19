/**
 * Canonical Schema Matching Field Definitions (Part C)
 * 
 * Transaction and System Canonical Fields.
 */

import type { CanonicalFieldDefinition } from './schemaMatchingFieldsA';

export const TRANSACTION_AND_SYSTEM_FIELDS: CanonicalFieldDefinition[] = [
  // --- TRANSACTION ---
  {
    field: 'quantity',
    label: 'Order Quantity',
    category: 'TRANSACTION',
    isMandatory: false,
    exactAliases: [
      'Quantity',
      'Order Quantity',
      'Qty',
      'PO Quantity',
      'Volume',
      'MENGE',
      'ORDER_QTY'
    ],
    normalizedAliases: [
      'quantity',
      'orderquantity',
      'qty',
      'poquantity',
      'volume',
      'menge'
    ],
    disallowedKeywords: ['price', 'rate', 'amount', 'value']
  },
  {
    field: 'unitOfMeasure',
    label: 'Unit of Measure',
    category: 'TRANSACTION',
    isMandatory: false,
    exactAliases: [
      'Order Unit',
      'Unit',
      'UOM',
      'Unit of Measure',
      'Measure Unit',
      'MEINS',
      'U_O_M'
    ],
    normalizedAliases: [
      'orderunit',
      'unit',
      'uom',
      'unitofmeasure',
      'meins'
    ],
    disallowedKeywords: ['price', 'amount', 'value']
  },
  {
    field: 'unitPrice',
    label: 'Unit Price',
    category: 'TRANSACTION',
    isMandatory: false,
    exactAliases: [
      'Net price',
      'Net Price',
      'Unit Price',
      'Price',
      'Unit Rate',
      'Rate',
      'NETPR',
      'UNIT_PRICE'
    ],
    normalizedAliases: [
      'netprice',
      'unitprice',
      'price',
      'unitrate',
      'rate',
      'netpr'
    ],
    disallowedKeywords: ['total', 'net value', 'net amount', 'spend', 'extended']
  },
  {
    field: 'netSpendAmount',
    label: 'Net Spend Amount',
    category: 'TRANSACTION',
    isMandatory: true,
    exactAliases: [
      'Net Value',
      'Net Order Value',
      'Spend',
      'Amount',
      'Line Amount',
      'Extended Amount',
      'Net Amount',
      'Total Amount',
      'Total Value',
      'Spend Value',
      'WRBTR',
      'NETWR',
      'LINE_AMOUNT'
    ],
    normalizedAliases: [
      'netvalue',
      'netordervalue',
      'spend',
      'amount',
      'lineamount',
      'extendedamount',
      'netamount',
      'totalamount',
      'totalvalue',
      'spendvalue',
      'wrbtr',
      'netwr'
    ],
    disallowedKeywords: [
      'tax',
      'vat',
      'gst',
      'discount',
      'unit price',
      'net price',
      'price',
      'rate',
      'quantity',
      'qty',
      'balance',
      'open',
      'freight',
      'in inr',
      'in crs',
      'in cr'
    ]
  },
  {
    field: 'currency',
    label: 'Currency',
    category: 'TRANSACTION',
    isMandatory: false,
    exactAliases: [
      'Crcy',
      'Currency',
      'Currency Code',
      'Doc Currency',
      'Order Currency',
      'Doc. Crcy',
      'WAERS',
      'CURRENCY'
    ],
    normalizedAliases: [
      'crcy',
      'currency',
      'currencycode',
      'doccurrency',
      'ordercurrency',
      'waers'
    ]
  },
  {
    field: 'convertedSpendAmount',
    label: 'Converted Spend Amount',
    category: 'TRANSACTION',
    isMandatory: false,
    exactAliases: [
      'Net Value In INR',
      'Net Value in INR',
      'Net Value in Crs.',
      'Net Value in Crs',
      'Converted Spend',
      'Converted Amount',
      'Spend INR',
      'Spend Cr'
    ],
    normalizedAliases: [
      'netvalueininr',
      'netvalueincrs',
      'convertedspend',
      'convertedamount',
      'spendinr',
      'spendcr'
    ]
  },
  {
    field: 'plant',
    label: 'Plant / Site / Facility',
    category: 'TRANSACTION',
    isMandatory: false,
    exactAliases: [
      'Plnt',
      'Plant',
      'Site',
      'Location',
      'Facility',
      'Factory',
      'WERKS',
      'OPERATING_UNIT'
    ],
    normalizedAliases: [
      'plnt',
      'plant',
      'site',
      'location',
      'facility',
      'factory',
      'werks'
    ]
  },

  // --- SYSTEM / QUALITY ---
  {
    field: 'deletionIndicator',
    label: 'Deletion Indicator',
    category: 'SYSTEM',
    isMandatory: false,
    exactAliases: [
      'Rel.stat',
      'Deletion Indicator',
      'Deletion indicator',
      'LOEKZ',
      'DELETED'
    ],
    normalizedAliases: [
      'relstat',
      'deletionindicator',
      'loekz',
      'deleted',
      'deleteflag'
    ]
  }
];
