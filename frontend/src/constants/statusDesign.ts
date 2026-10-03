/**
 * Enterprise Status Design System Constants (Part L)
 * Single unified styling authority for PCBI and commodity workflow statuses.
 */

import type { PCBIEnterpriseStatus } from '../types/pcbiCommodityDataLab';

export interface StatusDesignConfig {
  key: PCBIEnterpriseStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export const ENTERPRISE_STATUS_MAP: Record<PCBIEnterpriseStatus, StatusDesignConfig> = {
  PRODUCTION_READY: {
    key: 'PRODUCTION_READY',
    label: 'Production Ready',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
    dotClass: 'bg-emerald-400',
    description: 'Fully validated time-series with approved methodology and complete historical depth.'
  },
  PARTIAL_HISTORY: {
    key: 'PARTIAL_HISTORY',
    label: 'Partial History',
    badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
    dotClass: 'bg-amber-400',
    description: 'Historical observations present but multi-month or quarterly gaps remain unresolved.'
  },
  NO_HISTORY: {
    key: 'NO_HISTORY',
    label: 'No History',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-500/40',
    dotClass: 'bg-rose-400',
    description: 'No verified historical market data has been uploaded to the PCBI Data Library.'
  },
  MISSING: {
    key: 'MISSING',
    label: 'Missing PCBI',
    badgeClass: 'bg-red-950/70 text-red-300 border-red-500/40',
    dotClass: 'bg-red-400',
    description: 'Commodity is completely unmapped to any existing or proposed PCBI series.'
  },
  SOURCE_UNVERIFIED: {
    key: 'SOURCE_UNVERIFIED',
    label: 'Source Unverified',
    badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-500/40',
    dotClass: 'bg-purple-400',
    description: 'Candidate source staged but publisher credentials and provenance require verification.'
  },
  METHODOLOGY_PENDING: {
    key: 'METHODOLOGY_PENDING',
    label: 'Methodology Pending',
    badgeClass: 'bg-sky-950/70 text-sky-300 border-sky-500/40',
    dotClass: 'bg-sky-400',
    description: 'Specification or proxy derivation formulation awaits formal governance review.'
  },
  SPECIFICATION_MISMATCH: {
    key: 'SPECIFICATION_MISMATCH',
    label: 'Specification Mismatch',
    badgeClass: 'bg-orange-950/70 text-orange-300 border-orange-500/40',
    dotClass: 'bg-orange-400',
    description: 'Source grade differs chemically or commercially from the customer transaction requirement.'
  },
  FREQUENCY_MISMATCH: {
    key: 'FREQUENCY_MISMATCH',
    label: 'Frequency Mismatch',
    badgeClass: 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40',
    dotClass: 'bg-indigo-400',
    description: 'Source reporting frequency (e.g. quarterly) does not match required cadence (monthly/weekly).'
  },
  NOT_BENCHMARKABLE: {
    key: 'NOT_BENCHMARKABLE',
    label: 'Not Benchmarkable',
    badgeClass: 'bg-slate-900 text-slate-400 border-slate-700',
    dotClass: 'bg-slate-500',
    description: 'Commodity represents custom fabricated parts or non-tradable bespoke services.'
  },
  VALIDATION_PENDING: {
    key: 'VALIDATION_PENDING',
    label: 'Validation Pending',
    badgeClass: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40',
    dotClass: 'bg-cyan-400',
    description: 'Data quality and continuity rules are executing against staged records.'
  },
  APPROVED: {
    key: 'APPROVED',
    label: 'Admin Approved',
    badgeClass: 'bg-teal-950/70 text-teal-300 border-teal-500/40',
    dotClass: 'bg-teal-400',
    description: 'Formally approved by an Administrator and ready for dynamic catalog activation.'
  },
  REJECTED: {
    key: 'REJECTED',
    label: 'Rejected',
    badgeClass: 'bg-zinc-950/70 text-zinc-400 border-zinc-700',
    dotClass: 'bg-zinc-500',
    description: 'Candidate source failed governance standards and was explicitly rejected.'
  }
};

export function getStatusDesign(status: string): StatusDesignConfig {
  const normalized = status.toUpperCase().trim() as PCBIEnterpriseStatus;
  if (normalized in ENTERPRISE_STATUS_MAP) {
    return ENTERPRISE_STATUS_MAP[normalized];
  }
  return {
    key: 'NOT_BENCHMARKABLE',
    label: status.replace(/_/g, ' '),
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    dotClass: 'bg-slate-400',
    description: 'Status record'
  };
}
