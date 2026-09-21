export interface CloudflareD1Database {
  prepare(query: string): CloudflareD1PreparedStatement;
}

export interface CloudflareD1PreparedStatement {
  bind(...values: unknown[]): CloudflareD1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface CloudflareR2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string,
    options?: Record<string, unknown>
  ): Promise<unknown>;
  get(key: string): Promise<CloudflareR2Object | null>;
  delete(key: string): Promise<void>;
}

export interface CloudflareR2Object {
  body: ReadableStream;
  httpMetadata?: { contentType?: string; contentDisposition?: string };
  httpEtag?: string;
}

export interface CloudflareEnvironment {
  DB?: CloudflareD1Database;
  OBJECTS?: CloudflareR2Bucket;
  FRONTEND_URL?: string;
  AUTH_SECRET?: string;
}

export interface AuthRouteResult {
  body: Record<string, unknown>;
  status: number;
}

export interface CloudflareExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}