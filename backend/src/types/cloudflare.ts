export interface CloudflareEnvironment {
  BACKEND_ORIGIN?: string;
  DB?: unknown;
}

export interface CloudflareExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}