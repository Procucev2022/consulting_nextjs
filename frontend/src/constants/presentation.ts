import type { PresentationSlideInfo } from '../types/presentation';

export const PRESENTATION_TOTAL_SLIDES = 10;
export const PROCUCEV_LOGO_SRC = '/images/procucev-logo.jpg';

export const PRESENTATION_SLIDES_LIST: PresentationSlideInfo[] = [
  { id: 'cover', slideNumber: 1, title: 'Title & Management Brief', category: 'Executive' },
  { id: 'confidentiality', slideNumber: 2, title: 'Confidentiality & NDA Governance', category: 'Legal' },
  { id: 'about', slideNumber: 3, title: 'About Procucev Enterprise Platform', category: 'Overview' },
  { id: 'scorecard', slideNumber: 4, title: 'Spend Diagnosis & Value Scorecard', category: 'Analytics' },
  { id: 'ingestion', slideNumber: 5, title: 'Multi-Year Data Reconciliation', category: 'Ingestion' },
  { id: 'taxonomy', slideNumber: 6, title: 'AI Spend Taxonomy Classification', category: 'Taxonomy' },
  { id: 'strategicRisk', slideNumber: 7, title: 'Single-Vendor Concentration Risk', category: 'Risk Engine' },
  { id: 'priceCreep', slideNumber: 8, title: '36-Month Volatility & Price Creep', category: 'Pricing' },
  { id: 'savingsLevers', slideNumber: 9, title: 'Actionable Savings Levers', category: 'Opportunities' },
  { id: 'governance', slideNumber: 10, title: 'Execution Roadmap & Governance', category: 'Milestones' }
];
