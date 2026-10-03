import { describe, it, expect } from 'vitest';
import {
  AICEV_COLOR_TOKENS,
  AICEV_TYPOGRAPHY_TOKENS,
  AICEV_SPACING_SCALE,
  AICEV_RADIUS_SCALE,
  AICEV_SHADOW_TOKENS,
  AICEV_CHART_PALETTE,
  AICEV_THEME,
  AICEV_BADGE_CLASSES,
  AICEV_BUTTON_CLASSES
} from '../../src/constants/theme';

describe('aiCEV Design System & Theme Constants (Prompt 294)', () => {
  it('defines valid master color tokens', () => {
    expect(AICEV_COLOR_TOKENS.bg).toBe('#EEF7FF');
    expect(AICEV_COLOR_TOKENS.bgSecondary).toBe('#F8FBFE');
    expect(AICEV_COLOR_TOKENS.surface).toBe('#FFFFFF');
    expect(AICEV_COLOR_TOKENS.surfaceMuted).toBe('#F1F5F9');
    expect(AICEV_COLOR_TOKENS.primary).toBe('#0284C7');
    expect(AICEV_COLOR_TOKENS.primaryHover).toBe('#0369A1');
    expect(AICEV_COLOR_TOKENS.secondary).toBe('#0B1B33');
    expect(AICEV_COLOR_TOKENS.accent).toBe('#F97316');
    expect(AICEV_COLOR_TOKENS.text).toBe('#0B1B33');
    expect(AICEV_COLOR_TOKENS.textSecondary).toBe('#475569');
    expect(AICEV_COLOR_TOKENS.textMuted).toBe('#64748B');
    expect(AICEV_COLOR_TOKENS.border).toBe('#DCE7F5');
    expect(AICEV_COLOR_TOKENS.success).toBe('#10B981');
    expect(AICEV_COLOR_TOKENS.warning).toBe('#F59E0B');
    expect(AICEV_COLOR_TOKENS.error).toBe('#EF4444');
    expect(AICEV_COLOR_TOKENS.info).toBe('#0EA5E9');
  });

  it('defines typography tokens with Inter font and standard scales', () => {
    expect(AICEV_TYPOGRAPHY_TOKENS.fontFamilySans).toContain('Inter');
    expect(AICEV_TYPOGRAPHY_TOKENS.fontFamilyMono).toContain('JetBrains Mono');
    expect(AICEV_TYPOGRAPHY_TOKENS.scale.display).toBe('44px');
    expect(AICEV_TYPOGRAPHY_TOKENS.scale.h1).toBe('36px');
    expect(AICEV_TYPOGRAPHY_TOKENS.scale.h2).toBe('28px');
    expect(AICEV_TYPOGRAPHY_TOKENS.scale.h3).toBe('22px');
    expect(AICEV_TYPOGRAPHY_TOKENS.scale.sectionHeading).toBe('18px');
    expect(AICEV_TYPOGRAPHY_TOKENS.scale.body).toBe('14px');
    expect(AICEV_TYPOGRAPHY_TOKENS.scale.kpiLarge).toBe('32px');
    expect(AICEV_TYPOGRAPHY_TOKENS.scale.smallLabel).toBe('12px');
    expect(AICEV_TYPOGRAPHY_TOKENS.scale.table).toBe('13px');
    expect(AICEV_TYPOGRAPHY_TOKENS.weights.regular).toBe(400);
    expect(AICEV_TYPOGRAPHY_TOKENS.weights.extrabold).toBe(800);
  });

  it('defines unified spacing, radius, and shadow scales', () => {
    expect(AICEV_SPACING_SCALE.xs).toBe('4px');
    expect(AICEV_SPACING_SCALE.sm).toBe('8px');
    expect(AICEV_SPACING_SCALE.md).toBe('12px');
    expect(AICEV_SPACING_SCALE.lg).toBe('16px');
    expect(AICEV_SPACING_SCALE.xl).toBe('24px');
    expect(AICEV_SPACING_SCALE.xxl).toBe('32px');
    expect(AICEV_SPACING_SCALE.section).toBe('40px');
    expect(AICEV_SPACING_SCALE.page).toBe('48px');

    expect(AICEV_RADIUS_SCALE.control).toBe('8px');
    expect(AICEV_RADIUS_SCALE.input).toBe('10px');
    expect(AICEV_RADIUS_SCALE.card).toBe('14px');
    expect(AICEV_RADIUS_SCALE.panel).toBe('18px');
    expect(AICEV_RADIUS_SCALE.pill).toBe('9999px');

    expect(AICEV_SHADOW_TOKENS.none).toBe('none');
    expect(AICEV_SHADOW_TOKENS.xs).toContain('rgba(11, 27, 51');
    expect(AICEV_SHADOW_TOKENS.modal).toContain('rgba(11, 27, 51');
  });

  it('defines chart palette tokens', () => {
    expect(AICEV_CHART_PALETTE.primary).toBe('#0284C7');
    expect(AICEV_CHART_PALETTE.secondary).toBe('#F97316');
    expect(AICEV_CHART_PALETTE.success).toBe('#10B981');
    expect(AICEV_CHART_PALETTE.neutral).toBe('#64748B');
    expect(AICEV_CHART_PALETTE.warning).toBe('#F59E0B');
    expect(AICEV_CHART_PALETTE.error).toBe('#EF4444');
  });

  it('aggregates complete AICEV_THEME object', () => {
    expect(AICEV_THEME.colors).toBe(AICEV_COLOR_TOKENS);
    expect(AICEV_THEME.typography).toBe(AICEV_TYPOGRAPHY_TOKENS);
    expect(AICEV_THEME.spacing).toBe(AICEV_SPACING_SCALE);
    expect(AICEV_THEME.radii).toBe(AICEV_RADIUS_SCALE);
    expect(AICEV_THEME.shadows).toBe(AICEV_SHADOW_TOKENS);
    expect(AICEV_THEME.charts).toBe(AICEV_CHART_PALETTE);
  });

  it('provides button and badge utility classes', () => {
    expect(AICEV_BUTTON_CLASSES.primary).toContain('bg-[#0284C7]');
    expect(AICEV_BUTTON_CLASSES.secondary).toContain('bg-white');
    expect(AICEV_BUTTON_CLASSES.cta).toContain('from-[#0284C7]');
    expect(AICEV_BUTTON_CLASSES.ghost).toContain('text-[#0284C7]');
    expect(AICEV_BUTTON_CLASSES.danger).toContain('bg-[#EF4444]');

    expect(AICEV_BADGE_CLASSES.active).toContain('bg-emerald-50');
    expect(AICEV_BADGE_CLASSES.inReview).toContain('bg-sky-50');
    expect(AICEV_BADGE_CLASSES.validated).toContain('bg-indigo-50');
    expect(AICEV_BADGE_CLASSES.realized).toContain('bg-emerald-50');
    expect(AICEV_BADGE_CLASSES.pending).toContain('bg-amber-50');
    expect(AICEV_BADGE_CLASSES.tierBronze).toContain('bg-amber-50');
    expect(AICEV_BADGE_CLASSES.tierSilver).toContain('bg-slate-100');
    expect(AICEV_BADGE_CLASSES.tierGold).toContain('bg-amber-100/80');
  });
});
