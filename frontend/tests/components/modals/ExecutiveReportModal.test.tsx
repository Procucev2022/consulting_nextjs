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

  it('renders cover slide and handles print, next, prev, and close actions', () => {
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

    // Assert Cover Slide Title
    expect(screen.getAllByText(UI_STRINGS.presentation.cover.deckTitle)[0]).toBeInTheDocument();
    expect(screen.getAllByText(mockTenant.enterprise_name)[0]).toBeInTheDocument();

    // Print Button (exact string name to avoid unescaped parens in regex)
    const printBtn = screen.getByRole('button', { name: UI_STRINGS.presentation.exportPdf });
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalled();

    // Navigate to next slide (Slide 2: Confidentiality)
    const nextBtn = screen.getByRole('button', { name: UI_STRINGS.presentation.navNext });
    fireEvent.click(nextBtn);
    expect(screen.getAllByText(UI_STRINGS.presentation.confidentiality.title)[0]).toBeInTheDocument();

    // Navigate to next slide (Slide 3: About Procucev)
    fireEvent.click(nextBtn);
    expect(screen.getAllByText(UI_STRINGS.presentation.about.pillBadge)[0]).toBeInTheDocument();

    // Navigate back to previous slide
    const prevBtn = screen.getByRole('button', { name: UI_STRINGS.presentation.navPrev });
    fireEvent.click(prevBtn);
    expect(screen.getAllByText(UI_STRINGS.presentation.confidentiality.title)[0]).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByRole('button', { name: UI_STRINGS.presentation.closeModal });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();

    printSpy.mockRestore();
  });

  it('handles jump to slide via select dropdown', () => {
    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={vi.fn()}
        tenant={mockTenant}
        opportunities={mockSavingsOpportunities}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '9' } });

    // Should now show Slide 9: Savings Levers Roadmap
    expect(screen.getAllByText(UI_STRINGS.presentation.savingsLevers.title)[0]).toBeInTheDocument();
  });

  it('toggles all slides view mode', () => {
    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={vi.fn()}
        tenant={mockTenant}
        opportunities={mockSavingsOpportunities}
      />
    );

    const toggleBtn = screen.getByRole('button', {
      name: UI_STRINGS.presentation.viewAll
    });
    fireEvent.click(toggleBtn);

    // In all slides mode, all slide titles should be rendered
    expect(screen.getAllByText(UI_STRINGS.presentation.cover.deckTitle)[0]).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.presentation.confidentiality.title)[0]).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.presentation.about.pillBadge)[0]).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.presentation.scorecard.title)[0]).toBeInTheDocument();
    expect(screen.getAllByText(UI_STRINGS.presentation.governance.title)[0]).toBeInTheDocument();

    // Toggle back to single slide mode
    const singleSlideToggleBtn = screen.getByRole('button', {
      name: UI_STRINGS.presentation.viewSingle
    });
    fireEvent.click(singleSlideToggleBtn);
  });

  it('renders opportunity fallback in slide 9 when empty opportunities list is provided', () => {
    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={vi.fn()}
        tenant={mockTenant}
        opportunities={[]}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '9' } });

    expect(screen.getAllByText(UI_STRINGS.presentation.savingsLevers.title)[0]).toBeInTheDocument();
    expect(screen.getAllByText('Direct Chemical Raw Material Index Pegging')[0]).toBeInTheDocument();
  });

  it('falls back to cover slide when an unhandled slide number is selected', () => {
    render(
      <ExecutiveReportModal
        isOpen={true}
        onClose={vi.fn()}
        tenant={mockTenant}
        opportunities={mockSavingsOpportunities}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '99' } });

    expect(screen.getAllByText(UI_STRINGS.presentation.cover.deckTitle)[0]).toBeInTheDocument();
  });
});
