import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveBriefAssumptionsPanel } from '../../src/components/executiveBrief/ExecutiveBriefAssumptionsPanel';
import { ASSUMPTION_TAXONOMY_ITEMS } from '../../src/constants';

describe('ExecutiveBriefAssumptionsPanel', () => {
  it('renders title and all 6 assumption taxonomy categories', () => {
    render(<ExecutiveBriefAssumptionsPanel />);

    expect(screen.getByText(/SAVINGS ASSUMPTIONS & METHODOLOGY TAXONOMY/i)).toBeInTheDocument();
    expect(screen.getByText('Governance Standard')).toBeInTheDocument();

    for (const item of ASSUMPTION_TAXONOMY_ITEMS) {
      expect(screen.getByText(item.badge)).toBeInTheDocument();
      expect(screen.getByText(item.title)).toBeInTheDocument();
      expect(screen.getByText(item.definition)).toBeInTheDocument();
    }
  });

  it('triggers onSelectAssumption when a taxonomy card is clicked', () => {
    const onSelect = vi.fn();
    render(<ExecutiveBriefAssumptionsPanel onSelectAssumption={onSelect} />);

    const firstCardTitle = screen.getByText(ASSUMPTION_TAXONOMY_ITEMS[0].title);
    fireEvent.click(firstCardTitle);

    expect(onSelect).toHaveBeenCalledWith(ASSUMPTION_TAXONOMY_ITEMS[0].key);
  });

  it('safely handles click when onSelectAssumption is undefined', () => {
    render(<ExecutiveBriefAssumptionsPanel />);
    const cardTitle = screen.getByText(ASSUMPTION_TAXONOMY_ITEMS[1].title);
    expect(() => fireEvent.click(cardTitle)).not.toThrow();
  });
});
