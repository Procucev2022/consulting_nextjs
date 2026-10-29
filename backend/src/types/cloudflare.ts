export interface CloudflareD1Database {
  prepare(query: string): CloudflareD1PreparedStatement;
  batch?(statements: CloudflareD1PreparedStatement[]): Promise<unknown[]>;
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
  APP_ENCRYPTION_KEY?: string;
  NEXT_PUBLIC_APP_URL?: string;
  R2_BUCKET?: string;
  D1_DATABASE_NAME?: string;
  ADMIN_EMAIL?: string;
  ADMIN_MOBILE?: string;
  GEMINI_API_KEY?: string;
  GEMINI_BACKUP_KEYS?: string;
  GEMINI_BASE_URL?: string;
  GEMINI_PRIMARY_MODEL?: string;
  GEMINI_FALLBACK_MODELS?: string;
  GEMINI_REQUEST_TIMEOUT_MS?: string | number;
  GEMINI_TOTAL_BUDGET_MS?: string | number;
  GEMINI_MIN_ATTEMPT_MS?: string | number;
  GEMINI_MAX_DOCUMENT_BYTES?: string | number;
  GEMINI_MAX_DOCUMENT_TEXT_CHARS?: string | number;
}

export interface AuthRouteResult {
  body: Record<string, unknown>;
  status: number;
}

export interface CloudflareExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
