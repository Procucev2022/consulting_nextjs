'use client';
import React, { useState } from 'react';
import { PROCUCEV_LOGO_SRC } from '../../constants';

interface ProcucevLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export const ProcucevLogo: React.FC<ProcucevLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = true
}) => {
  const [imgError, setImgError] = useState(false);

  // Height mappings based on size
  const heightClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-20'
  };

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {!imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={PROCUCEV_LOGO_SRC}
          alt="PROCUCEV - Redefining Procurement"
          className={`${heightClasses[size]} object-contain drop-shadow-xs`}
          onError={() => setImgError(true)}
        />
      ) : (
        /* Vector Fallback — new aiCEV brand mark */
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-[#0047b3] flex items-center justify-center p-1.5 shadow-md shadow-blue-900/30">
            <span className="text-white font-black text-2xl tracking-tighter">P</span>
          </div>
          <div>
            <div className="flex items-baseline leading-none">
              <span className="text-2xl font-black tracking-tight text-[#003d99]">PROCU</span>
              <span className="text-[13px] font-black tracking-tight text-[#003d99] align-baseline pb-0.5">ai</span>
              <span className="text-2xl font-black tracking-tight text-[#ff5500]">CEV</span>
            </div>
            {showTagline && (
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider -mt-1">
                Redefining Procurement
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
