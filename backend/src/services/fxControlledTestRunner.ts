/**
 * Controlled Mixed-Currency Test Runner (Command 4, Sections 16 & 23)
 * Evaluates mixed currency handling across INR, USD, EUR, GBP, JPY, AED, SAR
 * including normal business days, Saturdays, Sundays, and market holidays.
 */

import type {
  FxTransactionInput,
  FxNormalizedTransaction,
  FxSpendSummary
} from '../types/fxReference';
import { fxReferenceService } from './fxReferenceService';

export interface ControlledTestExecutionResult {
  testDataset: FxTransactionInput[];
  normalizedTransactions: FxNormalizedTransaction[];
  summary: FxSpendSummary;
  reconciliationPassed: boolean;
  varianceInr: number;
}

export class FxControlledTestRunner {
  public static getControlledTestDataset(): FxTransactionInput[] {
    return [
      {
        transactionId: 'TX-CTRL-001-INR-BUSDAY',
        originalValue: 1000000.0,
        originalCurrency: 'INR',
        transactionDate: '2026-05-15', // Normal business day (Friday)
        poNumber: 'PO-CTRL-001',
        lineItem: 1,
        supplierName: 'Bharat Infrastructure Raw Materials',
        materialDescription: 'Portland Pozzolana Clinker'
      },
      {
        transactionId: 'TX-CTRL-002-USD-BUSDAY',
        originalValue: 10000.0,
        originalCurrency: 'USD',
        transactionDate: '2026-05-15', // Normal business day (Friday)
        poNumber: 'PO-CTRL-002',
        lineItem: 1,
        supplierName: 'Global Heavy Equipment Inc',
        materialDescription: 'Kiln Hydraulic Actuators'
      },
      {
        transactionId: 'TX-CTRL-003-EUR-SATURDAY',
        originalValue: 5000.0,
        originalCurrency: 'EUR',
        transactionDate: '2026-05-16', // Saturday (Weekend -> Fallback to Friday 2026-05-15)
        poNumber: 'PO-CTRL-003',
        lineItem: 1,
        supplierName: 'Eurotech Industrial Automation GmbH',
        materialDescription: 'Rotary Sensor Controller'
      },
      {
        transactionId: 'TX-CTRL-004-GBP-SUNDAY',
        originalValue: 4000.0,
        originalCurrency: 'GBP',
        transactionDate: '2026-05-17', // Sunday (Weekend -> Fallback to Friday 2026-05-15)
        poNumber: 'PO-CTRL-004',
        lineItem: 1,
        supplierName: 'British Specialized Bearings Ltd',
        materialDescription: 'High Precision Mill Rollers'
      },
      {
        transactionId: 'TX-CTRL-005-JPY-HOLIDAY',
        originalValue: 1000000.0,
        originalCurrency: 'JPY',
        transactionDate: '2024-08-15', // Known National Market Holiday (Independence Day -> Fallback to 2024-08-14)
        poNumber: 'PO-CTRL-005',
        lineItem: 1,
        supplierName: 'Nippon Conveyor Systems KK',
        materialDescription: 'Synthetic Heat Resistant Belting'
      },
      {
        transactionId: 'TX-CTRL-006-AED-VALID-2026',
        originalValue: 20000.0,
        originalCurrency: 'AED',
        transactionDate: '2026-05-15', // Valid official published date (Inception 2026-01-05 onwards)
        poNumber: 'PO-CTRL-006',
        lineItem: 1,
        supplierName: 'Gulf Petroleum Additives FZE',
        materialDescription: 'Grinding Aid Formulation'
      },
      {
        transactionId: 'TX-CTRL-007-AED-UNAVAILABLE-HISTORICAL',
        originalValue: 15000.0,
        originalCurrency: 'AED',
        transactionDate: '2024-05-15', // Historical date preceding official RBI AED publication -> Must remain PENDING
        poNumber: 'PO-CTRL-007',
        lineItem: 1,
        supplierName: 'Middle East Packing Solutions LLC',
        materialDescription: 'HDPE Valve Sacks'
      },
      {
        transactionId: 'TX-CTRL-008-SAR-PENDING-SOURCE',
        originalValue: 25000.0,
        originalCurrency: 'SAR',
        transactionDate: '2026-05-15', // Currency classified PENDING_SOURCE -> Must NEVER synthesize rate
        poNumber: 'PO-CTRL-008',
        lineItem: 1,
        supplierName: 'Riyadh Chemical Industrial Corp',
        materialDescription: 'Calcium Carbonate Reagents'
      }
    ];
  }

  public static runControlledTest(): ControlledTestExecutionResult {
    const testDataset = FxControlledTestRunner.getControlledTestDataset();
    const result = fxReferenceService.normalizeTransactions(testDataset);

    return {
      testDataset,
      normalizedTransactions: result.normalizedTransactions,
      summary: result.summary,
      reconciliationPassed: result.summary.reconciliationVariance === 0.0,
      varianceInr: result.summary.reconciliationVariance
    };
  }
}
