'use client';

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ExecutiveBriefExpanderCardProps {
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}

export const ExecutiveBriefExpanderCard: React.FC<ExecutiveBriefExpanderCardProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        className="w-full px-4 py-2.5 bg-slate-950/60 hover:bg-slate-800/50 transition-colors flex items-center justify-between text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-xs font-bold text-white flex items-center gap-2">
          {icon}
          {title}
        </span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="p-3.5 space-y-2.5 border-t border-slate-800/80 bg-slate-900/40">
          {children}
        </div>
      )}
    </div>
  );
};
