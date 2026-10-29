import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PCBIValidateTab } from '../../../../src/components/admin/pcbi/PCBIValidateTab';
import { UI_STRINGS } from '../../../../src/constants';
import type { PCBIValidationSummary } from '../../../../src/types/pcbiAdmin';

const buildSummary = (overrides: Partial<PCBIValidationSummary> = {}): PCBIValidationSummary => ({
  totalRecords: 10,
  validRecords: 10,
  warningRecords: 0,
  errorRecords: 0,
  blockingErrorCount: 0,
  warningCount: 0,
  informationCount: 0,
  aQualityCount: 5,
  bQualityCount: 3,
  cQualityCount: 2,
  avgBenchmarkability: 92,
  dateStart: '2020-01-01',
  dateEnd: '2026-01-01',
  issues: [],
  ...overrides
});

describe('PCBIValidateTab coverage', () => {
  it('enables the import gate and proceeds to preview when there are no blocking errors', () => {
    const onProceed = vi.fn();
    render(<PCBIValidateTab validationSummary={buildSummary()} onProceedToPreview={onProceed} />);

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.readyForImport)).toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.pcbiAdmin.blockingGateNotice)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiAdmin.proceedToPreview }));
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it('renders the constituent review table and locks the gate when blocking errors exist', () => {
    render(
      <PCBIValidateTab
        validationSummary={buildSummary({
          blockingErrorCount: 2,
          errorRecords: 2,
          constituentTotals: [
            {
              pcbiId: 'PCBI-001',
              benchmarkName: 'Cement Standard',
              totalWeight: 98.5,
              differenceFrom100: -1.5,
              status: 'WARNING'
            }
          ]
        })}
        onProceedToPreview={vi.fn()}
      />
    );

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.constituentReviewTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.blockingGateNotice)).toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.pcbiAdmin.readyForImport)).not.toBeInTheDocument();
  });

  it('offers no gate or proceed action until validation data is available', () => {
    const onProceed = vi.fn();
    render(<PCBIValidateTab validationSummary={null} onProceedToPreview={onProceed} />);

    expect(screen.queryByRole('button', { name: UI_STRINGS.pcbiAdmin.proceedToPreview })).not.toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.pcbiAdmin.readyForImport)).not.toBeInTheDocument();
    expect(onProceed).not.toHaveBeenCalled();
  });

  it('omits the constituent review table when constituent totals are empty', () => {
    render(
      <PCBIValidateTab
        validationSummary={buildSummary({ constituentTotals: [] })}
        onProceedToPreview={vi.fn()}
      />
    );

    expect(screen.queryByText(UI_STRINGS.pcbiAdmin.constituentReviewTitle)).not.toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.readyForImport)).toBeInTheDocument();
  });
});
