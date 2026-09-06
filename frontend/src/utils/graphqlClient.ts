/**
 * Unified GraphQL Client Utility (Frontend)
 * 
 * Provides type-safe execution of GraphQL queries and mutations against the backend,
 * structured logging, error handling, and batch fetching helpers.
 */

import frontendLogger from './logger';
import { GRAPHQL_ENDPOINT, DASHBOARD_OVERVIEW_QUERY } from '../constants/graphql';
import { GraphQLClientOptions, GraphQLResponse, DashboardOverviewData } from '../types/graphql';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

/**
 * Executes a GraphQL query or mutation against the backend endpoint.
 */
export async function executeGraphQL<T = any>(
  query: string,
  variables?: Record<string, any>,
  options?: GraphQLClientOptions
): Promise<T> {
  const endpoint = options?.endpoint || `${BACKEND_BASE}${GRAPHQL_ENDPOINT}`;
  const start = Date.now();

  frontendLogger.debug('Initiating GraphQL request', {
    endpoint,
    hasVariables: Boolean(variables)
  });

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const durationMs = Date.now() - start;

    if (!res.ok) {
      const errorMsg = `GraphQL HTTP error: ${res.status} ${res.statusText}`;
      frontendLogger.error(errorMsg, {
        status: res.status,
        statusText: res.statusText,
        durationMs
      });
      throw new Error(errorMsg);
    }

    const payload: GraphQLResponse<T> = await res.json();

    if (payload.errors && payload.errors.length > 0) {
      const errMessages = payload.errors.map((e) => e.message).join(', ');
      frontendLogger.warn('GraphQL execution responded with errors', {
        errors: payload.errors,
        durationMs
      });
      throw new Error(`GraphQL query execution failed: ${errMessages}`);
    }

    if (!payload.data) {
      frontendLogger.error('GraphQL response missing data field', { durationMs });
      throw new Error('GraphQL response contained no data');
    }

    frontendLogger.info('GraphQL query executed successfully', { durationMs });
    return payload.data;
  } catch (err: any) {
    const durationMs = Date.now() - start;
    frontendLogger.error('GraphQL request failed', { durationMs }, err);
    throw err;
  }
}

/**
 * Fetches full dashboard overview data in a single network round-trip via GraphQL.
 */
export async function fetchDashboardOverview(): Promise<DashboardOverviewData> {
  frontendLogger.info('Fetching aggregated dashboard overview via GraphQL');
  const result = await executeGraphQL<{ dashboardOverview: DashboardOverviewData }>(
    DASHBOARD_OVERVIEW_QUERY
  );
  return result.dashboardOverview;
}
