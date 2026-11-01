/**
 * Currency Types and Interfaces Module (Frontend)
 */

export type SupportedCurrency = string;
export type HeaderCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface ParsedDateInfo {
  year?: number;
  monthKey?: string;
  formattedDate?: string;
}
