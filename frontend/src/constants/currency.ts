/** Currency display options. Conversion rates are read from D1 at runtime. */
import type { HeaderCurrency } from '../types';

export const DEFAULT_BASE_CURRENCY = 'INR';
export const INR_CRORES_DIVISOR = 10_000_000;
export const SUPPORTED_HEADER_CURRENCIES: readonly HeaderCurrency[] = ['INR', 'USD', 'EUR', 'GBP'] as const;
