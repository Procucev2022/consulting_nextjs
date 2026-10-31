import { GEMINI_CONFIG, resolveGeminiConfig, GEMINI_INLINE_MIME_TYPES, EXTRACTION_STATUS, EXTRACTION_SYSTEM_PROMPT } from '../constants/ai';
import type { CloudflareEnvironment } from '../types/cloudflare';
import type {
  ExtractionResult,
  ExtractedProcurementItem,
  GeminiConfig,
  GeminiInputValidationResult,
  GeminiJsonGenerationInput,
  GeminiJsonGenerationResult,
  GeminiRequestDocumentInput,
  GeminiStructuredRequestInput
} from '../types/ai';
import logger from '../utils/logger';
import { generateGeminiJson } from './geminiJsonGeneration';

interface GeminiContentPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

interface GeminiApiResponse {
  candidates?: Array<{ content?: { parts?: GeminiContentPart[] } }>;
}

interface RawExtractedItem {
  poNumber?: string | null;
  vendorName?: string | null;
  itemDescription?: string;
  quantity?: number | null;
  unit?: string | null;
  unitPrice?: number | null;
  totalAmount?: number;
  currency?: string | null;
  date?: string | null;
  suggestedCategory?: string | null;
}

interface RawExtractedPayload {
  documentTitle?: string | null;
  detectedCurrency?: string | null;
  totalSpend?: number | null;
  items?: RawExtractedItem[];
}

export class GeminiService {
  private config: GeminiConfig = GEMINI_CONFIG;

  public configureForEnvironment(environment: CloudflareEnvironment): void {
    this.config = resolveGeminiConfig(environment);
  }

  public isConfigured(): boolean {
    return Boolean(this.config.API_KEY || (this.config.BACKUP_KEYS && this.config.BACKUP_KEYS.length > 0));
  }

  public resolveModelChain(): string[] {
    return [this.config.PRIMARY_MODEL, ...this.config.FALLBACK_MODELS].filter(Boolean);
  }

  public resolveKeyChain(): string[] {
    return Array.from(new Set([this.config.API_KEY, ...(this.config.BACKUP_KEYS || [])].filter(Boolean)));
  }

  public extractResponseText(payload: GeminiApiResponse | null | undefined): string {
    const parts = payload?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return '';
    return parts.map((p) => (typeof p.text === 'string' ? p.text : '')).join('').trim();
  }

