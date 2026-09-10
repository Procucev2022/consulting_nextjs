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

  it('renders all 4 stages and triggers onSelectTab when clicking a stage', () => {
    const onSelectTab = vi.fn();
    render(<PipelineBar activeTab="module1" onSelectTab={onSelectTab} />);

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

  it('handles clicking Conversion Matrix and Data Architecture tabs', () => {
    const onSelectTab = vi.fn();
    const { rerender } = render(<PipelineBar activeTab="module1" onSelectTab={onSelectTab} />);

    const matrixBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.pipeline.conversionMatrixTab, 'i') });
    fireEvent.click(matrixBtn);
    expect(onSelectTab).toHaveBeenCalledWith('module5');

    const schemaBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.pipeline.dataArchitectureTab, 'i') });
    fireEvent.click(schemaBtn);
    expect(onSelectTab).toHaveBeenCalledWith('schema');

    // Rerender with active tab module5 and schema to cover active styles
    rerender(<PipelineBar activeTab="module5" onSelectTab={onSelectTab} />);
    expect(matrixBtn).toHaveClass('bg-purple-600');

    rerender(<PipelineBar activeTab="schema" onSelectTab={onSelectTab} />);
    expect(schemaBtn).toHaveClass('bg-cyan-600');
  });
});
