export const INGESTION_WORKBOOK_MAX_ROWS = 10000;
export const INGESTION_WORKBOOK_BATCH_ROWS = 40;
export const INGESTION_WORKBOOK_INR_PER_CRORE = 10000000;

export const INGESTION_WORKBOOK_HEADERS = {
  poNumber: [/^(?:po|purchase[_\s-]*order)(?:[_\s-]*(?:number|no|num|id))?$/i, /purchase[_\s-]*document/i],
  poLine: [/^(?:po|purchase[_\s-]*order)[_\s-]*(?:line|item|position)$/i, /ebelp/i],
  transactionDate: [/^(?:document|posting|transaction|invoice)?[_\s-]*date$/i, /bedat|budat/i],
  supplierCode: [/^(?:supplier|vendor)[_\s-]*(?:code|id|number|no)$/i, /lifnr/i],
  supplierName: [/^(?:supplier|vendor|party)[_\s-]*(?:name|description)?$/i, /supplier.*name|vendor.*name/i],
  materialCode: [/^(?:material|item|product)[_\s-]*(?:code|id|number|no)$/i, /matnr/i],
  description: [/^(?:short[_\s-]*)?(?:text|description|item[_\s-]*name)$/i, /txz01/i],
  materialGroup: [/^(?:material[_\s-]*group|matkl|category|commodity)$/i, /material.*group/i],
  plant: [/^(?:plant|site|facility|werks)$/i],
  storageLocation: [/^(?:storage[_\s-]*location|lgort)$/i],
  quantity: [/^(?:order[_\s-]*)?(?:quantity|qty|units|ordered)$/i, /menge/i],
  orderUnit: [/^(?:order[_\s-]*)?(?:unit|uom)$/i, /meins/i],
  netPrice: [/^(?:net[_\s-]*price|unit[_\s-]*price|price|rate|netpr)$/i],
  currency: [/^(?:document[_\s-]*)?(?:currency|curr|crcy|waers)$/i],
  totalInr: [/^(?:total[_\s-]*)?(?:inr|spend[_\s-]*inr|amount[_\s-]*inr)$/i],
  totalInrCrores: [/^(?:total[_\s-]*)?(?:inr[_\s-]*)?(?:crores?|crs?)$/i, /total.*in.*crs?/i],
  priceUnit: [/^(?:price[_\s-]*unit|peinh)$/i],
  deletionIndicator: [/^(?:deletion[_\s-]*indicator|loekz)$/i],
  itemCategory: [/^(?:item[_\s-]*category|pstyp)$/i],
  accountAssignmentCategory: [/^(?:account[_\s-]*assignment[_\s-]*category|knttp)$/i]
} as const;

export const INGESTION_WORKBOOK_MESSAGES = {
  unsupportedType: 'Only XLSX, XLS, and CSV files can be imported into the procurement transaction ledger.',
  invalidWorkbook: 'The uploaded workbook could not be read. Verify the file is a valid XLSX, XLS, or CSV document.',
  tooManyRows: (maxRows: number): string => `The workbook exceeds the ${maxRows} row import limit. Split the file and retry.`,
  noRows: 'The uploaded workbook contains no transaction rows.'
} as const;
