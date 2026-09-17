export interface CloudflareEnvironment {
  BACKEND_ORIGIN?: string;
}

export interface CloudflareExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}