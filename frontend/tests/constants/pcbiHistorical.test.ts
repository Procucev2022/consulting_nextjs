import { describe, expect, it } from 'vitest';
import {
  PCBI_HISTORICAL_DISPLAY_DECIMAL_PLACES,
  PCBI_HISTORICAL_DISPLAY_LOCALE,
  PCBI_HISTORICAL_OBSERVATIONS_ENDPOINT,
  PCBI_HISTORICAL_QUERY_DEFAULT_LIMIT,
  PCBI_HISTORICAL_QUERY_MAX_LIMIT
} from '../../src/constants/pcbiHistorical';

describe('PCBI historical observation constants', () => {
  it('defines a bounded endpoint and stable display defaults', () => {
    expect(PCBI_HISTORICAL_OBSERVATIONS_ENDPOINT).toBe('/api/pcbi/historical-observations');
    expect(PCBI_HISTORICAL_QUERY_DEFAULT_LIMIT).toBe(100);
    expect(PCBI_HISTORICAL_QUERY_MAX_LIMIT).toBe(500);
    expect(PCBI_HISTORICAL_DISPLAY_LOCALE).toBe('en-IN');
    expect(PCBI_HISTORICAL_DISPLAY_DECIMAL_PLACES).toBe(2);
  });
});
