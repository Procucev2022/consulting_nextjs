import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CLIENT_PROFILE,
  EXECUTIVE_BRIEF_VERSION,
  BRIEF_FINDING_CARDS,
  BRIEF_LEVER_SUMMARIES,
  BRIEF_PRICE_DISPERSIONS
} from '../../src/constants/executiveBriefConstants';
import {
  EXECUTIVE_BRIEF_ENDPOINTS,
  EXECUTIVE_BRIEF_HTTP_STATUS,
  EXECUTIVE_BRIEF_MESSAGES,
  EXECUTIVE_BRIEF_REQUEST_ID_PATTERN,
  EXECUTIVE_BRIEF_ROUTE_BASE,
  EXECUTIVE_BRIEF_ROUTES,
  EXECUTIVE_BRIEF_BEARER_PATTERN,
  EXECUTIVE_BRIEF_TRAILING_SLASH_PATTERN
} from '../../src/constants/executiveBriefRouteConstants';
import {
  executiveBriefClientQuerySchema,
  executiveBriefRegenerateBodySchema
} from '../../src/constants/executiveBriefValidation';
import {
  EXECUTIVE_BRIEF_PRESENTATION_CONTRACT,
  validateNetComposition,
  validateWaterfallMath
} from '../../src/constants/executiveBriefPresentationConstants';
import { containsMojibake, toAsciiSafePresentationString } from '../../src/constants/executiveBriefLayoutConstants';
import {
  EXECUTIVE_BRIEF_CHECKLIST_KEYS,
  EXECUTIVE_BRIEF_CHECKLIST_LABELS
} from '../../src/constants/executiveBriefLabelConstants';
import { EXECUTIVE_BRIEF_SUMMARY_CARD_DEFINITIONS } from '../../src/constants/executiveBriefSummaryCardConstants';
import {
  EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT,
  EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES,
  EXECUTIVE_OPPORTUNITY_BRIEF_SQL
} from '../../src/constants/executiveOpportunityBriefConstants';
import {
  BRIEF_REPORT_ARTIFACTS,
  BRIEF_SLIDE_GROUPS,
  BRIEF_TRACEABILITY_LINEAGE
} from '../../src/constants/executiveBriefReportConstants';
import { EXECUTIVE_BRIEF_ARTIFACT_FILENAMES, EXECUTIVE_BRIEF_CONTENT_TYPES } from '../../src/constants/executiveBriefExportConstants';

describe('executive brief content barrel', () => {
  it('exposes the certified client profile, report version, and finding cards', () => {
    expect(DEFAULT_CLIENT_PROFILE.clientName).toBe('UltraTech Cement Limited');
    expect(DEFAULT_CLIENT_PROFILE.publicFacts).toHaveLength(5);
    expect(EXECUTIVE_BRIEF_VERSION).toBe('EXECUTIVE_BRIEF_PDF_V1.0');
    expect(BRIEF_FINDING_CARDS.length).toBeGreaterThan(0);
    expect(BRIEF_LEVER_SUMMARIES.length).toBeGreaterThan(0);
    expect(BRIEF_PRICE_DISPERSIONS.length).toBeGreaterThan(0);
  });
});

describe('executive brief report constants', () => {
  it('lists eight sections, four lineage items, and only served artifacts', () => {
    expect(BRIEF_SLIDE_GROUPS.map((group) => group.groupNumber)).toEqual([
      '01', '02', '03', '04', '05', '06', '07', '08'
    ]);
    expect(BRIEF_TRACEABILITY_LINEAGE).toHaveLength(4);
    expect(BRIEF_REPORT_ARTIFACTS.map((artifact) => artifact.filename)).toEqual([
      EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.AUDIT,
      EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.JSON,
      EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.PDF,
      EXECUTIVE_BRIEF_ARTIFACT_FILENAMES.PPTX
    ]);
    BRIEF_REPORT_ARTIFACTS.forEach((artifact) => {
      expect(artifact.endpoint.startsWith(EXECUTIVE_BRIEF_ROUTE_BASE)).toBe(true);
    });
  });
});

