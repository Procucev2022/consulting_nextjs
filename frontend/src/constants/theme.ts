/**
 * aiCEV Unified Design System & Theme Constants (Prompt 294)
 * Single authoritative source of truth for colors, typography, spacing,
 * radii, shadows, badges, and chart palettes across the entire application.
 */

import type {
  AicevColorTokens,
  AicevTypographyTokens,
  AicevSpacingScale,
  AicevRadiusScale,
  AicevShadowTokens,
  AicevChartPalette,
  AicevThemeConfig,
  AicevButtonVariant,
  AicevBadgeVariant
} from '../types/theme';

export const AICEV_COLOR_TOKENS: AicevColorTokens = {
  bg: '#EEF7FF',
  bgSecondary: '#F8FBFE',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  primary: '#0284C7',
  primaryHover: '#0369A1',
  secondary: '#0B1B33',
  accent: '#F97316',
  text: '#0B1B33',
  textSecondary: '#475569',
  textMuted: '#64748B',
  border: '#DCE7F5',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#0EA5E9'
};

export const AICEV_TYPOGRAPHY_TOKENS: AicevTypographyTokens = {
  fontFamilySans: "'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  fontFamilyMono: "'JetBrains Mono', monospace",
  scale: {
    display: '44px',
    h1: '36px',
    h2: '28px',
    h3: '22px',
    sectionHeading: '18px',
    body: '14px',
    kpiLarge: '32px',
    smallLabel: '12px',
    table: '13px'
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  }
};

export const AICEV_SPACING_SCALE: AicevSpacingScale = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  section: '40px',
  page: '48px'
};

export const AICEV_RADIUS_SCALE: AicevRadiusScale = {
  control: '8px',
  input: '10px',
  card: '14px',
  panel: '18px',
  pill: '9999px'
};

export const AICEV_SHADOW_TOKENS: AicevShadowTokens = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(11, 27, 51, 0.04)',
  sm: '0 2px 6px -1px rgba(11, 27, 51, 0.06)',
  md: '0 6px 20px -4px rgba(11, 27, 51, 0.08)',
  lg: '0 16px 40px -8px rgba(11, 27, 51, 0.10)',
  card: '0 1px 3px rgba(11, 27, 51, 0.05), 0 10px 25px -5px rgba(11, 27, 51, 0.04)',
  modal: '0 20px 45px rgba(11, 27, 51, 0.12), 0 4px 12px rgba(11, 27, 51, 0.06)'
};

export const AICEV_CHART_PALETTE: AicevChartPalette = {
  primary: '#0284C7',
  secondary: '#F97316',
  success: '#10B981',
  neutral: '#64748B',
  warning: '#F59E0B',
  error: '#EF4444'
};

export const AICEV_THEME: AicevThemeConfig = {
  colors: AICEV_COLOR_TOKENS,
  typography: AICEV_TYPOGRAPHY_TOKENS,
  spacing: AICEV_SPACING_SCALE,
  radii: AICEV_RADIUS_SCALE,
  shadows: AICEV_SHADOW_TOKENS,
  charts: AICEV_CHART_PALETTE
};

export const AICEV_BADGE_CLASSES: Record<AicevBadgeVariant, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inReview: 'bg-sky-50 text-sky-700 border-sky-200',
  validated: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  realized: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-slate-100 text-slate-600 border-slate-200',
  suspended: 'bg-rose-50 text-rose-700 border-rose-200',
  tierBronze: 'bg-amber-50 text-amber-800 border-amber-200',
  tierSilver: 'bg-slate-100 text-slate-700 border-slate-300',
  tierGold: 'bg-amber-100/80 text-amber-900 border-amber-300 font-bold'
};

export const AICEV_BUTTON_CLASSES: Record<AicevButtonVariant, string> = {
  primary:
    'bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-[10px] shadow-sm transition-all duration-150',
  secondary:
    'bg-white hover:bg-slate-50 text-[#0B1B33] font-semibold border border-[#DCE7F5] rounded-[10px] shadow-xs transition-all duration-150',
  cta:
    'bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#075985] text-white font-bold rounded-[12px] shadow-md transition-all duration-150',
  ghost:
    'bg-transparent hover:bg-sky-50 text-[#0284C7] font-semibold rounded-[8px] transition-all duration-150',
  danger:
    'bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold rounded-[10px] shadow-sm transition-all duration-150'
};
