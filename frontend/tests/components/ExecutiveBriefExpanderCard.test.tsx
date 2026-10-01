import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutiveBriefExpanderCard } from '../../src/components/executiveBrief/ExecutiveBriefExpanderCard';

describe('ExecutiveBriefExpanderCard', () => {
  it('renders title and collapsed state', () => {
    const onToggle = vi.fn();
    render(
      <ExecutiveBriefExpanderCard
        title="Test Expander"
        icon={<span data-testid="test-icon">icon</span>}
        isOpen={false}
        onToggle={onToggle}
      >
        <div data-testid="test-content">Hidden Content</div>
      </ExecutiveBriefExpanderCard>
    );

    expect(screen.getByText('Test Expander')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();

    const button = screen.getByRole('button', { name: /Test Expander/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders content when open', () => {
    const onToggle = vi.fn();
    render(
      <ExecutiveBriefExpanderCard
        title="Open Expander"
        icon={<span>icon</span>}
        isOpen={true}
        onToggle={onToggle}
      >
        <div data-testid="test-content">Visible Content</div>
      </ExecutiveBriefExpanderCard>
    );

    const button = screen.getByRole('button', { name: /Open Expander/i });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});
