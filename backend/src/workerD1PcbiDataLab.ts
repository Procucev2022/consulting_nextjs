import { D1_ROUTE_MESSAGES } from './constants/d1';
import type { CloudflareEnvironment } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import { requestJsonFailureResult } from './workerHttp';
import { requireWorkerDb } from './services/workerD1Query';
import { mapPcbiCommoditySource, uploadPcbiCommoditySource } from './workerD1PcbiDataLabUpload';
import { handlePcbiCommodityApproval, handlePcbiResearchAssignment } from './workerD1PcbiDataLabWriteRoutes';
import { detectPcbiDataLabDomain } from './workerD1PcbiDataLabDetection';
import {
  buildQueue, dashboard, getBenchmark, promotions, sourceRows, workspace
} from './workerD1PcbiDataLabReadModel';

const id = (): string => crypto.randomUUID();

export const handlePcbiDataLabRoute = async (
  environment: CloudflareEnvironment, request: Request, url: URL, actorName: string
): Promise<WorkerD1Result> => {
  const requestId = request.headers.get('x-request-id') || id();
  const root = '/api/admin/pcbi/data-lab';
  const path = url.pathname.slice(root.length) || '/';
  const db = requireWorkerDb(environment.DB);
  try {
  if (path === '/detect-domain' && request.method === 'POST') return await detectPcbiDataLabDomain(request);
  if (path === '/upload-source' && request.method === 'POST') return await uploadPcbiCommoditySource(environment, request, actorName, requestId, { getBenchmark, detectDomain: detectPcbiDataLabDomain });
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


