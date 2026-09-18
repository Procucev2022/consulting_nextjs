import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PipelineBar } from '../../src/components/PipelineBar';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('PipelineBar Component', () => {
  it('renders all KPI cards correctly', () => {
    render(<PipelineBar activeTab="module1" onSelectTab={vi.fn()} />);

    expect(screen.getByText(UI_STRINGS.pipeline.kpis.historicalIngestion.label)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pipeline.kpis.realTimeProcessing.label)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pipeline.kpis.avgIdentifiedSavings.label)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pipeline.kpis.fasterConversion.label)).toBeInTheDocument();
  });

  it('renders all 4 stages and triggers onSelectTab when clicking an unlocked stage', () => {
    const onSelectTab = vi.fn();
    render(<PipelineBar activeTab="module1" onSelectTab={onSelectTab} isStep1Complete={true} />);

    const step2 = screen.getByText(UI_STRINGS.pipeline.navStages.step2.title);
    fireEvent.click(step2);
    expect(onSelectTab).toHaveBeenCalledWith('module2');

    const step3 = screen.getByText(UI_STRINGS.pipeline.navStages.step3.title);
    fireEvent.click(step3);
    expect(onSelectTab).toHaveBeenCalledWith('module3');

    const step4 = screen.getByText(UI_STRINGS.pipeline.navStages.step4.title);
    fireEvent.click(step4);
    expect(onSelectTab).toHaveBeenCalledWith('module4');

    const step1 = screen.getByText(UI_STRINGS.pipeline.navStages.step1.title);
    expect(screen.getByText(UI_STRINGS.pipeline.navStages.step1.desc)).toBeInTheDocument();
    fireEvent.click(step1);
    expect(onSelectTab).toHaveBeenCalledWith('module1');
  });

  it('locks Step 2-5 when Step 1 is not complete and invokes onLockedTabClick', () => {
    const onSelectTab = vi.fn();
    const onLockedTabClick = vi.fn();
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={onSelectTab}
        isStep1Complete={false}
        onLockedTabClick={onLockedTabClick}
      />
    );

    expect(screen.getAllByText(UI_STRINGS.pipeline.stepLockedBadge).length).toBeGreaterThan(0);

    const step2 = screen.getByText(UI_STRINGS.pipeline.navStages.step2.title);
    fireEvent.click(step2);
    expect(onLockedTabClick).toHaveBeenCalledWith('module2');
    expect(onSelectTab).not.toHaveBeenCalledWith('module2');
  });

  it('handles clicking Conversion Matrix tab when unlocked and verifies Data Architecture is commented out', () => {
    const onSelectTab = vi.fn();
    const { rerender } = render(<PipelineBar activeTab="module1" onSelectTab={onSelectTab} isStep1Complete={true} />);

    const matrixLink = screen.getByRole('link', { name: new RegExp(UI_STRINGS.pipeline.conversionMatrixTab, 'i') });
    expect(matrixLink).toHaveAttribute('href', '#module5');
    fireEvent.click(matrixLink);
    expect(onSelectTab).toHaveBeenCalledWith('module5');

    const schemaTab = screen.queryByText(UI_STRINGS.pipeline.dataArchitectureTab);
    expect(schemaTab).not.toBeInTheDocument();

    // Rerender with active tab module5 to cover active styles
    rerender(<PipelineBar activeTab="module5" onSelectTab={onSelectTab} isStep1Complete={true} />);
    expect(matrixLink).toHaveClass('bg-purple-600');
  });
});
