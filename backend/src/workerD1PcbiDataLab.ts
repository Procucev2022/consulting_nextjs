import { D1_ROUTE_MESSAGES } from './constants/d1';
import { detectUploadDomainSchema } from './constants/validation';
import type { CloudflareEnvironment } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import { readJson, requestJsonFailureResult } from './workerHttp';
import type { PCBIDataLabDomainResult } from './types/pcbiDataLabStorage';
import { requireWorkerDb } from './services/workerD1Query';
import { mapPcbiCommoditySource, uploadPcbiCommoditySource } from './workerD1PcbiDataLabUpload';
import { handlePcbiCommodityApproval, handlePcbiResearchAssignment } from './workerD1PcbiDataLabWriteRoutes';
import {
  buildQueue, dashboard, getBenchmark, promotions, sourceRows, workspace
} from './workerD1PcbiDataLabReadModel';

const id = (): string => crypto.randomUUID();

const detectDomain = async (request: Request): Promise<WorkerD1Result> => {
  const body: unknown = await readJson(request);
  const parsed = detectUploadDomainSchema.safeParse(body);
  if (!parsed.success) return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabInvalid, errors: parsed.error.issues } };
  const text = `${parsed.data.fileName} ${parsed.data.fileContentSnippet || ''}`.toLowerCase().replace(/[_-]+/gu, ' ');
  const matchedSignatures: string[] = [];
  const customerTokens = ['purchase order', 'purchase history', 'customer data', 'customer_po', 'supplier', 'invoice', 'net price', 'order quantity'];
  const masterTokens = ['pcbi master', 'benchmark master', 'unspsc mapping', 'weekly index master'];
  const researchTokens = ['commodity', 'market price', 'benchmark index', 'historical price', 'price index'];
  const signatures = (tokens: string[]): string[] => tokens.filter((token) => text.includes(token));
  const customerMatches = signatures(customerTokens);
  const masterMatches = signatures(masterTokens);
  const researchMatches = signatures(researchTokens);
  let detectedDomain: PCBIDataLabDomainResult['detectedDomain'] = 'UNKNOWN';
  if (customerMatches.length >= 2 || /customer.*(?:po|purchase)|purchase history/i.test(parsed.data.fileName)) {
    detectedDomain = 'CUSTOMER_PURCHASE_HISTORY';
    matchedSignatures.push(...customerMatches);
    if (matchedSignatures.length === 0) matchedSignatures.push('customer purchase file name');
  }
  else if (masterMatches.length > 0) { detectedDomain = 'PCBI_MASTER_SYSTEM_DATA'; matchedSignatures.push(...masterMatches); }
  else if (researchMatches.length > 0) { detectedDomain = 'COMMODITY_RESEARCH_EVIDENCE'; matchedSignatures.push(...researchMatches); }
  const allowed = detectedDomain === 'UNKNOWN' ||
    (parsed.data.targetArea === 'MODULE_1_INGESTION' && detectedDomain === 'CUSTOMER_PURCHASE_HISTORY') ||
    (parsed.data.targetArea === 'PCBI_MASTER' && detectedDomain === 'PCBI_MASTER_SYSTEM_DATA') ||
    (parsed.data.targetArea === 'COMMODITY_DATA_LAB' && detectedDomain === 'COMMODITY_RESEARCH_EVIDENCE');
  const targetName = parsed.data.targetArea === 'MODULE_1_INGESTION' ? 'Module 1' : parsed.data.targetArea === 'PCBI_MASTER' ? 'PCBI Master' : 'Commodity Data Lab';
  const detection: PCBIDataLabDomainResult = {
    detectedDomain, targetArea: parsed.data.targetArea, isAllowedInTarget: allowed, matchedSignatures,
    ...(allowed ? {} : {
      errorMessage: D1_ROUTE_MESSAGES.pcbiDataLabDomainRejected(targetName),
      guidanceMessage: detectedDomain === 'CUSTOMER_PURCHASE_HISTORY'
        ? 'Upload customer purchase history through Module 1 ingestion.'
        : 'Upload PCBI master definitions through the PCBI Master tab.'
    })
  };
  return { data: { success: true, detection } };
};

export const handlePcbiDataLabRoute = async (
  environment: CloudflareEnvironment, request: Request, url: URL, actorName: string
): Promise<WorkerD1Result> => {
  const requestId = request.headers.get('x-request-id') || id();
  const root = '/api/admin/pcbi/data-lab';
  const path = url.pathname.slice(root.length) || '/';
  const db = requireWorkerDb(environment.DB);
  try {
  if (path === '/detect-domain' && request.method === 'POST') return await detectDomain(request);
  if (path === '/upload-source' && request.method === 'POST') return await uploadPcbiCommoditySource(environment, request, actorName, requestId, { getBenchmark, detectDomain });
  if (path === '/approve' && request.method === 'POST') return await handlePcbiCommodityApproval(environment, request, actorName, requestId);
  if (path === '/assignment' && request.method === 'POST') return await handlePcbiResearchAssignment(db, request, actorName, requestId);
  if (path === '/dashboard' && request.method === 'GET') return dashboard(db, requestId);
  if (path === '/queue' && request.method === 'GET') {
    const queue = await buildQueue(db, requestId);
    return { data: { success: true, total: queue.length, queue } };
  }
  if (path === '/sources' && request.method === 'GET') {
    const rows = await sourceRows(db);
    return { data: { success: true, total: rows.length, sources: rows.map(mapPcbiCommoditySource) } };
  }
  if (path === '/version-history' && request.method === 'GET') {
    const rows = await promotions(db);
    return { data: { success: true, total: rows.length, versions: rows } };
  }
  const commodityMatch = path.match(/^\/commodity\/([^/]+)$/u);
  if (commodityMatch && request.method === 'GET') {
    const tab = url.searchParams.get('tab') || 'OVERVIEW';
    return workspace(db, decodeURIComponent(commodityMatch[1]), tab, requestId);
  }
  const allowedPath = ['/detect-domain', '/upload-source', '/approve', '/assignment', '/dashboard', '/queue', '/sources', '/version-history'].includes(path) || Boolean(commodityMatch);
  return {
    status: allowedPath ? 405 : 404,
    data: { success: false, message: allowedPath ? D1_ROUTE_MESSAGES.pcbiDataLabMethod : D1_ROUTE_MESSAGES.unknownPcbi }
  };
  } catch (error: unknown) {
    const failure = requestJsonFailureResult(request, error);
    if (failure) return failure;
    throw error;
  }
};


