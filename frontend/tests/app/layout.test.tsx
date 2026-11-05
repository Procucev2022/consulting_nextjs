import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RootLayout, { metadata } from '../../src/app/layout';

describe('RootLayout', () => {
  it('should export correct metadata', () => {
    expect(metadata.title).toContain('PROCUCEV Platform Engine');
    expect(metadata.description).toContain('PROCUCEV Platform Engine');
    expect(metadata.icons).toBeDefined();
  });

  it('should render children within body and html', () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div data-testid="test-child">Layout Child Content</div>
      </RootLayout>
    );
    expect(markup).toContain('<html');
    expect(markup).toContain('<body');
    expect(markup).toContain('data-testid="test-child"');
    expect(markup).toContain('Layout Child Content');
  });
});
