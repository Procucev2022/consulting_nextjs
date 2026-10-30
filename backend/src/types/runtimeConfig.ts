export interface GeminiRuntimeConfig {
  apiKey?: string;
  backupKeys: string[];
  baseUrl: string;
  primaryModel: string;
  fallbackModels: string[];
  requestTimeoutMs: number;
  totalBudgetMs: number;
  minAttemptMs: number;
  maxDocumentBytes: number;
  maxDocumentTextChars: number;
}

export interface WorkerRuntimeConfig {
  authSecret: string;
  appEncryptionKey: string;
  frontendUrl?: string;
  appUrl?: string;
  r2Bucket?: string;
  d1DatabaseName?: string;
  adminEmail?: string;
  adminMobile?: string;
  gemini: GeminiRuntimeConfig;
}
