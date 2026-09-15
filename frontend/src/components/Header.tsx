'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  FileText,
  Sun,
  Moon,
  Sparkles,
  User,
  Crown,
  ChevronDown,
  Headphones
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
  user,
  onContactSupport
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const displayName = user?.name ? user.name.split(' ')[0] : UI_STRINGS.header.authorName.split(' ')[0];

  const handleSupportClick = (): void => {
    if (onContactSupport) {
      onContactSupport();
    } else if (typeof window !== 'undefined') {
      window.open('mailto:support@procucev.com?subject=aiCEV%20Enterprise%20Support%20Request', '_blank');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#080c16]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-lg dark:shadow-black/20 transition-colors duration-200">
      {/* Top Advisory Status & Compliance Ribbon */}
      <div className="bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50 dark:from-cyan-950/60 dark:via-slate-900/80 dark:to-blue-950/60 border-b border-sky-100 dark:border-cyan-500/10 px-4 py-1.5 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Professional aiCEV Brand & Identity */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center justify-center bg-white px-3 py-1 rounded-xl shadow-xs border border-slate-200/90 min-w-[130px] h-11 shrink-0 transition-all hover:shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={AICEV_LOGO_SRC}
              alt={UI_STRINGS.header.logoAlt}
              className="h-8 sm:h-9 w-auto max-w-[125px] object-contain shrink-0 transition-transform duration-200 hover:scale-[1.02]"
            />
          </div>
          <div className="hidden md:block h-7 w-px bg-slate-200 dark:bg-slate-700/80 shrink-0" />
          <div className="flex flex-col justify-center shrink-0">
            <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
              {UI_STRINGS.header.subtitle}
            </span>
          </div>
        </div>

        {/* Center / Primary Business Controls & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Tenant Selector */}
          <div
            data-testid="tenant-badge"
            onClick={() => onSelectTenant?.({ ...tenant, enterprise_name: 'Apex Updated Corp' })}
            className="relative flex items-center space-x-1.5 sm:space-x-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/70 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 shadow-xs transition-colors cursor-pointer hover:border-cyan-500/50 shrink-0"
            title={tenant.enterprise_name}
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[110px] sm:max-w-[150px]">
              {tenant.enterprise_name}
            </span>
            <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/40 shrink-0">
              ₹{tenant.total_spend_evaluated_inr || DEFAULT_SPEND_BASELINE_INR_CR} Cr
            </span>
          </div>

          {/* Deep Spend Scan Trigger (Primary Action) */}
          <button
            type="button"
            onClick={onStartAnalysis}
            title={UI_STRINGS.analyzingLoader.triggerTooltip}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 border shrink-0 ${
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
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-700 hover:bg-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-600 border border-slate-300 dark:border-slate-600/80 rounded-xl shadow-xs transition-all hover:border-cyan-500 active:scale-95 shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">{UI_STRINGS.header.executiveBrief}</span>
          </button>
        </div>

        {/* Right Corner: User Profile & Details Dropdown Trigger */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            data-testid="user-profile-menu-button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border border-slate-300 dark:border-slate-700 rounded-xl transition-all shadow-xs group"
            title={UI_STRINGS.header.userProfile.menuButtonTitle}
            aria-expanded={isProfileMenuOpen}
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-500 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {displayName}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isProfileMenuOpen ? 'rotate-180 text-cyan-500' : ''
              }`}
            />
          </button>

          {/* User Profile, Controls & Support Dropdown Menu */}
          <div
            data-testid="user-profile-dropdown"
            className={`absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 transition-all duration-200 ${
              isProfileMenuOpen ? 'block' : 'hidden'
            }`}
          >
            {/* 1. User Info Header & Tier Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {user ? user.name : displayName}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {user ? user.email : UI_STRINGS.header.userProfile.defaultEmail}
                  </span>
                </div>
              </div>

              {/* Active Subscription Tier Badge */}
              <div
                data-testid="subscription-tier-badge"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                  currentTier === 'GOLD'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-black shadow-xs'
                    : currentTier === 'SILVER'
                    ? 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 font-bold shadow-xs'
                    : 'bg-amber-900/40 text-amber-300 font-bold border border-amber-700/50'
                }`}
              >
                {currentTier === 'GOLD' ? (
                  <Crown className="w-3 h-3 text-amber-950" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>{UI_STRINGS.subscription.tierBadge(currentTier)}</span>
              </div>
            </div>

            {/* 2. Subscription Tier Simulation (Demo Switcher) */}
            {onSelectSimulatedTier && (
              <div className="py-3 border-b border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  {UI_STRINGS.header.userProfile.switchTierTitle}
                </div>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  {(['BRONZE', 'SILVER', 'GOLD'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      data-testid={`demo-tier-${tier.toLowerCase()}`}
                      onClick={() => onSelectSimulatedTier(tier)}
                      className={`py-1 text-xs font-bold rounded-lg transition-all text-center ${
                        currentTier === tier
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={UI_STRINGS.subscription.simulationActive(tier)}
                    >
                      {tier[0] + tier.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Base Currency Selector */}
            <div className="py-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                {UI_STRINGS.header.userProfile.currencyTitle}
              </div>
              <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs">
                {SUPPORTED_HEADER_CURRENCIES.map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => {
                      const validation = validateInput(headerCurrencySchema, { currency: curr });
                      if (validation.success) {
                        onSelectCurrency(validation.data.currency);
                      }
                    }}
                    className={`py-1 rounded-lg font-bold text-[11px] transition-all text-center ${
                      currency === curr
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={curr === 'INR' ? UI_STRINGS.header.inrCurrencyTitle : UI_STRINGS.header.currencyTitle(curr)}
                  >
                    {curr === 'INR' ? UI_STRINGS.header.currencies.inr : curr}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Theme Toggle (Light / Dark) */}
            <div className="py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {UI_STRINGS.header.userProfile.themeTitle}
              </span>
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-0.5 text-xs font-semibold shadow-xs">
                <button
                  type="button"
                  onClick={() => onSelectTheme('light')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                    theme === 'light'
                      ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200/90'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={UI_STRINGS.header.themeToggleLight}
                >
                  <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400'}`} />
                  <span className="text-[11px]">{UI_STRINGS.header.light}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTheme('dark')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-cyan-400 shadow-sm font-bold border border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={UI_STRINGS.header.themeToggleDark}
                >
                  <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-cyan-400 fill-cyan-400/20' : 'text-slate-400'}`} />
                  <span className="text-[11px]">{UI_STRINGS.header.dark}</span>
                </button>
              </div>
            </div>

            {/* 5. Navigation Links (Admin & Account Settings) */}
            <div className="py-2.5 flex items-center space-x-2">
              <Link
                href="/admin"
                title={UI_STRINGS.admin.pageTitle}
                className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800/80 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900 transition-all shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                <span>{UI_STRINGS.header.userProfile.adminLinkLabel}</span>
              </Link>

              <Link
                href="/login"
                title={user ? user.name : UI_STRINGS.auth.pageTitle}
                className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-cyan-500" />
                <span>{user ? UI_STRINGS.header.userProfile.accountLinkLabel : UI_STRINGS.auth.signInTab}</span>
              </Link>
            </div>

            {/* 6. Support Button in the Down */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                data-testid="header-support-button"
                onClick={handleSupportClick}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98"
                title={UI_STRINGS.header.userProfile.supportButtonTitle}
              >
                <Headphones className="w-4 h-4" />
                <span>{UI_STRINGS.header.userProfile.supportButtonLabel}</span>
              </button>
              <div className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-1.5 font-mono">
                {UI_STRINGS.header.userProfile.supportContactNote}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
