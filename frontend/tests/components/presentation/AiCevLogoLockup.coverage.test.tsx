import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AiCevLogoLockup } from '../../../src/components/presentation/AiCevLogoLockup';
import { AICEV_LOGO_SRC } from '../../../src/constants';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

const brand = UI_STRINGS.common.brand;

describe('AiCevLogoLockup coverage', () => {
  it('renders the logo image at the medium size by default', () => {
    render(<AiCevLogoLockup />);

    const logo = screen.getByRole('img');
    expect(logo).toHaveAttribute('src', AICEV_LOGO_SRC);
    expect(logo).toHaveClass('h-8');
    // The subtitle belongs to the text fallback only, so it is absent while the image is shown.
    expect(screen.queryByText(new RegExp(`by ${brand}`))).not.toBeInTheDocument();
  });

  it('applies the requested height class for each size', () => {
    const { unmount: unmountSmall } = render(<AiCevLogoLockup size="sm" />);
    expect(screen.getByRole('img')).toHaveClass('h-6');
    unmountSmall();

    render(<AiCevLogoLockup size="lg" />);
    expect(screen.getByRole('img')).toHaveClass('h-10');
  });

  it('adds the caller class name to the wrapper element', () => {
    render(<AiCevLogoLockup className="custom-lockup-wrapper" />);

    const wrapper = screen.getByRole('img').parentElement;
    expect(wrapper).toHaveClass('custom-lockup-wrapper');
  });

  it('switches to the text lockup when the logo image fails to load', () => {
    render(<AiCevLogoLockup />);

    fireEvent.error(screen.getByRole('img'));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('CEV')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`by ${brand}`))).toBeInTheDocument();
  });

  it('hides the subtitle in the text lockup when showSubtitle is false', () => {
    render(<AiCevLogoLockup showSubtitle={false} />);

    fireEvent.error(screen.getByRole('img'));

    expect(screen.getByText('CEV')).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`by ${brand}`))).not.toBeInTheDocument();
  });
});
