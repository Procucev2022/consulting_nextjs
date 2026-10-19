/**
 * Helper utilities for assessment dataset row normalization
 */

export function parseExcelDate(val: unknown): { isoDate: string; monthKey: string; fiscalYear: string } {
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    const mNum = jsDate.getUTCMonth() + 1;
    const fyYear = mNum >= 4 ? y + 1 : y;
    return {
      isoDate: `${y}-${m}-${d}`,
      monthKey: `${y}-${m}`,
      fiscalYear: `FY${fyYear.toString().slice(-2)}`
    };
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    const clean = val.trim();
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getUTCFullYear();
      const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
      const d = String(parsed.getUTCDate()).padStart(2, '0');
      const mNum = parsed.getUTCMonth() + 1;
      const fyYear = mNum >= 4 ? y + 1 : y;
      return {
        isoDate: `${y}-${m}-${d}`,
        monthKey: `${y}-${m}`,
        fiscalYear: `FY${fyYear.toString().slice(-2)}`
      };
    }
  }
  return { isoDate: '2023-01-15', monthKey: '2023-01', fiscalYear: 'FY23' };
}

export function findValueByKeys(row: Record<string, unknown>, candidateKeys: string[]): unknown {
  const rowKeys = Object.keys(row);
  for (const cand of candidateKeys) {
    const candNorm = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const k of rowKeys) {
      const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (kNorm === candNorm) {
        const val = row[k];
        if (val !== undefined && val !== null && (typeof val !== 'string' || val.trim().length > 0)) {
          return val;
        }
      }
    }
  }
  return undefined;
}

export function isRowDeleted(row: Record<string, unknown>): boolean {
  const delVal = findValueByKeys(row, ['Deletion Indicator', 'Deletion indicator', 'LOEKZ']);
  return delVal === 'D' || delVal === 'X' || delVal === true || String(delVal).toLowerCase() === 'deleted';
}
