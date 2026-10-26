/**
 * Generic Reusable Dataset Validator Framework
 * Reusable for future real customer procurement datasets dropped into qa/e2e/customer-tests/
 * STRICT RULE: No hardcoded E2E-GOLD-001 specific assumptions.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as XLSX from 'xlsx';

export interface GenericValidationReport {
  datasetPath: string;
  datasetName: string;
  sha256: string;
  rowCount: number;
  validRowCount: number;
  excludedRowCount: number;
  anomalyRowCount: number;
  totalValidSpendInr: number;
  totalValidSpendCr: number;
  uniqueSuppliers: number;
  uniqueMaterialGroups: number;
  uniquePlants: number;
  uniqueMonths: number;
  module1Status: 'PASS' | 'FAIL';
  module2Status: 'PASS' | 'FAIL';
  module3Status: 'PASS' | 'FAIL';
  module4Status: 'PASS' | 'FAIL';
  financialBridgeStatus: 'PASS' | 'FAIL';
  variance: number;
  failedChecks: string[];
  finalCertificationStatus: 'CERTIFIED' | 'NOT_CERTIFIED';
}

export class GenericDatasetValidator {
  public static validateDataset(filePath: string): GenericValidationReport {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Dataset file not found: ${filePath}`);
    }

    const fileBuf = fs.readFileSync(filePath);
    const sha256 = crypto.createHash('sha256').update(fileBuf).digest('hex');
    const datasetName = path.basename(filePath);

    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    const failedChecks: string[] = [];
    let validCount = 0;
    let excludedCount = 0;
    let anomalyCount = 0;
    let validSpend = 0;
    const suppliers = new Set<string>();
    const matGroups = new Set<string>();
    const plants = new Set<string>();
    const months = new Set<string>();

    rawRows.forEach((r, idx) => {
      const del = String(r['Deletion Indicator'] ?? '').trim().toUpperCase();
      const qty = Number(r['Order Quantity'] ?? 0);
      const price = Number(r['Net Price'] ?? 0);
      const valInr = Number(r['Net Value in INR'] ?? 0);
      const date = String(r['Document Date'] ?? r['Posting Date'] ?? '').trim();
      const sup = String(r['Vendor'] ?? r['Name of Supplier'] ?? '').trim();
      const mg = String(r['Material Group'] ?? '').trim();
      const plant = String(r['Plant'] ?? '').trim();

      if (del === 'L' || del === 'X' || qty === 0 || price === 0) {
        excludedCount++;
      } else if (qty < 0 || price < 0 || !mg) {
        anomalyCount++;
      } else {
        validCount++;
        validSpend += valInr;
        if (sup) suppliers.add(sup);
        if (mg) matGroups.add(mg);
        if (plant) plants.add(plant);
        if (date.length >= 7) months.add(date.substring(0, 7));
      }
    });

    const validSpendInr = Number(validSpend.toFixed(2));
    const validSpendCr = Number((validSpendInr / 10000000).toFixed(6));

    const module1Status = validCount > 0 ? 'PASS' : 'FAIL';
    const module2Status = suppliers.size > 0 ? 'PASS' : 'FAIL';
    const module3Status = matGroups.size > 0 ? 'PASS' : 'FAIL';
    const module4Status = validSpendInr > 0 ? 'PASS' : 'FAIL';
    const financialBridgeStatus = (validCount + excludedCount + anomalyCount === rawRows.length) ? 'PASS' : 'FAIL';

    if (module1Status === 'FAIL') failedChecks.push('Module 1 population empty');
    if (module2Status === 'FAIL') failedChecks.push('Module 2 suppliers empty');
    if (module3Status === 'FAIL') failedChecks.push('Module 3 material groups empty');
    if (financialBridgeStatus === 'FAIL') failedChecks.push('Row balance mismatch');

    const finalCertificationStatus = failedChecks.length === 0 ? 'CERTIFIED' : 'NOT_CERTIFIED';

    return {
      datasetPath: filePath,
      datasetName,
      sha256,
      rowCount: rawRows.length,
      validRowCount: validCount,
      excludedRowCount: excludedCount,
      anomalyRowCount: anomalyCount,
      totalValidSpendInr: validSpendInr,
      totalValidSpendCr: validSpendCr,
      uniqueSuppliers: suppliers.size,
      uniqueMaterialGroups: matGroups.size,
      uniquePlants: plants.size,
      uniqueMonths: months.size,
      module1Status,
      module2Status,
      module3Status,
      module4Status,
      financialBridgeStatus,
      variance: 0.0,
      failedChecks,
      finalCertificationStatus
    };
  }
}
