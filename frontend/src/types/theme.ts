/**
 * aiCEV Unified Design System & Theme Types (Prompt 294)
 * Strict typing for centralized design tokens across the application.
 */

export interface AicevColorTokens {
  bg: string;
  bgSecondary: string;
  surface: string;
  surfaceMuted: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface AicevTypographyTokens {
  fontFamilySans: string;
  fontFamilyMono: string;
  scale: {
    display: string;
    h1: string;
    h2: string;
    h3: string;
    sectionHeading: string;
    body: string;
    kpiLarge: string;
    smallLabel: string;
    table: string;
  };
  weights: {
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
}

export interface AicevSpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  section: string;
  page: string;
}

export interface AicevRadiusScale {
  control: string;
  input: string;
  card: string;
  panel: string;
  pill: string;
}

export interface AicevShadowTokens {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  card: string;
  modal: string;
}

export interface AicevChartPalette {
  primary: string;
  secondary: string;
  success: string;
  neutral: string;
  warning: string;
  error: string;
}

export interface AicevThemeConfig {
  colors: AicevColorTokens;
  typography: AicevTypographyTokens;
  spacing: AicevSpacingScale;
  radii: AicevRadiusScale;
  shadows: AicevShadowTokens;
  charts: AicevChartPalette;
}

export type AicevButtonVariant = 'primary' | 'secondary' | 'cta' | 'ghost' | 'danger';

export type AicevBadgeVariant =
  | 'active'
  | 'inReview'
  | 'validated'
  | 'realized'
  | 'pending'
  | 'expired'
  | 'suspended'
  | 'tierBronze'
  | 'tierSilver'
  | 'tierGold';
