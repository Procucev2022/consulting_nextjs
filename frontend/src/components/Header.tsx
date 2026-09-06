'use client';
import React from 'react';
import {
  ShieldCheck,
  Zap,
  Globe,
  Database,
  Building2,
  FileText,
  Clock,
  Sparkles,
  Sun,
  Moon,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { TenantMaster } from '../types';

interface HeaderProps {
  tenant: TenantMaster;
  onSelectTenant: (tenant: TenantMaster) => void;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  onSelectCurrency: (currency: 'INR' | 'USD' | 'EUR' | 'GBP') => void;
  onOpenReport: () => void;
  theme: 'light' | 'dark';
  onSelectTheme: (theme: 'light' | 'dark') => void;
}

export const Header: React.FC<HeaderProps> = ({
  tenant,
  onSelectTenant,
  currency,
  onSelectCurrency,
  onOpenReport,
  theme,
  onSelectTheme
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#080c16]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-lg dark:shadow-black/20 transition-colors duration-200">
      {/* Top Advisory Document Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50 dark:from-cyan-950/60 dark:via-slate-900/80 dark:to-blue-950/60 border-b border-sky-100 dark:border-cyan-500/10 px-4 py-1.5 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-3 overflow-x-auto">
          <span className="flex items-center space-x-1 font-mono text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-100/80 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/50">
            <span>DOC REF:</span>
            <span>FRD-PRC-2026-V2</span>
          </span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-500">|</span>
          <span className="hidden md:inline text-slate-700 dark:text-slate-300">
            Author: <strong className="text-slate-900 dark:text-white">Srinivas Mukku</strong> (Co-Founder & CEO)
          </span>
          <span className="hidden lg:inline text-slate-300 dark:text-slate-500">|</span>
          <span className="hidden lg:inline text-emerald-700 dark:text-emerald-400 font-semibold">
            Base Currency: INR in Crores (₹ Cr) | Multi-Currency Live FX
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <span className="hidden sm:flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="font-semibold">SLA: &lt;800ms Query</span>
          </span>
          <span className="hidden md:flex items-center space-x-1 text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>SOC2 Type II / AES-256</span>
          </span>
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-white dark:bg-[#080c16] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400 fill-cyan-500/20" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white font-display">
                PROCUCEV
              </span>
              <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-300 dark:border-cyan-800/60">
                ENGINE 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
              Tech-Enabled Procurement Advisory & Real-Time AI Optimization Suite
            </p>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Dedicated Light / Dark Mode Toggle Bar */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-1 text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => onSelectTheme('light')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200/90'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Switch to Light Mode"
            >
              <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Light</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTheme('dark')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm font-bold border border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Switch to Dark Mode"
            >
              <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-cyan-400 fill-cyan-400/20' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Dark</span>
            </button>
          </div>

          {/* Tenant Selector */}
          <div
            data-testid="tenant-badge"
            onClick={() => onSelectTenant && onSelectTenant({ ...tenant, enterprise_name: 'Apex Updated Corp' })}
            className="relative hidden lg:flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
              {tenant.enterprise_name}
            </span>
            <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800/40">
              ₹{tenant.total_spend_evaluated_inr || 732.41} Cr
            </span>
          </div>

          {/* Base Currency Switcher (Primary INR in Crores) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/70 rounded-xl p-0.5 text-xs font-mono">
            {(['INR', 'USD', 'EUR', 'GBP'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => onSelectCurrency(curr)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  currency === curr
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title={curr === 'INR' ? 'Indian Rupee in Crores (₹ Cr)' : `${curr} Base`}
              >
                {curr === 'INR' ? '₹ INR (Cr)' : curr}
              </button>
            ))}
          </div>

          {/* Executive Report Button */}
          <button
            onClick={onOpenReport}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-700 hover:bg-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-600 border border-slate-300 dark:border-slate-600/80 rounded-xl shadow-xs transition-all hover:border-cyan-500 active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Executive Brief</span>
          </button>
        </div>
      </div>
    </header>
  );
};
