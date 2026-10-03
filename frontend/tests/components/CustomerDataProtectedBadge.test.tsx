import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerDataProtectedBadge } from '../../src/components/CustomerDataProtectedBadge';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('CustomerDataProtectedBadge Component (Prompt 254)', () => {
  it('renders badge label correctly', () => {
    render(<CustomerDataProtectedBadge />);
    expect(screen.getByText(UI_STRINGS.enterprisePrivacy.resultBadgeLabel)).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on hover/focus and hides on mouseleave/blur', () => {
    render(<CustomerDataProtectedBadge showTooltip={true} />);
    const badge = screen.getByRole('status');

    fireEvent.mouseEnter(badge);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.enterprisePrivacy.resultBadgeTooltip)).toBeInTheDocument();

    fireEvent.mouseLeave(badge);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.focus(badge);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.blur(badge);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('respects showTooltip=false and custom className', () => {
    const { container } = render(
      <CustomerDataProtectedBadge showTooltip={false} className="custom-badge-class" />
    );
    expect(container.firstChild).toHaveClass('custom-badge-class');

    const badge = screen.getByRole('status');
    fireEvent.mouseEnter(badge);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
