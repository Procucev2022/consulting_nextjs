/**
 * Module 3 PCBI — Missing-Index Gap List Export Helper
 * Formats gap list records for CSV and analytical export.
 * Conforms to Rule 8, Rule 9, and file length <= 300 lines.
 */

import type { PCBIMissingIndexGapItem } from '../types/module3PcbiGapList';

export class Module3PcbiGapExportHelper {
  public static buildCsv(items: PCBIMissingIndexGapItem[]): string {
    const headers = [
      'Material Code',
      'Material Description',
      'Commodity Classification',
      'UNSPSC Code',
      'Existing Grade / Specification',
      'Customer Spend (INR Cr)',
      'Customer Spend (INR)',
      'Transaction Count',
      'Spend Share %',
      'PCBI Series ID',
      'Benchmark Series Name',
      'Benchmark Publisher / Source',
      'Source Status',
      'Observation Coverage',
      'Latest Observation Date',
      'Gap Status',
      'Gap Reason',
      'Next Action Required'
    ];

    const rows = items.map((item) => [
      `"${item.materialCode}"`,
      `"${item.materialDescription.replace(/"/g, '""')}"`,
      `"${item.commodityClassification.replace(/"/g, '""')}"`,
      `"${item.unspscCode}"`,
      `"${item.existingGradeSpecification.replace(/"/g, '""')}"`,
      item.customerSpendCr.toFixed(4),
      item.customerSpendInr.toFixed(2),
      item.transactionCount,
      `${item.spendSharePct.toFixed(2)}%`,
      `"${item.pcbiSeriesId || 'UNMAPPED'}"`,
      `"${(item.benchmarkSeriesName || 'NONE').replace(/"/g, '""')}"`,
      `"${item.benchmarkPublisherSource.replace(/"/g, '""')}"`,
      `"${item.sourceStatus.replace(/"/g, '""')}"`,
      `"${item.observationCoverage.replace(/"/g, '""')}"`,
      `"${item.latestObservationDate || 'NONE'}"`,
      `"${item.gapStatus}"`,
      `"${item.gapReason.replace(/"/g, '""')}"`,
      `"${item.nextActionRequired.replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }
}
