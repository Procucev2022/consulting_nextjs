import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveBriefHeaderNav } from '../../src/components/executiveBrief/ExecutiveBriefHeaderNav';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';

describe('ExecutiveBriefHeaderNav', () => {
  const defaultProps = {
    clientProfile: {
      clientName: 'UltraTech Cement Limited',
      analysisPeriod: 'April 2024 – March 2026 (24 Months)',
      group: 'Aditya Birla Group',
      reportVersion: 'EXECUTIVE_BRIEF_V1.1',
      confidentiality: 'CONFIDENTIAL — CLIENT USE ONLY',
      status: 'CERTIFIED / READY'
    },
    isReady: true,
    onNavigateModule: vi.fn(),
    activeModuleKey: 'brief'
  };

  it('renders top metadata correctly from props', () => {
    render(<ExecutiveBriefHeaderNav {...defaultProps} />);

    expect(screen.getByText('UltraTech Cement Limited')).toBeInTheDocument();
    expect(screen.getByText('April 2024 – March 2026 (24 Months)')).toBeInTheDocument();
    expect(screen.getByText('EXECUTIVE_BRIEF_V1.1')).toBeInTheDocument();
    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.readyBadge)).toBeInTheDocument();
    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.panelTitle)).toBeInTheDocument();
  });

  it('renders pending status badge when isReady is false', () => {
    render(
      <ExecutiveBriefHeaderNav
        {...defaultProps}
        isReady={false}
        clientProfile={{ ...defaultProps.clientProfile, status: 'AWAITING ENGINE' }}
      />
    );

    const badge = screen.getByTestId('brief-ready-badge');
    expect(badge).toHaveTextContent('AWAITING ENGINE');
  });

  it('handles module pipeline navigation click', () => {
    const onNavigateModule = vi.fn();
    render(<ExecutiveBriefHeaderNav {...defaultProps} onNavigateModule={onNavigateModule} />);

    const module1Btn = screen.getByRole('button', { name: /MODULE 1/i });
    fireEvent.click(module1Btn);
    expect(onNavigateModule).toHaveBeenCalledWith('module1');
  });
});
