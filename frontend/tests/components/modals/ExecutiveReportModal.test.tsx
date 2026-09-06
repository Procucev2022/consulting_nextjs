import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutiveReportModal } from '../../../src/components/modals/ExecutiveReportModal';
import { mockTenant, mockSavingsOpportunities } from '../../../src/data/mockData';

import { UI_STRINGS } from '../../../src/constants/uiStrings';

describe('ExecutiveReportModal Component', () => {
  it('renders null when not open', () => {
    const { container } = render(
      <ExecutiveReportModal
        isOpen={false}
        onClose={vi.fn()}
        tenant={mockTenant}
        opportunities={mockSavingsOpportunities}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders report details and handles print and close', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const onClose = vi.fn();

    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={onClose}
        tenant={mockTenant}
        opportunities={mockSavingsOpportunities}
      />
    );

    expect(screen.getByText(UI_STRINGS.modals.report.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.modals.report.section2Title)).toBeInTheDocument();

    const printBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.modals.report.printPdf, 'i') });
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalled();

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(onClose).toHaveBeenCalled();

    printSpy.mockRestore();
  });

  it('renders correctly with opportunity missing est_savings_inr_cr to exercise calculation fallback', () => {
    const oppWithoutInrCr = [
      {
        opp_id: 'OPP-NO-INR',
        title: 'Custom Opportunity',
        category: 'Packaging',
        est_savings: 100000,
        est_savings_inr_cr: undefined as any,
        contract_leak_type: 'Pricing',
        recommended_action: 'Renegotiate',
        push_to_module: 'DPS NXT' as const,
        status: 'Identified' as const
      }
    ];

    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={vi.fn()}
        tenant={mockTenant}
        opportunities={oppWithoutInrCr as any}
      />
    );

    expect(screen.getByText('OPP-NO-INR')).toBeInTheDocument();
  });
});
