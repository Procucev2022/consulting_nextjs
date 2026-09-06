import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '../../src/app/layout';

describe('RootLayout', () => {
  it('should export correct metadata', () => {
    expect(metadata.title).toContain('PROCUCEV Platform Engine');
    expect(metadata.description).toContain('PROCUCEV Platform Engine');
    expect(metadata.icons).toBeDefined();
  });

  it('should render children within body and html', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Layout Child Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Layout Child Content')).toBeInTheDocument();
  });
});
