export interface Module2LogisticsPackagingCandidate {
  candidateId: string;
  assessmentId: string;
  lane: string;
  materialCategory: string;
  shippingMode: string;
  incoterms: string;
  shipmentCount: number;
  currentFreightInr: number;
  benchmarkFreightInr: number | null;
  packagingSpec: string;
  containerFillPct: number | null;
  evidenceStatus: 'DEMO_ONLY' | 'SOURCE_PENDING' | 'SOURCE_VERIFIED';
  isDemo: boolean;
  updatedAt: string;
}

export interface Module2LogisticsPackagingResponse {
  success: boolean;
  count: number;
  candidates: Module2LogisticsPackagingCandidate[];
}

export interface Module2LogisticsPackagingViewProps {
  assessmentId: string;
}
