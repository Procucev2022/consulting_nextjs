import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import type { CloudflareEnvironment, CloudflareExecutionContext } from './types/cloudflare';
import { db } from './services/db';
import app from './app';

const handleExpress = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const socket = new Socket();

  const req = new IncomingMessage(socket);
  req.url = url.pathname + url.search;
  req.method = request.method;
  request.headers.forEach((value, key) => {
    req.headers[key.toLowerCase()] = value;
  });

  // Ensure body-parser / raw-body marks the stream as readable
  req.readable = true;
  (req as any)._readableState = (req as any)._readableState || {};
  (req as any)._readableState.ended = false;

  const chunks: Buffer[] = [];
  const res = new ServerResponse(req);

  return new Promise<Response>(async (resolve, reject) => {
    res.write = function (chunk: any, ...args: any[]) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return true;
    };

    res.end = function (chunk: any, ...args: any[]) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const rawHeaders = res.getHeaders();
      const responseHeaders = new Headers();
      Object.entries(rawHeaders).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach(val => responseHeaders.append(k, String(val)));
        } else if (v !== undefined) {
          responseHeaders.set(k, String(v));
        }
      });

      // Ensure CORS headers for cross-origin browser fetch
      const origin = request.headers.get('Origin');
      if (origin) {
        responseHeaders.set('Access-Control-Allow-Origin', origin);
      } else {
        responseHeaders.set('Access-Control-Allow-Origin', '*');
      }
      responseHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-Id,x-request-id,x-buyer-id,x-tenant-id');
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');

      const body = chunks.length > 0 ? Buffer.concat(chunks) : null;
      resolve(new Response(body, {
        status: res.statusCode || 200,
        statusText: res.statusMessage || 'OK',
        headers: responseHeaders
      }));
      return res;
    };

    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        const bodyBuffer = Buffer.from(await request.arrayBuffer());
        req.headers['content-length'] = String(bodyBuffer.length);
        req.push(bodyBuffer);
      }
      req.push(null);
      app(req, res);
    } catch (err) {
      reject(err);
    }
  });
};

export const fetch = async (
  request: Request,
  environment: CloudflareEnvironment,
  _executionContext: CloudflareExecutionContext
): Promise<Response> => {
  if (environment.DB) {
    await db.initD1(environment.DB);
  }

  // Fast preflight response
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin') || '*';
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Request-Id,x-request-id,x-buyer-id,x-tenant-id',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }

  return handleExpress(request);
};

export default { fetch };