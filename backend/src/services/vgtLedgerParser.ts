import * as XLSX from 'xlsx';
import type { RawTransactionLedgerRecord } from '../types';
import { VGT_DATASET_FILENAME } from '../constants/vgtConstants';

export class VgtLedgerParser {
  public static parseNum(val: unknown): number {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }

  public static parseStr(val: unknown, fallback: string): string {
    return val != null ? String(val) : fallback;
  }

  public static parseRawRows(ws: XLSX.WorkSheet): RawTransactionLedgerRecord[] {
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
    return rawRows.map((r, idx) => VgtLedgerParser.mapRawRow(r, idx));
  }

  public static mapRawRow(r: Record<string, unknown>, idx: number): RawTransactionLedgerRecord {
    const del = r['Deletion Indicator'] ?? r['Deletion indicator'];
    const qty = VgtLedgerParser.parseNum(r['Order Quantity']);
    const netPrice = VgtLedgerParser.parseNum(r['Net Price'] ?? r['Net price']);
    const lineSpend = VgtLedgerParser.parseNum(r['Net Value in INR'] ?? r['Net Order Value']);
    const supplier = VgtLedgerParser.parseStr(r['Name of Supplier'] ?? r['Vendor Name'], 'UNKNOWN_VENDOR');
    const docDate = (r['Posting Date'] ?? r['Document Date']) as string | number;
    return {
      recordId: `VGT-ROW-${String(idx + 1).padStart(6, '0')}`,
      sourceRow: idx + 2,
      sourceFile: VGT_DATASET_FILENAME,
      poNumber: VgtLedgerParser.parseStr(r['Purchasing Document'], ''),
      poLine: VgtLedgerParser.parseStr(r['Item'], '10'),
      documentDateRaw: docDate,
      supplierCode: VgtLedgerParser.parseStr(r['Vendor'] ?? r['Vendor Code'], 'VGT-VEND'),
      supplierName: supplier,
      materialCode: VgtLedgerParser.parseStr(r['Material'], ''),
      shortText: VgtLedgerParser.parseStr(r['Short Text'] ?? r['Material Description'], ''),
      materialGroup: VgtLedgerParser.parseStr(r['Material Group'], 'DIRECT'),
      plant: VgtLedgerParser.parseStr(r['Plant'], '1000'),
      orderQuantity: qty,
      orderUnit: VgtLedgerParser.parseStr(r['Order Unit'], 'EA'),
      netPrice,
      currency: VgtLedgerParser.parseStr(r['Currency'], 'INR').trim().toUpperCase(),
      totalInrRaw: lineSpend,
      totalInCrsRaw: Number((lineSpend / 10000000).toFixed(6)),
      deletionIndicator: del != null && String(del).trim() !== '' ? String(del).trim() : undefined
    };
  }
}
