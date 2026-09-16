'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Building2,
  FileText,
  Sun,
  Moon,
  Sparkles,
  User,
  ChevronDown,
  LogOut,
  Shield,
  LayoutDashboard,
  ExternalLink
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
  currentUser,
  onLogout,
  onOpenClientSetup
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsUserMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

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
            {UI_STRINGS.header.authorLabel} <strong className="text-slate-900 dark:text-white">{currentUser?.name || UI_STRINGS.header.authorName}</strong> ({currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase()}${currentUser.role.slice(1)}` : UI_STRINGS.header.authorRole})
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
          <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-medium hidden sm:inline">{UI_STRINGS.header.dpsVerified}</span>
          </div>
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs group-hover:border-cyan-500 transition-colors">
              <Image
                src={AICEV_LOGO_SRC}
                alt={UI_STRINGS.header.logoAlt}
                width={120}
                height={32}
                className="h-7 w-auto object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300 tracking-wider">
                {UI_STRINGS.header.subtitle}
              </p>
            </div>
          </Link>
        </div>

        {/* Action Controls & Utilities */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Theme Switcher */}
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
            onClick={() => (onOpenClientSetup ? onOpenClientSetup() : onSelectTenant?.(tenant))}
            className="relative hidden lg:flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 shadow-xs transition-colors cursor-pointer hover:border-cyan-500"
            title="Configure Enterprise Client & Baseline Spend"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
              {tenant.enterprise_name}
            </span>
            <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800/40">
              ₹{(tenant.total_spend_evaluated_inr ?? 0).toFixed(2)} Cr
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

          {/* User Profile Avatar with Hover & Click Dropdown Menu */}
          {currentUser ? (
            <div
              ref={userMenuRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs shadow-xs transition-all cursor-pointer focus:outline-hidden"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                title="Account Profile & Settings"
              >
                {/* User Avatar Circle */}
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-500 text-white font-bold flex items-center justify-center text-[10px] shadow-xs">
                  {userInitials}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[100px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium truncate max-w-[100px]">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Hover Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-700/80 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
                  {/* Dropdown Header */}
                  <div className="p-4 bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 dark:from-slate-900/90 dark:via-[#0e172a] dark:to-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                        {userInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm truncate text-slate-900 dark:text-white">
                            {currentUser.name}
                          </p>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            currentUser.role === 'ADMIN'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                          }`}>
                            {currentUser.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    {/* Buyer Identifier */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Buyer ID:</span>
                      <code className="font-mono font-bold text-cyan-700 dark:text-cyan-400 bg-white dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                        {currentUser.id}
                      </code>
                    </div>
                  </div>

                  {/* Dropdown Menu Links */}
                  <div className="p-2 space-y-1 text-xs">
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span>Profile & Account Settings</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    {currentUser.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-amber-700 dark:text-amber-300 font-medium transition-colors"
                      >
                        <div className="flex items-center space-x-2.5">
                          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Admin Directory</span>
                        </div>
                        <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                          Admin
                        </span>
                      </Link>
                    )}

                    <Link
                      href="/"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Procurement Workspace</span>
                    </Link>
                  </div>

                  {/* Dropdown Footer: Logout */}
                  <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout?.();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{UI_STRINGS.auth.logout}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              title={UI_STRINGS.auth.pageTitle}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-xs"
            >
              <User className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden sm:inline">{UI_STRINGS.auth.signInTab}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
