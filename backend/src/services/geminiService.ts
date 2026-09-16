import { GEMINI_CONFIG, GEMINI_INLINE_MIME_TYPES, EXTRACTION_STATUS, EXTRACTION_SYSTEM_PROMPT } from '../constants/ai';
import type { ExtractionResult, ExtractionStatus, ExtractedProcurementItem } from '../types/ai';
import logger from '../utils/logger';

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
  public isConfigured(): boolean {
    return Boolean(GEMINI_CONFIG.API_KEY);
  }

  public resolveModelChain(): string[] {
    return [GEMINI_CONFIG.PRIMARY_MODEL, ...GEMINI_CONFIG.FALLBACK_MODELS].filter(Boolean);
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

  private buildRequestBody(params: {
    promptText: string;
    documentText?: string;
    inlineData?: string;
    mimeType?: string;
    fileName?: string;
  }): {
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
      generationConfig: { temperature: GEMINI_CONFIG.TEMPERATURE, response_mime_type: 'application/json' }
    };
  }

  public async callModel<T = unknown>(
    model: string,
    requestBody: unknown,
    timeoutMs: number = GEMINI_CONFIG.REQUEST_TIMEOUT_MS
  ): Promise<T> {
    const url = `${GEMINI_CONFIG.BASE_URL}/${model}:generateContent`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_CONFIG.API_KEY },
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

  public async generateJson<T = unknown>(input: {
    prompt: string;
    label?: string;
  }): Promise<{ status: ExtractionStatus; data: T | null; model: string | null; error: string | null }> {
    const { prompt, label = 'generation' } = input;
    if (!this.isConfigured()) {
      logger.warn(`Gemini ${label} skipped: GEMINI_API_KEY is not set`, { label }, new Error('Gemini key missing'));
      return { status: EXTRACTION_STATUS.NOT_CONFIGURED, data: null, model: null, error: 'GEMINI_API_KEY not set' };
    }
    if (typeof prompt !== 'string' || prompt.trim() === '') {
      return { status: EXTRACTION_STATUS.NO_CONTENT, data: null, model: null, error: 'Prompt is empty' };
    }

    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: GEMINI_CONFIG.TEMPERATURE, response_mime_type: 'application/json' }
    };
    const failures: string[] = [];
    const deadline = Date.now() + GEMINI_CONFIG.TOTAL_BUDGET_MS;

    for (const model of this.resolveModelChain()) {
      const remainingMs = deadline - Date.now();
      if (remainingMs < GEMINI_CONFIG.MIN_ATTEMPT_MS) break;

      try {
        const parsed = await this.callModel<T>(
          model,
          requestBody,
          Math.min(GEMINI_CONFIG.REQUEST_TIMEOUT_MS, remainingMs)
        );
        logger.info(`Gemini ${model} completed ${label} successfully`, { model, label });
        return { status: EXTRACTION_STATUS.SUCCESS, data: parsed, model, error: null };
      } catch (err: unknown) {
        const errorObj = err as Error;
        failures.push(`${model}: ${errorObj.message}`);
        logger.warn(`Gemini ${label} attempt failed on ${model}`, { error: errorObj.message });
      }
    }

    return { status: EXTRACTION_STATUS.AI_FAILED, data: null, model: null, error: failures.join(' | ') };
  }

  private validateExtractionInput(input: {
    documentText?: string;
    inlineData?: string;
    mimeType?: string;
  }): { isValid: boolean; errorStatus?: ExtractionStatus; errorMessage?: string } {
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
      if (approxBytes > GEMINI_CONFIG.MAX_DOCUMENT_BYTES) {
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
    fileName?: string
  ): Promise<ExtractionResult | null> {
    const parsed = await this.callModel<RawExtractedPayload>(
      model,
      requestBody,
      Math.min(GEMINI_CONFIG.REQUEST_TIMEOUT_MS, remainingMs)
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
      documentText: trimmedText.slice(0, GEMINI_CONFIG.MAX_DOCUMENT_TEXT_CHARS),
      inlineData: input.inlineData,
      mimeType: input.mimeType,
      fileName: input.fileName
    });

    const failures: string[] = [];
    const deadline = Date.now() + GEMINI_CONFIG.TOTAL_BUDGET_MS;

    for (const model of this.resolveModelChain()) {
      const remainingMs = deadline - Date.now();
      if (remainingMs < GEMINI_CONFIG.MIN_ATTEMPT_MS) break;

      try {
        const result = await this.attemptModelExtraction(model, requestBody, remainingMs, input.fileName);
        if (result) return result;
      } catch (err: unknown) {
        const errorObj = err as Error;
        failures.push(`${model}: ${errorObj.message}`);
        logger.warn(`Gemini extraction attempt failed on ${model}`, { error: errorObj.message });
      }
    }

    return { ...base, status: EXTRACTION_STATUS.AI_FAILED, error: failures.join(' | ') };
  }
}

export const geminiService = new GeminiService();
