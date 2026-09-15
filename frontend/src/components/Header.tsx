'use client';
import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  FileText,
  Sun,
  Moon,
  Sparkles,
  User,
  Crown
} from 'lucide-react';
import type { HeaderProps } from '../types';
import {
  UI_STRINGS,
  SUPPORTED_HEADER_CURRENCIES,
  DEFAULT_SPEND_BASELINE_INR_CR,
  headerCurrencySchema,
  AICEV_LOGO_SRC
} from '../constants';
import { validateInput } from '../utils/validation';

export const Header: React.FC<HeaderProps> = ({
  tenant,
  onSelectTenant,
  currency,
  onSelectCurrency,
  onOpenReport,
  theme,
  onSelectTheme,
  onStartAnalysis,
  isAnalyzing,
  currentTier = 'BRONZE',
  onSelectSimulatedTier,
  user
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#080c16]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-lg dark:shadow-black/20 transition-colors duration-200">
      {/* Top Advisory Document Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50 dark:from-cyan-950/60 dark:via-slate-900/80 dark:to-blue-950/60 border-b border-sky-100 dark:border-cyan-500/10 px-4 py-1.5 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-3 overflow-x-auto">
          <span className="flex items-center space-x-1 font-mono text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-100/80 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/50">
            <span>{UI_STRINGS.header.docRefLabel}</span>
            <span>{UI_STRINGS.header.docRefValue}</span>
          </span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-500">|</span>
          <span className="hidden md:inline text-slate-700 dark:text-slate-300">
            {UI_STRINGS.header.authorLabel} <strong className="text-slate-900 dark:text-white">{UI_STRINGS.header.authorName}</strong> ({UI_STRINGS.header.authorRole})
          </span>
          <span className="hidden lg:inline text-slate-300 dark:text-slate-500">|</span>
          <span className="hidden lg:inline text-emerald-700 dark:text-emerald-400 font-semibold">
            {UI_STRINGS.header.baseCurrencyNote}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <span className="hidden sm:flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="font-semibold">{UI_STRINGS.header.slaText}</span>
          </span>
          <span className="hidden md:flex items-center space-x-1 text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{UI_STRINGS.header.securityBadge}</span>
          </span>
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3.5">
          <div className="flex items-center bg-white dark:bg-white/95 px-3 py-1.5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/60 transition-all">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={AICEV_LOGO_SRC}
              alt={UI_STRINGS.header.logoAlt}
              className="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-[1.02]"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
              {UI_STRINGS.header.subtitle}
            </span>
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
              title={UI_STRINGS.header.themeToggleLight}
            >
              <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{UI_STRINGS.header.light}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTheme('dark')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm font-bold border border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={UI_STRINGS.header.themeToggleDark}
            >
              <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-cyan-400 fill-cyan-400/20' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{UI_STRINGS.header.dark}</span>
            </button>
          </div>

          {/* Tenant Selector */}
          <div
            data-testid="tenant-badge"
            onClick={() => onSelectTenant?.({ ...tenant, enterprise_name: 'Apex Updated Corp' })}
            className="relative hidden lg:flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
              {tenant.enterprise_name}
            </span>
            <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800/40">
              ₹{tenant.total_spend_evaluated_inr || DEFAULT_SPEND_BASELINE_INR_CR} Cr
            </span>
          </div>

          {/* Base Currency Switcher (Primary INR in Crores) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/70 rounded-xl p-0.5 text-xs font-mono">
            {SUPPORTED_HEADER_CURRENCIES.map((curr) => (
              <button
                key={curr}
                onClick={() => {
                  const validation = validateInput(headerCurrencySchema, { currency: curr });
                  if (validation.success) {
                    onSelectCurrency(validation.data.currency);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  currency === curr
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title={curr === 'INR' ? UI_STRINGS.header.inrCurrencyTitle : UI_STRINGS.header.currencyTitle(curr)}
              >
                {curr === 'INR' ? '₹ INR (Cr)' : curr}
              </button>
            ))}
          </div>

          {/* Deep Spend Scan Trigger */}
          <button
            type="button"
            onClick={onStartAnalysis}
            title={UI_STRINGS.analyzingLoader.triggerTooltip}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 border ${
              isAnalyzing
                ? 'bg-cyan-700 text-cyan-100 border-cyan-500 animate-pulse'
                : 'bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/30 shadow-cyan-600/20'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{UI_STRINGS.analyzingLoader.triggerButton}</span>
          </button>

          {/* Executive Report Button */}
          <button
            onClick={onOpenReport}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-700 hover:bg-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-600 border border-slate-300 dark:border-slate-600/80 rounded-xl shadow-xs transition-all hover:border-cyan-500 active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">{UI_STRINGS.header.executiveBrief}</span>
          </button>

          {/* Subscription Tier Badge & Interactive Demo Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/70 rounded-xl p-0.5 text-xs">
            <div
              data-testid="subscription-tier-badge"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                currentTier === 'GOLD'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-black shadow-xs'
                  : currentTier === 'SILVER'
                  ? 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 font-bold shadow-xs'
                  : 'bg-amber-900/40 text-amber-300 font-bold border border-amber-700/50'
              }`}
            >
              {currentTier === 'GOLD' ? (
                <Crown className="w-3.5 h-3.5 text-amber-950" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{UI_STRINGS.subscription.tierBadge(currentTier)}</span>
            </div>

            {onSelectSimulatedTier && (
              <div className="flex items-center gap-0.5 ml-1">
                {(['BRONZE', 'SILVER', 'GOLD'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    data-testid={`demo-tier-${tier.toLowerCase()}`}
                    onClick={() => onSelectSimulatedTier(tier)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                      currentTier === tier
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                    title={UI_STRINGS.subscription.simulationActive(tier)}
                  >
                    {tier[0] + tier.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Admin Directory Navigation */}
          <Link
            href="/admin"
            title={UI_STRINGS.admin.pageTitle}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800/80 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900 transition-all shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">Admin</span>
          </Link>

          {/* User Sign In / Account Navigation */}
          <Link
            href="/login"
            title={user ? user.name : UI_STRINGS.auth.pageTitle}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-xs"
          >
            <User className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden sm:inline">{user ? user.name.split(' ')[0] : UI_STRINGS.auth.signInTab}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
