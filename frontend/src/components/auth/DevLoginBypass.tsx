'use client';

/** Development guidance; authentication always uses a registered database account. */
import React from 'react';
import { UI_STRINGS } from '../../constants';

export const DevLoginBypass: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <aside role="note" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
      <p className="font-semibold">{UI_STRINGS.auth.developmentAuthTitle}</p>
      <p className="mt-1">{UI_STRINGS.auth.developmentAuthNotice}</p>
    </aside>
  );
};
