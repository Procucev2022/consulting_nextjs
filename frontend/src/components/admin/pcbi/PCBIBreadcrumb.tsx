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
      <ol className="flex items-center flex-wrap gap-1.5 text-slate-400">
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
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
              <ChevronRight size={12} className="text-slate-600 shrink-0" aria-hidden="true" />
              {isLast ? (
                <span className="text-white font-bold bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80" aria-current="page">
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-cyan-400 hover:underline transition-colors focus:outline-hidden focus:text-cyan-300"
                >
                  {item.label}
                </button>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-cyan-400 hover:underline transition-colors focus:outline-hidden focus:text-cyan-300"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-400">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
