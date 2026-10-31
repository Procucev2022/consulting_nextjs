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
  environment: CloudflareEnvironment,
  url: URL
): Promise<Response> => {
  switch (key) {
    case 'report':
      return Promise.resolve(handleExecutiveBriefReport(request, url));
    case 'audit':
      return Promise.resolve(handleExecutiveBriefAudit(request, url));
    case 'downloadPdf':
      return handleExecutiveBriefDownload(request, url, 'pdf');
    case 'downloadPptx':
      return handleExecutiveBriefDownload(request, url, 'pptx');
    case 'opportunityBriefPdf':
      return handleOpportunityBriefDownload(request, environment, 'pdf');
    case 'opportunityBriefPptx':
      return handleOpportunityBriefDownload(request, environment, 'pptx');
    case 'opportunityBriefReport':
      return handleOpportunityBriefReport(request, environment);
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
  return dispatchRoute(route.key, request, environment, url);
};
