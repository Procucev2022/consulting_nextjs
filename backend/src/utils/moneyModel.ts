/**
 * Unit-Safe Canonical Money Model & Scale-Error Defense (Prompt 256)
 */

export interface CanonicalMoney {
  amountInrAbsolute: number;
  currency: 'INR';
  displayUnit?: 'INR' | 'LAKH' | 'CRORE';
}

export const LAKH_MULTIPLIER = 100000; // 10^5
export const CRORE_MULTIPLIER = 10000000; // 10^7

export function inrToLakh(amountInr: number): number {
  return Number((amountInr / LAKH_MULTIPLIER).toFixed(4));
}

export function lakhToInr(lakh: number): number {
  return Number((lakh * LAKH_MULTIPLIER).toFixed(2));
}

export function inrToCrore(amountInr: number): number {
  return Number((amountInr / CRORE_MULTIPLIER).toFixed(4));
}

export function croreToInr(crore: number): number {
  return Number((crore * CRORE_MULTIPLIER).toFixed(2));
}

/**
 * Formats absolute numeric INR according to Indian number grouping system:
 * e.g., 2437500000 -> "₹2,43,75,00,000.00"
 */
export function formatINR(amountInr: number, includeDecimals: boolean = true): string {
  const isNegative = amountInr < 0;
  const absVal = Math.abs(amountInr);
  const fixed = absVal.toFixed(2);
  const parts = fixed.split('.');
  const intPart = parts[0];
  const decPart = parts[1];

  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const sign = isNegative ? '-' : '';
  if (includeDecimals) {
    return `${sign}₹${formattedInt}.${decPart}`;
  }
  return `${sign}₹${formattedInt}`;
}

export function formatINRLakh(amountInr: number, decimals: number = 2): string {
  const lakhVal = amountInr / LAKH_MULTIPLIER;
  return `₹${lakhVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} Lakh`;
}

export function formatINRCrore(amountInr: number, decimals: number = 2): string {
  const croreVal = amountInr / CRORE_MULTIPLIER;
  return `₹${croreVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} Cr`;
}

/**
 * Scale-Error Defense: Detects 10x, 100x, 1000x, 0.1x, 0.01x, 0.001x scaling mistakes
 */
export function detectScaleError(
  actual: number,
  expected: number
): { hasScaleError: boolean; ratio?: number; description?: string } {
  if (actual === expected) {
    return { hasScaleError: false };
  }
  if (expected === 0 || actual === 0) {
    return { hasScaleError: false };
  }

  const ratio = actual / expected;
  const knownScaleFactors = [10, 100, 1000, 0.1, 0.01, 0.001];

  for (const factor of knownScaleFactors) {
    if (Math.abs(ratio - factor) < 0.0001) {
      return {
        hasScaleError: true,
        ratio,
        description: `CRITICAL SCALE ERROR DETECTED: Ratio is exactly ${factor}x scaling discrepancy!`
      };
    }
  }

  return { hasScaleError: false, ratio };
}

/**
 * Strict Numeric Raw INR Equality Verification
 */
export function verifyRawInrEquality(
  lhsRawInr: number,
  rhsRawInr: number,
  tolerance: number = 0.001
): { isMatch: boolean; variance: number } {
  const variance = Math.abs(lhsRawInr - rhsRawInr);
  return {
    isMatch: variance <= tolerance,
    variance: Number(variance.toFixed(4))
  };
}
