/**
 * Frontend GraphQL Constants & Document Queries
 * 
 * Centralized GraphQL queries and mutations for streamlined, single-trip data fetching.
 */

export const GRAPHQL_ENDPOINT = '/api/graphql';

export const DASHBOARD_OVERVIEW_QUERY = `
  query DashboardOverview {
    dashboardOverview {
      tenant {
        tenant_id
        enterprise_name
        region
        base_currency
        status
        total_spend_evaluated
        total_spend_evaluated_inr
      }
      categories {
        id
        name
        spend
        spend_inr
        spend_inr_crores
        targetReductionPct
        lineItemsCount
        color
      }
      opportunities {
        opp_id
        category
        title
        current_spend
        target_savings_pct
        est_savings
        recommended_action
        push_to_module
        status
        risk_level
      }
      funnelStages {
        phase_num
        phase_name
        platform_actionable_focus
        value_outcome_delivered
        commercial_lock_in_metric
        completion_pct
        status
      }
      ingestionQueue {
        doc_id
        file_name
        file_type
        file_size_mb
        ocr_status
        progress
        records_count
      }
      validationRecords {
        record_id
        po_number
        vendor_name
        amount
        issue_flag
        action_status
        resolved
      }
      queryMetrics {
        totalQueries
        slowQueries
        cacheHitRatio
        averageDurationMs
      }
    }
  }
`;

export const GET_TENANT_QUERY = `
  query GetTenant {
    tenant {
      tenant_id
      enterprise_name
      region
      base_currency
      status
      total_spend_evaluated
      total_spend_evaluated_inr
    }
  }
`;

export const UPDATE_TENANT_MUTATION = `
  mutation UpdateTenant($input: UpdateTenantInput!) {
    updateTenant(input: $input) {
      tenant_id
      enterprise_name
      region
      base_currency
      status
      total_spend_evaluated
      total_spend_evaluated_inr
    }
  }
`;

export const GET_QUERY_METRICS_QUERY = `
  query GetQueryMetrics {
    queryMetrics {
      totalQueries
      slowQueries
      cacheHitRatio
      averageDurationMs
      recentAudits {
        queryId
        operation
        model
        durationMs
        cached
        timestamp
      }
    }
  }
`;
