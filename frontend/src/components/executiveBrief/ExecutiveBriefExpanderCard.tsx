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
    <div className="bg-white border border-[#DCE7F5] rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        className="w-full px-4 py-2.5 bg-[#F8FBFE] hover:bg-[#EEF7FF] transition-colors flex items-center justify-between text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-xs font-bold text-[#0B1B33] flex items-center gap-2">
          {icon}
          {title}
        </span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-[#64748B]" /> : <ChevronRight className="w-4 h-4 text-[#64748B]" />}
      </button>
      {isOpen && (
        <div className="p-3.5 space-y-2.5 border-t border-[#DCE7F5] bg-white">
          {children}
        </div>
      )}
    </div>
  );
};