  public parseExtractionJson<T = unknown>(text: string): T | null {
    if (!text) return null;
    let candidate = text.trim();
    const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) candidate = fenced[1].trim();

    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace <= firstBrace) return null;
    candidate = candidate.slice(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(candidate) as T;
    } catch {
      return null;
    }
  }

  private buildRequestBody(params: GeminiStructuredRequestInput): {
    contents: Array<{ role: string; parts: GeminiContentPart[] }>;
    generationConfig: { temperature: number; response_mime_type: string };
  } {
    const parts: GeminiContentPart[] = [{ text: params.promptText }];
    if (params.fileName) parts.push({ text: `\nDOCUMENT FILE NAME: ${params.fileName}` });
    if (params.documentText) parts.push({ text: `\nDOCUMENT TEXT:\n${params.documentText}` });
    if (params.inlineData && params.mimeType) {
      parts.push({ inline_data: { mime_type: params.mimeType, data: params.inlineData } });
    }

    return {
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: this.config.TEMPERATURE, response_mime_type: 'application/json' }
    };
  }

  public async callModel<T = unknown>(
    model: string,
    requestBody: unknown,
    timeoutMs: number = this.config.REQUEST_TIMEOUT_MS,
    apiKey: string = this.config.API_KEY
  ): Promise<T> {
    const url = `${this.config.BASE_URL}/${model}:generateContent`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Gemini ${model} responded ${res.status}: ${detail.slice(0, 200)}`);
      }

      const payload = (await res.json()) as GeminiApiResponse;
      const rawText = this.extractResponseText(payload);
      const parsed = this.parseExtractionJson<T>(rawText);
      if (!parsed) throw new Error(`Gemini ${model} returned no parseable JSON: ${rawText.slice(0, 100)}`);
      return parsed;
    } finally {
      clearTimeout(timer);
    }
  }

  public async generateJson<T = unknown>(input: GeminiJsonGenerationInput): Promise<GeminiJsonGenerationResult<T>> {
    const dependencies = {
      config: this.config,
      isConfigured: () => this.isConfigured(),
      resolveModelChain: () => this.resolveModelChain(),
      resolveKeyChain: () => this.resolveKeyChain(),
      buildRequestBody: (params: GeminiStructuredRequestInput) => this.buildRequestBody(params),
      validateExtractionInput: (params: GeminiRequestDocumentInput): GeminiInputValidationResult =>
        this.validateExtractionInput(params),
      callModel: <TResult>(model: string, body: unknown, timeout: number, apiKey: string) =>
        this.callModel<TResult>(model, body, timeout, apiKey)
    };
    return generateGeminiJson<T>(input, dependencies);
  }

  private validateExtractionInput(input: GeminiRequestDocumentInput): GeminiInputValidationResult {
    const hasText = typeof input.documentText === 'string' && input.documentText.trim().length > 0;
    const hasInline = typeof input.inlineData === 'string' && input.inlineData.trim().length > 0;

    if (!hasText && !hasInline) {
      return {
        isValid: false,
        errorStatus: EXTRACTION_STATUS.NO_CONTENT,
        errorMessage: 'Neither document text nor file data was provided for extraction'
      };
    }

    if (hasInline) {
      if (!input.mimeType || !GEMINI_INLINE_MIME_TYPES.includes(input.mimeType)) {
        return {
          isValid: false,
          errorStatus: EXTRACTION_STATUS.UNSUPPORTED_TYPE,
          errorMessage: `MIME type "${input.mimeType}" is not supported for AI document processing`
        };
      }
      const approxBytes = Math.floor(((input.inlineData || '').length * 3) / 4);
      if (approxBytes > this.config.MAX_DOCUMENT_BYTES) {
        return {
          isValid: false,
          errorStatus: EXTRACTION_STATUS.DOCUMENT_TOO_LARGE,
          errorMessage: 'Document exceeds size limit'
        };
      }
    }

    return { isValid: true };
  }

  private transformRawItems(rawItems: RawExtractedItem[]): ExtractedProcurementItem[] {
    return (rawItems || []).map((item: RawExtractedItem) => ({
      poNumber: typeof item?.poNumber === 'string' ? item.poNumber.trim() : null,
      vendorName: typeof item?.vendorName === 'string' ? item.vendorName.trim() : null,
      itemDescription: typeof item?.itemDescription === 'string' ? item.itemDescription.trim() : 'Unnamed Item',
      quantity: typeof item?.quantity === 'number' ? item.quantity : null,
      unit: typeof item?.unit === 'string' ? item.unit.trim() : null,
      unitPrice: typeof item?.unitPrice === 'number' ? item.unitPrice : null,
      totalAmount: typeof item?.totalAmount === 'number' ? item.totalAmount : 0,
      currency: typeof item?.currency === 'string' ? item.currency.trim() : null,
      date: typeof item?.date === 'string' ? item.date.trim() : null,
      suggestedCategory: typeof item?.suggestedCategory === 'string' ? item.suggestedCategory.trim() : null
    })).filter((i: ExtractedProcurementItem) => i.itemDescription !== '');
  }

  private async attemptModelExtraction(
    model: string,
    requestBody: unknown,
    remainingMs: number,
    fileName?: string,
    apiKey: string = this.config.API_KEY
  ): Promise<ExtractionResult | null> {
    const parsed = await this.callModel<RawExtractedPayload>(
      model,
      requestBody,
      Math.min(this.config.REQUEST_TIMEOUT_MS, remainingMs),
      apiKey
    );

    const items = this.transformRawItems(parsed?.items || []);
    if (items.length === 0) {
      return {
        status: EXTRACTION_STATUS.NO_ITEMS_FOUND,
        items: [],
        model,
        documentTitle: null,
        detectedCurrency: null,
        totalSpend: null,
        error: null
      };
    }

    return {
      status: EXTRACTION_STATUS.SUCCESS,
      items,
      model,
      documentTitle: typeof parsed?.documentTitle === 'string' ? parsed.documentTitle : fileName || null,
      detectedCurrency: typeof parsed?.detectedCurrency === 'string' ? parsed.detectedCurrency : 'INR',
      totalSpend: typeof parsed?.totalSpend === 'number'
        ? parsed.totalSpend
        : items.reduce((acc, x) => acc + x.totalAmount, 0),
      error: null
    };
  }

  public async extractLineItems(input: {
    documentText?: string;
    inlineData?: string;
    mimeType?: string;
    fileName?: string;
  } = {}): Promise<ExtractionResult> {
    const base: ExtractionResult = {
      status: EXTRACTION_STATUS.SUCCESS,
      items: [],
      model: null,
      documentTitle: null,
      detectedCurrency: null,
      totalSpend: null,
      error: null
    };

    if (!this.isConfigured()) {
      logger.warn('Gemini extraction skipped: GEMINI_API_KEY is not set', {}, new Error('Gemini API key missing'));
      return { ...base, status: EXTRACTION_STATUS.NOT_CONFIGURED, error: 'GEMINI_API_KEY not configured' };
    }

    const check = this.validateExtractionInput(input);
    if (!check.isValid) {
      return {
        ...base,
        status: check.errorStatus || EXTRACTION_STATUS.AI_FAILED,
        error: check.errorMessage || 'Invalid input'
      };
    }

    const trimmedText = typeof input.documentText === 'string' ? input.documentText.trim() : '';
    const requestBody = this.buildRequestBody({
      promptText: EXTRACTION_SYSTEM_PROMPT,
      documentText: trimmedText.slice(0, this.config.MAX_DOCUMENT_TEXT_CHARS),
      inlineData: input.inlineData,
      mimeType: input.mimeType,
      fileName: input.fileName
    });

    const failures: string[] = [];
    const deadline = Date.now() + this.config.TOTAL_BUDGET_MS;
    const keys = this.resolveKeyChain();

    for (const model of this.resolveModelChain()) {
      for (const apiKey of keys) {
        const remainingMs = deadline - Date.now();
        if (remainingMs < this.config.MIN_ATTEMPT_MS) break;

        try {
          const result = await this.attemptModelExtraction(model, requestBody, remainingMs, input.fileName, apiKey);
          if (result) return result;
        } catch (err: unknown) {
          const errorObj = err as Error;
          failures.push(`${model}: ${errorObj.message}`);
          logger.warn(`Gemini extraction attempt failed on ${model}`, { error: errorObj.message });
          if (errorObj.message.includes('404')) {
            break;
          }
        }
      }
    }

    return { ...base, status: EXTRACTION_STATUS.AI_FAILED, error: failures.join(' | ') };
  }
}

export const geminiService = new GeminiService();
