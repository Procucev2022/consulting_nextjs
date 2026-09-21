export interface CloudflareEnvironment {
  BACKEND_ORIGIN?: string;
  DB?: any;
}

export interface CloudflareExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}