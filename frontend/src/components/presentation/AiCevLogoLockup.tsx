'use client';

import React, { useState } from 'react';
import { AICEV_LOGO_SRC } from '../../constants';

export interface AiCevLogoLockupProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const AiCevLogoLockup: React.FC<AiCevLogoLockupProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const [imgError, setImgError] = useState(false);

  const heightClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10'
  };

  return (
    <div className={`flex items-center space-x-2 select-none ${className}`}>
      {!imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={AICEV_LOGO_SRC}
          alt="aiCEV by Procucev"
          className={`${heightClasses[size]} object-contain`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex flex-col items-end leading-none">
          <div className="flex items-baseline space-x-0.5">
            <span className="text-sm font-black text-blue-600 tracking-tight">ai</span>
            <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">CEV</span>
          </div>
          {showSubtitle && (
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              by PROCUCEV
            </span>
          )}
        </div>
      )}
    </div>
  );
};