describe('executive brief route constants', () => {
  it('declares one route per served endpoint with the expected methods', () => {
    expect(EXECUTIVE_BRIEF_ROUTES.map((route) => `${route.method} ${route.path}`)).toEqual([
      'GET /report',
      'GET /audit',
      'GET /download/pdf',
      'GET /download/pptx',
      'GET /download/opportunity-brief/pdf',
      'GET /download/opportunity-brief/pptx',
      'GET /opportunity-brief/report',
      'POST /regenerate'
    ]);
    expect(EXECUTIVE_BRIEF_ENDPOINTS.regenerate).toBe(`${EXECUTIVE_BRIEF_ROUTE_BASE}/regenerate`);
    expect(EXECUTIVE_BRIEF_HTTP_STATUS.NOT_IMPLEMENTED).toBe(501);
  });

  it('matches request IDs, bearer headers, and trailing slashes', () => {
    expect(EXECUTIVE_BRIEF_REQUEST_ID_PATTERN.test('req-2026.10.24_01')).toBe(true);
    expect(EXECUTIVE_BRIEF_REQUEST_ID_PATTERN.test('bad id with spaces')).toBe(false);
    expect(EXECUTIVE_BRIEF_REQUEST_ID_PATTERN.test('x'.repeat(129))).toBe(false);
    expect(EXECUTIVE_BRIEF_BEARER_PATTERN.exec('Bearer abc.def.ghi')?.[1]).toBe('abc.def.ghi');
    expect(EXECUTIVE_BRIEF_BEARER_PATTERN.exec('Basic abc')).toBeNull();
    expect('/report///'.replace(EXECUTIVE_BRIEF_TRAILING_SLASH_PATTERN, '')).toBe('/report');
  });

  it('builds user-facing messages that name the problem and the next step', () => {
    expect(EXECUTIVE_BRIEF_MESSAGES.clientNotCertified('ABC Textile', 'UltraTech Cement Limited')).toContain(
      'No certified executive brief exists for "ABC Textile"'
    );
    expect(EXECUTIVE_BRIEF_MESSAGES.renderFailed('PDF', 'req-1')).toContain('quote request ID req-1');
    expect(EXECUTIVE_BRIEF_MESSAGES.publishFailed('req-2')).toContain('quote request ID req-2');
  });
});

describe('executive brief request schemas', () => {
  it('trims the optional client query and rejects empty or oversized names', () => {
    expect(executiveBriefClientQuerySchema.safeParse({}).success).toBe(true);
    expect(executiveBriefClientQuerySchema.parse({ client: '  UltraTech Cement Limited  ' }).client).toBe(
      'UltraTech Cement Limited'
    );
    expect(executiveBriefClientQuerySchema.safeParse({ client: '   ' }).success).toBe(false);
    expect(executiveBriefClientQuerySchema.safeParse({ client: 'x'.repeat(121) }).success).toBe(false);
  });

  it('rejects a regenerate body whose client is not a string', () => {
    expect(executiveBriefRegenerateBodySchema.safeParse({ client: 'UltraTech Cement Limited' }).success).toBe(true);
    expect(executiveBriefRegenerateBodySchema.safeParse({ client: 42 }).success).toBe(false);
  });
});

describe('presentation waterfall guards', () => {
  it('passes for the certified contract with and without an explicit argument', () => {
    expect(validateWaterfallMath()).toBe(true);
    expect(validateNetComposition()).toBe(true);
    expect(validateWaterfallMath(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT)).toBe(true);
  });

  it('fails when the gross, overlap, or composition relationships break', () => {
    expect(validateWaterfallMath({ ...EXECUTIVE_BRIEF_PRESENTATION_CONTRACT, grossOpportunityCr: 0 })).toBe(false);
    expect(validateNetComposition({ ...EXECUTIVE_BRIEF_PRESENTATION_CONTRACT, strategicMarketValueCr: 0 })).toBe(false);
  });
});

describe('layout text helpers', () => {
  it('detects mojibake and converts presentation glyphs to ASCII', () => {
    expect(containsMojibake('â†’ arrow')).toBe(true);
    expect(containsMojibake('clean text')).toBe(false);
    expect(toAsciiSafePresentationString('')).toBe('');
    expect(toAsciiSafePresentationString('₹5 → 6 – 7')).toBe('Rs. 5 -> 6 - 7');
  });
});

describe('label and summary constants', () => {
  it('labels every checklist key and keeps summary card ids unique', () => {
    expect(EXECUTIVE_BRIEF_CHECKLIST_KEYS).toHaveLength(10);
    EXECUTIVE_BRIEF_CHECKLIST_KEYS.forEach((key) => {
      expect(EXECUTIVE_BRIEF_CHECKLIST_LABELS[key].length).toBeGreaterThan(0);
    });
    const ids = EXECUTIVE_BRIEF_SUMMARY_CARD_DEFINITIONS.map((card) => card.id);
    expect(new Set(ids).size).toBe(EXECUTIVE_BRIEF_SUMMARY_CARD_DEFINITIONS.length);
    expect(ids).toHaveLength(9);
  });

  it('defines D1-backed opportunity brief queries, export settings, and actionable messages', () => {
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenants).toContain('TenantMaster');
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.transactionMetrics).toContain('ProcurementTransaction');
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunityMetrics).toContain('SavingsOpportunity');
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunities).toContain('LIMIT 10');
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.leverBreakdown).toContain('GROUP BY');
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.statusBreakdown).toContain('GROUP BY');
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.riskBreakdown).toContain('GROUP BY');
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.SLIDE_TITLES).toHaveLength(10);
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.d1Unavailable).toContain('D1');
    expect(EXECUTIVE_BRIEF_CONTENT_TYPES.PDF).toBe('application/pdf');
    expect(EXECUTIVE_BRIEF_CONTENT_TYPES.PPTX).toContain('presentationml.presentation');
  });
});
