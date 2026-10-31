'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Building2,
  FileText,
  Presentation,
  Sun,
  Moon,
  Sparkles,
  User,
  Crown,
  ChevronDown,
  Headphones,
  LogOut,
  LayoutDashboard,
  ExternalLink
} from 'lucide-react';
import type { HeaderProps } from '../types';
import { isAssessmentFinancialDisplayEligible } from '../utils/assessmentFinancialDisplayGate';
import {
  UI_STRINGS,
  SUPPORTED_HEADER_CURRENCIES,
  headerCurrencySchema,
  AICEV_LOGO_SRC
} from '../constants';
import { validateInput } from '../utils/validation';
import { CustomerPlanDisplay } from './subscription/CustomerPlanDisplay';
import { CommercialEnquiryModal } from './subscription/CommercialEnquiryModal';

export const Header: React.FC<HeaderProps> = ({
  tenant,
  onSelectTenant,
  currency,
  onSelectCurrency,
  onOpenReport,
  onOpenManagementBrief,
  theme,
  onSelectTheme,
  onStartAnalysis: _onStartAnalysis,
  isAnalyzing: _isAnalyzing,
  currentUser,
  currentTier = 'BRONZE',
  onSelectSimulatedTier,
  user,
  onLogout,
  onOpenClientSetup,
  onContactSupport,
  isExecutiveBriefReady: _isExecutiveBriefReady = true,
  operatingMode,
  onToggleAssessmentMode,
  activeAssessment,
  activeCustomer
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMoreReportsOpen, setIsMoreReportsOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [enquiryTargetTier, setEnquiryTargetTier] = useState<'SILVER' | 'GOLD'>('SILVER');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreReportsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Customer Identity & Spend Indicator Evaluation (Prompt 370 Phase 3)
  const isInternal = operatingMode
    ? Boolean(operatingMode.isInternalAssessment)
    : Boolean(activeAssessment || activeCustomer);

  let customerDisplayName: string = UI_STRINGS.header.noActiveCustomer;
  let statusBadge: React.ReactNode = null;
  let spendBadge: React.ReactNode = null;

  if (isInternal) {
    if (activeAssessment) {
      customerDisplayName = activeAssessment.customerName || UI_STRINGS.header.noActiveCustomer;

      // Has a file been uploaded?
      const hasUploadedFile = Boolean(
        activeAssessment.activeDataVersionId ||
        activeAssessment.currentDataVersionId ||
        (activeAssessment.dataStatus && activeAssessment.dataStatus !== 'AWAITING_DATA')
      );

      // Has dataset been validated?
      const isDatasetValidated = activeAssessment.dataStatus === 'VALIDATED';

      // Has Module 1 completed successfully?
      // Verify assessment ID, data-version ID, run ID, and successful Module 1 status
      const hasDataVersionId = Boolean(activeAssessment.activeDataVersionId || activeAssessment.currentDataVersionId);
      const hasRunId = Boolean(activeAssessment.activeAnalysisRunId);
      const isModule1Completed = Boolean(
        activeAssessment.status !== 'DRAFT' &&
        activeAssessment.status !== 'DATA_AWAITING' &&
        activeAssessment.status !== 'BLOCKED' &&
        activeAssessment.validatedSpendCr !== undefined &&
        activeAssessment.validatedSpendCr > 0
      );

      const isValidModule1Run = Boolean(
        activeAssessment.assessmentId &&
        hasDataVersionId &&
        hasRunId &&
        isModule1Completed
      );

      const isFinancialDisplayEligible = isAssessmentFinancialDisplayEligible(activeAssessment);

      if (isFinancialDisplayEligible) {
        // Formally accepted assessment with completed modules & consolidated results
        spendBadge = (
          <span
            data-testid="assessment-spend-badge"
            className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0 font-bold"
          >
            ₹{(activeAssessment.validatedSpendCr ?? 0).toFixed(2)} Cr
          </span>
        );
      } else if (isDatasetValidated && !isValidModule1Run) {
        // Rule E: Dataset validated, but Module 1 not run
        statusBadge = (
          <span
            data-testid="assessment-status-badge"
            className="text-[10px] font-mono bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded border border-sky-300 shrink-0"
          >
            {UI_STRINGS.header.validatedBadge}
          </span>
        );
      } else if (isValidModule1Run) {
        // Analysis completed but not yet formally accepted (Prompt 373)
        statusBadge = (
          <span
            data-testid="assessment-status-badge"
            className="text-[10px] font-mono bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded border border-sky-300 shrink-0"
          >
            {activeAssessment.status ? activeAssessment.status.replace(/_/g, ' ') : UI_STRINGS.header.validatedBadge}
          </span>
        );
      } else if (hasUploadedFile) {
        // Rule D: File uploaded but not validated
        statusBadge = (
          <span
            data-testid="assessment-status-badge"
            className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300 shrink-0"
          >
            {UI_STRINGS.header.awaitingValidationBadge}
          </span>
        );
      } else {
        // Rule C: Assessment open, but no file uploaded
        statusBadge = (
          <span
            data-testid="assessment-status-badge"
            className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300 shrink-0"
          >
            {UI_STRINGS.header.dataNotUploadedBadge}
          </span>
        );
      }
    } else if (activeCustomer) {
      // Rule B: Customer selected, but no assessment open
      customerDisplayName = activeCustomer.customerName;
      // Do not display spend or savings figures
    } else {
      // Rule A: No customer or assessment selected
      customerDisplayName = UI_STRINGS.header.noActiveCustomer;
      // Do not display any customer-specific spend
    }
  } else {
    customerDisplayName = tenant.enterprise_name;
    spendBadge = (
      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
        {tenant.total_spend_evaluated_inr == null
          ? UI_STRINGS.header.spendUnavailable
          : `₹${tenant.total_spend_evaluated_inr} Cr`}
      </span>
    );
  }

  // Management Quick Summary availability (Prompt 370 Phase 4)
  const isManagementSummaryEligible = Boolean(
    !isInternal ||
    (
      activeAssessment?.activeAnalysisRunId &&
      (
        activeAssessment.status === 'APPROVED' ||
        activeAssessment.status === 'DELIVERED' ||
        (
          activeAssessment.netDefensibleOpportunityCr !== undefined &&
          activeAssessment.netDefensibleOpportunityCr > 0 &&
          activeAssessment.provenOpportunityCr !== undefined &&
          activeAssessment.provenOpportunityCr > 0
        )
      )
    )
  );

  // More Reports availability (Prompt 370 Phase 4)
  const isMoreReportsEligible = Boolean(
    !isInternal ||
    (
      activeAssessment?.activeAnalysisRunId &&
      (
        activeAssessment.status === 'APPROVED' ||
        activeAssessment.status === 'DELIVERED' ||
        (
          activeAssessment.deliveryRangeMaxCr !== undefined &&
          activeAssessment.deliveryRangeMaxCr > 0
        )
      )
    )
  );

  const rawUser = currentUser || user || null;
  const isAdmin = rawUser?.role === 'ADMIN';
  const activeUser = rawUser && !isAdmin ? rawUser : null;
  const displayName = activeUser?.full_name || (activeUser as any)?.name || activeUser?.email || UI_STRINGS.header.userProfile.defaultName;
  const userInitials = displayName
    ? displayName.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'G';

  const handleMouseEnter = (): void => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsProfileMenuOpen(true);
  };

  const handleMouseLeave = (): void => {
    timeoutRef.current = setTimeout(() => {
      setIsProfileMenuOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (moreReportsRef.current && !moreReportsRef.current.contains(event.target as Node)) {
        setIsMoreReportsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        setIsMoreReportsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSupportClick = (): void => {
    if (onContactSupport) {
      onContactSupport();
    } else if (typeof window !== 'undefined') {
      window.open('mailto:support@procucev.com?subject=aiCEV%20Enterprise%20Support%20Request', '_blank');
    }
  };

  const handleManagementBriefClick = (): void => {
    if (!isManagementSummaryEligible) return;
    if (onOpenManagementBrief) {
      onOpenManagementBrief();
    } else {
      onOpenReport?.();
    }
  };

  const handleExecutiveBriefClick = (): void => {
    if (!isMoreReportsEligible) return;
    onOpenReport?.();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/97 backdrop-blur-2xl border-b border-slate-200 shadow-md transition-colors duration-200">
      {/* Top Advisory Status & Compliance Ribbon */}
      <div className="w-full bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50 border-b border-sky-100 px-3 sm:px-5 lg:px-6 py-1.5 text-[11px] text-slate-600 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-3 overflow-x-auto">
          <span className="flex items-center space-x-1 font-mono text-cyan-700 font-bold bg-cyan-100/80 px-2 py-0.5 rounded border border-cyan-300">
            <span>{UI_STRINGS.header.docRefLabel}</span>
            <span>{UI_STRINGS.header.docRefValue}</span>
          </span>
          <span className="hidden md:inline text-slate-300">|</span>
          {activeUser ? (
            <span className="hidden md:inline text-slate-700">
              {UI_STRINGS.header.authorLabel} <strong className="text-slate-900">{activeUser.name}</strong> ({activeUser.role ? `${activeUser.role.charAt(0).toUpperCase()}${activeUser.role.slice(1)}` : 'User'})
            </span>
          ) : (
            <span className="hidden md:inline text-slate-600">
              <strong className="text-slate-800">aiCEV Suite</strong> (Procurement Intelligence)
            </span>
          )}
          <span className="hidden lg:inline text-slate-300">|</span>
          <span className="hidden lg:inline text-emerald-700 font-semibold tracking-wide">
            {UI_STRINGS.header.baseCurrencyNote}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <span className="hidden sm:flex items-center space-x-1.5 text-emerald-700 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" style={{boxShadow: '0 0 0 3px rgba(16,185,129,0.18)', animation: 'pulse-dot 2.5s infinite'}} />
            <span className="font-semibold">{UI_STRINGS.header.slaText}</span>
          </span>
          <div className="flex items-center space-x-1 text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span className="font-medium hidden sm:inline">{UI_STRINGS.header.dpsVerified}</span>
          </div>
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <div className="w-full px-3 sm:px-5 lg:px-6 py-2.5 flex items-center justify-between gap-2.5 sm:gap-3">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="bg-white px-3 py-1 rounded-xl shadow-xs border border-slate-200/90 min-w-[120px] h-10 flex items-center justify-center transition-all group-hover:border-cyan-500">
              <Image
                src={AICEV_LOGO_SRC}
                alt={UI_STRINGS.header.logoAlt}
                width={120}
                height={32}
                className="h-7 sm:h-8 w-auto object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-mono font-medium text-slate-600 tracking-wider">
                {UI_STRINGS.header.subtitle}
              </p>
            </div>
          </Link>
          {operatingMode?.isInternalAssessment && (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                INTERNAL ASSESSMENT MODE
              </span>
              {onToggleAssessmentMode && (
                <button
                  type="button"
                  data-testid="header-assessment-centre-btn"
                  onClick={onToggleAssessmentMode}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-50 border border-cyan-300 text-cyan-850 hover:bg-cyan-100 transition-colors shadow-xs shrink-0 cursor-pointer"
                  title={UI_STRINGS.header.assessmentCentre}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-cyan-700" />
                  <span>{UI_STRINGS.header.assessmentCentre}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center / Action Controls & Utilities */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Tenant / Assessment Context Badge */}
          <div
            data-testid="tenant-badge"
            onClick={() => (onOpenClientSetup ? onOpenClientSetup() : onSelectTenant?.(tenant))}
            className="relative flex items-center space-x-1.5 sm:space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 shadow-xs transition-colors cursor-pointer hover:border-cyan-500/50 shrink-0"
            title={activeAssessment ? `Active Assessment: ${activeAssessment.customerName} (${activeAssessment.assessmentId})` : 'Configure Enterprise Client & Baseline Spend'}
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span className="font-semibold text-slate-900 truncate max-w-[110px] sm:max-w-[150px]">
              {customerDisplayName}
            </span>
            {statusBadge}
            {spendBadge}
          </div>

          {/* Primary Management Quick Summary Button */}
          <button
            type="button"
            data-testid="header-management-summary-btn"
            onClick={handleManagementBriefClick}
            disabled={!isManagementSummaryEligible}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl shadow-xs transition-all text-left shrink-0 ${
              isManagementSummaryEligible
                ? 'bg-white hover:bg-slate-50 border border-slate-300 hover:border-cyan-500 cursor-pointer active:scale-95'
                : 'bg-slate-50 border border-slate-200 opacity-50 cursor-not-allowed'
            }`}
            title={
              isManagementSummaryEligible
                ? `${UI_STRINGS.header.managementQuickSummary} — ${UI_STRINGS.header.managementQuickSummarySubtitle}`
                : UI_STRINGS.header.managementQuickSummaryUnavailable
            }
          >
            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
              isManagementSummaryEligible ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}>
              <Presentation className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left leading-tight pr-1">
              <span className={`text-xs font-bold ${isManagementSummaryEligible ? 'text-slate-800' : 'text-slate-500'}`}>
                {UI_STRINGS.header.managementQuickSummary}
              </span>
              <span className="text-[10px] text-cyan-700 font-medium hidden sm:inline">
                {UI_STRINGS.header.managementQuickSummarySubtitle}
              </span>
            </div>
          </button>

          {/* Secondary More Reports Dropdown (Boardroom & Evidence Edition) */}
          <div className="relative shrink-0" ref={moreReportsRef}>
            <button
              type="button"
              data-testid="header-more-reports-btn"
              onClick={() => setIsMoreReportsOpen((prev) => !prev)}
              className="flex items-center space-x-1 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer"
              title={UI_STRINGS.header.moreReports}
              aria-expanded={isMoreReportsOpen}
            >
              <span className="hidden md:inline">{UI_STRINGS.header.moreReports}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {isMoreReportsOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 text-left"
                data-testid="header-more-reports-dropdown"
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Advanced Presentations
                </div>
                {isMoreReportsEligible ? (
                  <button
                    type="button"
                    data-testid="header-executive-brief-btn"
                    onClick={() => {
                      setIsMoreReportsOpen(false);
                      handleExecutiveBriefClick();
                    }}
                    className="w-full flex items-start space-x-2 p-2 hover:bg-slate-100 rounded-lg transition-all text-left group cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-500 group-hover:text-cyan-500 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-cyan-600">
                        {UI_STRINGS.header.boardroomEvidence}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {UI_STRINGS.header.boardroomEvidenceSubtitle}
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="p-2 text-xs text-slate-400 italic" data-testid="no-reports-available">
                    {UI_STRINGS.header.moreReportsUnavailable}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Admin Portal Direct Access Button */}
          <Link
            href="/admin"
            id="header-admin-portal-link"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl shadow-xs transition-all hover:border-amber-400 active:scale-95 shrink-0"
            title={UI_STRINGS.header.adminPortal}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">{UI_STRINGS.header.adminPortal}</span>
          </Link>
        </div>

        {/* Right Corner: User Profile & Details Dropdown Trigger */}
        <div
          className="relative shrink-0"
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            data-testid="user-profile-menu-button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all shadow-xs group cursor-pointer"
            title={UI_STRINGS.header.userProfile.menuButtonTitle}
            aria-expanded={isProfileMenuOpen}
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-500 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
              {activeUser ? userInitials : <User className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-cyan-600 transition-colors max-w-[100px] truncate">
              {activeUser ? displayName.split(' ')[0] : 'Sign In'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isProfileMenuOpen ? 'rotate-180 text-cyan-500' : ''
              }`}
            />
          </button>

          {/* User Profile, Controls & Support Dropdown Menu */}
          {isProfileMenuOpen && (
            <div
              data-testid="user-profile-dropdown"
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* 1. User Info Header & Tier Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                    {activeUser ? userInitials : <User className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {displayName}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">
                      {activeUser ? activeUser.email : UI_STRINGS.header.userProfile.defaultEmail}
                    </span>
                  </div>
                </div>

                {/* Active Subscription Tier Badge */}
                <div
                  data-testid="subscription-tier-badge"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-wide shrink-0 transition-all ${
                    currentTier === 'GOLD'
                      ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-amber-950 font-black shadow-xs border border-amber-300'
                      : currentTier === 'SILVER'
                      ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 font-bold shadow-xs border border-slate-300'
                      : 'bg-amber-100/90 text-amber-900 font-bold border border-amber-300/90 shadow-xs'
                  }`}
                >
                  {currentTier === 'GOLD' ? (
                    <Crown className="w-3.5 h-3.5 text-amber-950" />
                  ) : currentTier === 'SILVER' ? (
                    <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  )}
                  <span>{UI_STRINGS.subscription.tierBadge(currentTier)}</span>
                </div>
              </div>

              {/* 2. Customer Plan Display (Prompt 288 §12) */}
              <CustomerPlanDisplay
                currentTier={currentTier}
                onRequestUpgrade={(target) => {
                  setEnquiryTargetTier(target);
                  setIsEnquiryOpen(true);
                  setIsProfileMenuOpen(false);
                }}
                isAdmin={isAdmin}
              />

              {/* Admin Only Demo Switcher */}
              {onSelectSimulatedTier && isAdmin && (
                <div className="py-2.5 border-b border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Demo Switcher (Admin Only)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {(['BRONZE', 'SILVER', 'GOLD'] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        data-testid={`demo-tier-${tier.toLowerCase()}`}
                        onClick={() => onSelectSimulatedTier(tier)}
                        className={`py-1 text-xs font-bold rounded-lg transition-all text-center ${
                          currentTier === tier
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
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
              <div className="py-3 border-b border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  {UI_STRINGS.header.userProfile.currencyTitle}
                </div>
                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 font-mono text-xs">
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
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title={curr === 'INR' ? UI_STRINGS.header.inrCurrencyTitle : UI_STRINGS.header.currencyTitle(curr)}
                    >
                      {curr === 'INR' ? UI_STRINGS.header.currencies.inr : curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Theme Toggle (Light / Dark) */}
              <div className="py-3 border-b border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {UI_STRINGS.header.userProfile.themeTitle}
                </span>
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs font-semibold shadow-xs">
                  <button
                    type="button"
                    onClick={() => onSelectTheme('light')}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                      theme === 'light'
                        ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200/90'
                        : 'text-slate-500 hover:text-slate-800'
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
                        ? 'bg-[#EEF4FC] text-cyan-400 shadow-sm font-bold border border-slate-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title={UI_STRINGS.header.themeToggleDark}
                  >
                    <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-cyan-400 fill-cyan-400/20' : 'text-slate-400'}`} />
                    <span className="text-[11px]">{UI_STRINGS.header.dark}</span>
                  </button>
                </div>
              </div>

              {/* 5. Navigation Links */}
              <div className="py-2.5 space-y-1 text-xs">
                <Link
                  href="/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <User className="w-4 h-4 text-cyan-600" />
                    <span>Profile & Account Settings</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                {activeUser?.role === 'ADMIN' && (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 text-amber-700 font-medium transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Admin User Directory</span>
                      </div>
                      <span className="text-[10px] font-mono bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                        Admin
                      </span>
                    </Link>

                    <Link
                      href="/admin/subscriptions"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 text-cyan-700 font-medium transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <ShieldCheck className="w-4 h-4 text-cyan-600" />
                        <span>Subscription Management</span>
                      </div>
                      <span className="text-[10px] font-mono bg-cyan-100 px-1.5 py-0.5 rounded border border-cyan-300">
                        Admin
                      </span>
                    </Link>
                  </>
                )}

                <Link
                  href="/"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>Procurement Workspace</span>
                </Link>
              </div>

              {/* 6. Support & Logout Actions */}
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <button
                  type="button"
                  data-testid="header-support-button"
                  onClick={handleSupportClick}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
                  title={UI_STRINGS.header.userProfile.supportButtonTitle}
                >
                  <Headphones className="w-4 h-4" />
                  <span>{UI_STRINGS.header.userProfile.supportButtonLabel}</span>
                </button>

                {activeUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{UI_STRINGS.auth.logout}</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 text-cyan-600 hover:bg-cyan-50 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{UI_STRINGS.auth.signInTab}</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CommercialEnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        currentTier={currentTier}
        targetTier={enquiryTargetTier}
        customerName={displayName}
        customerEmail={activeUser?.email}
        companyName={tenant?.enterprise_name}
      />
    </header>
  );
};
