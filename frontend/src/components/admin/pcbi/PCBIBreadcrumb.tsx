'use client';

/**
 * Enterprise Breadcrumb Navigation Component (Part P)
 * Provides clear contextual pathing across deep admin and research workflows.
 */

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import type { PCBIBreadcrumbProps } from '../../../types/pcbiDataLibraryComponents';

export const PCBIBreadcrumb: React.FC<PCBIBreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs font-semibold ${className}`}>
      <ol className="flex items-center flex-wrap gap-1.5 text-[#64748B]">
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 text-[#64748B] hover:text-[#0284C7] transition-colors"
            title="Home"
          >
            <Home size={13} />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1 || Boolean(item.isCurrent);
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
              <ChevronRight size={12} className="text-[#94A3B8] shrink-0" aria-hidden="true" />
              {isLast ? (
                <span className="text-[#0B1B33] font-bold bg-[#F8FBFE] px-2 py-0.5 rounded border border-[#DCE7F5]" aria-current="page">
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-[#0284C7] hover:underline transition-colors focus:outline-hidden focus:text-[#0369A1]"
                >
                  {item.label}
                </button>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-[#0284C7] hover:underline transition-colors focus:outline-hidden focus:text-[#0369A1]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#64748B]">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
