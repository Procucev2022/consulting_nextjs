import {
  PCBI_DATA_LAB_CUSTOMER_FILE_NAME_PATTERN,
  PCBI_DATA_LAB_DOMAIN_GUIDANCE,
  PCBI_DATA_LAB_DOMAIN_SIGNATURES,
  PCBI_DATA_LAB_TARGET_NAMES,
  PCBI_DATA_LAB_TOKEN_NORMALIZATION_PATTERN
} from './constants/pcbiDataLab';
import { D1_ROUTE_MESSAGES } from './constants/d1';
import { detectUploadDomainSchema } from './constants/validation';
import type { WorkerD1Result } from './types/d1';
import type { PCBIDataLabDomainResult } from './types/pcbiDataLabStorage';
import { readJson } from './workerHttp';

export const detectPcbiDataLabDomain = async (request: Request): Promise<WorkerD1Result> => {
  const body: unknown = await readJson(request);
  const parsed = detectUploadDomainSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabInvalid, errors: parsed.error.issues }
    };
  }

  const text = `${parsed.data.fileName} ${parsed.data.fileContentSnippet || ''}`
    .toLowerCase()
    .replace(PCBI_DATA_LAB_TOKEN_NORMALIZATION_PATTERN, ' ');
  const matchedSignatures: string[] = [];
  const signatures = (tokens: readonly string[]): string[] => tokens.filter((token) => text.includes(token));
  const customerMatches = signatures(PCBI_DATA_LAB_DOMAIN_SIGNATURES.customerPurchase);
  const masterMatches = signatures(PCBI_DATA_LAB_DOMAIN_SIGNATURES.pcbiMaster);
  const researchMatches = signatures(PCBI_DATA_LAB_DOMAIN_SIGNATURES.commodityResearch);
  let detectedDomain: PCBIDataLabDomainResult['detectedDomain'] = 'UNKNOWN';

  if (customerMatches.length >= 2 || PCBI_DATA_LAB_CUSTOMER_FILE_NAME_PATTERN.test(parsed.data.fileName)) {
    detectedDomain = 'CUSTOMER_PURCHASE_HISTORY';
    matchedSignatures.push(...customerMatches);
    if (matchedSignatures.length === 0) matchedSignatures.push('customer purchase file name');
  } else if (masterMatches.length > 0) {
    detectedDomain = 'PCBI_MASTER_SYSTEM_DATA';
    matchedSignatures.push(...masterMatches);
  } else if (researchMatches.length > 0) {
    detectedDomain = 'COMMODITY_RESEARCH_EVIDENCE';
    matchedSignatures.push(...researchMatches);
  }

  const allowed = detectedDomain === 'UNKNOWN' ||
    (parsed.data.targetArea === 'MODULE_1_INGESTION' && detectedDomain === 'CUSTOMER_PURCHASE_HISTORY') ||
    (parsed.data.targetArea === 'PCBI_MASTER' && detectedDomain === 'PCBI_MASTER_SYSTEM_DATA') ||
    (parsed.data.targetArea === 'COMMODITY_DATA_LAB' && detectedDomain === 'COMMODITY_RESEARCH_EVIDENCE');
  const targetName = PCBI_DATA_LAB_TARGET_NAMES[parsed.data.targetArea];
  const detection: PCBIDataLabDomainResult = {
    detectedDomain,
    targetArea: parsed.data.targetArea,
    isAllowedInTarget: allowed,
    matchedSignatures,
    ...(allowed ? {} : {
      errorMessage: D1_ROUTE_MESSAGES.pcbiDataLabDomainRejected(targetName),
      guidanceMessage: detectedDomain === 'CUSTOMER_PURCHASE_HISTORY'
        ? PCBI_DATA_LAB_DOMAIN_GUIDANCE.customerPurchase
        : PCBI_DATA_LAB_DOMAIN_GUIDANCE.pcbiMaster
    })
  };
  return { data: { success: true, detection } };
};
