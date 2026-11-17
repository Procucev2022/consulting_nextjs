import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GlobalError from '../../src/app/global-error';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('global error page', () => {
  it('renders a complete document with the support reference', () => {
    const markup = renderToStaticMarkup(
      <GlobalError error={Object.assign(new Error('layout failed'), { digest: 'glob-3' })} reset={vi.fn()} />
    );

    expect(markup).toContain('<html');
    expect(markup).toContain('<body');
    expect(markup).toContain(UI_STRINGS.errors.boundary.supportReference('glob-3'));
  });
});
