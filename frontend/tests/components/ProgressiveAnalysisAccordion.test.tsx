import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressiveAnalysisAccordion } from '../../src/components/ProgressiveAnalysisAccordion';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('ProgressiveAnalysisAccordion Component (Prompt 254)', () => {
  it('renders collapsed state with default view detailed analysis title', () => {
    render(
      <ProgressiveAnalysisAccordion summaryCount={5}>
        <div>Detailed calculation evidence body</div>
      </ProgressiveAnalysisAccordion>
    );

    expect(screen.getByText(UI_STRINGS.enterprisePrivacy.viewDetailedAnalysis)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('Detailed calculation evidence body')).not.toBeInTheDocument();
  });

  it('expands on button click and renders children content', () => {
    render(
      <ProgressiveAnalysisAccordion defaultExpanded={false}>
        <div>Detailed calculation evidence body</div>
      </ProgressiveAnalysisAccordion>
    );

    const toggleButton = screen.getByRole('button', {
      name: UI_STRINGS.enterprisePrivacy.viewDetailedAnalysis
    });
    fireEvent.click(toggleButton);

    expect(screen.getByText(UI_STRINGS.enterprisePrivacy.hideDetailedAnalysis)).toBeInTheDocument();
    expect(screen.getByText('Detailed calculation evidence body')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.enterprisePrivacy.hideDetailedAnalysis }));
    expect(screen.queryByText('Detailed calculation evidence body')).not.toBeInTheDocument();
  });

  it('supports custom title and custom class name', () => {
    const { container } = render(
      <ProgressiveAnalysisAccordion
        title="Show Calculation Evidence ▾"
        defaultExpanded={true}
        className="custom-accordion-class"
      >
        <span>Evidence text</span>
      </ProgressiveAnalysisAccordion>
    );

    expect(container.firstChild).toHaveClass('custom-accordion-class');
    expect(screen.getByText('Show Calculation Evidence ▾')).toBeInTheDocument();
    expect(screen.getByText('Evidence text')).toBeInTheDocument();
  });
});
