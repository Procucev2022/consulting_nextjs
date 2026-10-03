'use client';

/**
 * Enterprise Unified Status Badge Component (Part L)
 * Single source of truth for rendering PCBI and commodity statuses with consistent design tokens.
 */

import React from 'react';
import { getStatusDesign } from '../../../constants/statusDesign';
import type { PCBIStatusBadgeProps } from '../../../types/pcbiDataLibraryComponents';

export const PCBIStatusBadge: React.FC<PCBIStatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  className = ''
}) => {
  const config = getStatusDesign(status);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2'
  }[size];

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded-lg border font-mono shadow-xs transition-all ${config.badgeClass} ${sizeClasses} ${className}`}
      title={config.description}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 ${config.dotClass} ${dotSizes}`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};
