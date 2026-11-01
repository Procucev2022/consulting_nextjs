/**
 * Executive Brief routes under /api/reports/executive-brief. The Worker dispatches here for every path under that
 * prefix. Unknown paths return null, and the Worker answers 404. A known path with the wrong method returns 405.
 */
import type { CloudflareEnvironment } from './types/cloudflare';
import type { ExecutiveBriefRouteDefinition, ExecutiveBriefRouteKey } from './types/executiveBriefRoutes';
import {
  EXECUTIVE_BRIEF_ROUTE_BASE,
  EXECUTIVE_BRIEF_ROUTES,
  EXECUTIVE_BRIEF_TRAILING_SLASH_PATTERN
} from './constants/executiveBriefRouteConstants';
import {
  handleExecutiveBriefAudit,
  handleExecutiveBriefDownload,
  handleExecutiveBriefEmail,
  handleExecutiveBriefReport,
  handleOpportunityBriefDownload,
  handleOpportunityBriefReport
} from './workerD1ExecutiveBriefHandlers';
import { handleExecutiveBriefRegenerate } from './workerD1ExecutiveBriefRegenerate';
import { methodNotAllowedResponse, resolveExecutiveBriefRequestId } from './workerD1ExecutiveBriefResponses';

const subPathOf = (pathname: string): string | null => {
  if (pathname === EXECUTIVE_BRIEF_ROUTE_BASE) {
    return '';
  }
  if (!pathname.startsWith(`${EXECUTIVE_BRIEF_ROUTE_BASE}/`)) {
    return null;
  }
  return pathname.slice(EXECUTIVE_BRIEF_ROUTE_BASE.length).replace(EXECUTIVE_BRIEF_TRAILING_SLASH_PATTERN, '');
};

const findRoute = (pathname: string): ExecutiveBriefRouteDefinition | undefined => {
  const subPath = subPathOf(pathname);
  return subPath === null ? undefined : EXECUTIVE_BRIEF_ROUTES.find((route) => route.path === subPath);
};

const dispatchRoute = (
  key: ExecutiveBriefRouteKey,
  request: Request,
  environment: CloudflareEnvironment
): Promise<Response> => {
  switch (key) {
    case 'report':
      return handleExecutiveBriefReport(request, environment);
    case 'audit':
      return handleExecutiveBriefAudit(request, environment);
    case 'downloadPdf':
      return handleExecutiveBriefDownload(request, environment, 'pdf');
    case 'downloadPptx':
      return handleExecutiveBriefDownload(request, environment, 'pptx');
    case 'opportunityBriefPdf':
      return handleOpportunityBriefDownload(request, environment, 'pdf');
    case 'opportunityBriefPptx':
      return handleOpportunityBriefDownload(request, environment, 'pptx');
    case 'opportunityBriefReport':
      return handleOpportunityBriefReport(request, environment);
    case 'email':
      return handleExecutiveBriefEmail(request, environment);
    case 'regenerate':
      return handleExecutiveBriefRegenerate(request, environment);
  }
};

export const handleExecutiveBriefRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<Response | null> => {
  const route = findRoute(url.pathname);
  if (route === undefined) {
    return null;
  }
  if (route.method !== request.method) {
    return methodNotAllowedResponse(request, resolveExecutiveBriefRequestId(request), route.method);
  }
  return dispatchRoute(route.key, request, environment);
};
