import { describe, it, expect } from 'vitest';
import {
  GRAPHQL_ENDPOINT,
  DASHBOARD_OVERVIEW_QUERY,
  GET_TENANT_QUERY,
  UPDATE_TENANT_MUTATION,
  GET_QUERY_METRICS_QUERY
} from '../../src/constants/graphql';
import * as ConstantsIndex from '../../src/constants/index';

describe('Frontend GraphQL Constants', () => {
  it('should define endpoint and queries', () => {
    expect(GRAPHQL_ENDPOINT).toBe('/api/graphql');
    expect(DASHBOARD_OVERVIEW_QUERY).toContain('dashboardOverview');
    expect(DASHBOARD_OVERVIEW_QUERY).toContain('tenant');
    expect(DASHBOARD_OVERVIEW_QUERY).toContain('categories');
    expect(DASHBOARD_OVERVIEW_QUERY).toContain('opportunities');
    expect(DASHBOARD_OVERVIEW_QUERY).toContain('funnelStages');

    expect(GET_TENANT_QUERY).toContain('tenant');
    expect(UPDATE_TENANT_MUTATION).toContain('updateTenant');
    expect(GET_QUERY_METRICS_QUERY).toContain('queryMetrics');
  });

  it('should re-export via unified barrel', () => {
    expect(ConstantsIndex.GRAPHQL_ENDPOINT).toBe(GRAPHQL_ENDPOINT);
    expect(ConstantsIndex.DASHBOARD_OVERVIEW_QUERY).toBe(DASHBOARD_OVERVIEW_QUERY);
    expect(ConstantsIndex.GET_TENANT_QUERY).toBe(GET_TENANT_QUERY);
    expect(ConstantsIndex.UPDATE_TENANT_MUTATION).toBe(UPDATE_TENANT_MUTATION);
    expect(ConstantsIndex.GET_QUERY_METRICS_QUERY).toBe(GET_QUERY_METRICS_QUERY);
  });
});
