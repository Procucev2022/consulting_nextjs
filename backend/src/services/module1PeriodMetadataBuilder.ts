import type { VgtMonthlySpendItem, VgtPeriodMetadata } from '../types/module1Canonical';

export class Module1PeriodMetadataBuilder {
  public static getIndianFiscalYear(mKey: string): string {
    const parts = mKey.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (!year || !month) return 'FY22';
    const fyYear = month >= 4 ? year + 1 : year;
    return `FY${fyYear.toString().slice(-2)}`;
  }

  public static build(sortedSpend: VgtMonthlySpendItem[]): VgtPeriodMetadata {
    if (sortedSpend.length === 0) {
      return {
        minTransactionDate: 'N/A',
        maxTransactionDate: 'N/A',
        actualBillingMonths: 0,
        actualFiscalYears: [],
        actualMonthKeys: [],
        fiscalMonthCoverage: '0 months',
        availableMonthsByFiscalYear: {},
        missingMonthsByFiscalYear: {},
        hasMultiYearComparison: false,
        has36MonthCoverage: false
      };
    }

    const monthKeys = sortedSpend.map((m) => m.month_key || m.monthKey || '').filter(Boolean);
    const fySet = new Set<string>();
    const availableByFy: Record<string, number> = {};
    const monthsByFy: Record<string, number[]> = {};

    sortedSpend.forEach((m) => {
      const fy = m.fiscalYear || this.getIndianFiscalYear(m.month_key || m.monthKey || '');
      fySet.add(fy);
      availableByFy[fy] = (availableByFy[fy] || 0) + 1;

      const mNum = parseInt((m.month_key || m.monthKey || '').split('-')[1], 10);
      if (mNum) {
        if (!monthsByFy[fy]) monthsByFy[fy] = [];
        monthsByFy[fy].push(mNum);
      }
    });

    const actualFiscalYears = Array.from(fySet);
    const missingByFy: Record<string, string[]> = {};
    const monthNames: Record<number, string> = {
      1: 'January', 2: 'February', 3: 'March', 4: 'April',
      5: 'May', 6: 'June', 7: 'July', 8: 'August',
      9: 'September', 10: 'October', 11: 'November', 12: 'December'
    };

    actualFiscalYears.forEach((fy) => {
      missingByFy[fy] = [];
      const presentMonths = new Set(monthsByFy[fy] || []);
      const fyShortYear = parseInt(fy.replace('FY', ''), 10);
      const startYear = 2000 + fyShortYear - 1;
      const endYear = 2000 + fyShortYear;

      for (let m = 4; m <= 12; m++) {
        if (!presentMonths.has(m)) {
          missingByFy[fy].push(`${monthNames[m]} ${startYear}`);
        }
      }
      for (let m = 1; m <= 3; m++) {
        if (!presentMonths.has(m)) {
          missingByFy[fy].push(`${monthNames[m]} ${endYear}`);
        }
      }
    });

    const firstMonth = sortedSpend[0];
    const lastMonth = sortedSpend[sortedSpend.length - 1];
    const minDate = firstMonth.monthLabel || firstMonth.month_label || monthKeys[0] || '';
    const maxDate = lastMonth.monthLabel || lastMonth.month_label || monthKeys[monthKeys.length - 1] || '';

    const minDateFull = this.formatFullMonth(minDate);
    const maxDateFull = this.formatFullMonth(maxDate);

    const hasMultiYearComparison = actualFiscalYears.length >= 2;
    const has36MonthCoverage = sortedSpend.length >= 36;

    let coverageLabel = `${sortedSpend.length} Billing Months`;
    if (actualFiscalYears.length === 1) {
      const fy = actualFiscalYears[0];
      const count = availableByFy[fy];
      coverageLabel = `${fy} | ${count} of 12 months available`;
    }

    return {
      minTransactionDate: minDateFull,
      maxTransactionDate: maxDateFull,
      actualBillingMonths: sortedSpend.length,
      actualFiscalYears,
      actualMonthKeys: monthKeys,
      fiscalMonthCoverage: coverageLabel,
      availableMonthsByFiscalYear: availableByFy,
      missingMonthsByFiscalYear: missingByFy,
      hasMultiYearComparison,
      has36MonthCoverage
    };
  }

  private static formatFullMonth(label: string): string {
    const monthNumToName: Record<number, string> = {
      1: 'January', 2: 'February', 3: 'March', 4: 'April',
      5: 'May', 6: 'June', 7: 'July', 8: 'August',
      9: 'September', 10: 'October', 11: 'November', 12: 'December'
    };
    if (label.includes('-')) {
      const parts = label.split('-');
      const y = parts[0];
      const mNum = parseInt(parts[1], 10);
      if (y && mNum && monthNumToName[mNum]) {
        return `${monthNumToName[mNum]} ${y}`;
      }
    }
    const monthsFull: Record<string, string> = {
      Apr: 'April', May: 'May', Jun: 'June', Jul: 'July',
      Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November',
      Dec: 'December', Jan: 'January', Feb: 'February', Mar: 'March'
    };
    const parts = label.split(' ');
    if (parts.length === 2 && monthsFull[parts[0]]) {
      return `${monthsFull[parts[0]]} ${parts[1]}`;
    }
    return label;
  }
}
