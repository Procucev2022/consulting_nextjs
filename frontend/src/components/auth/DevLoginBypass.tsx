'use client';

/** Development guidance; authentication always uses a registered database account. */
import React from 'react';
import { UI_STRINGS } from '../../constants';

export const DevLoginBypass: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <aside role="note" className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[10px] text-amber-900 leading-tight">
      <p className="font-semibold m-0">{UI_STRINGS.auth.developmentAuthTitle}</p>
      <p className="mt-0.5 m-0">{UI_STRINGS.auth.developmentAuthNotice}</p>
    </aside>
  );
};
