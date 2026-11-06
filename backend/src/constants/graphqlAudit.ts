export const GRAPHQL_AUDIT_TYPES_SDL = `
  type QueryAuditItem {
    queryId: String!
    requestId: String!
    operation: String!
    model: String!
    durationMs: Float!
    wallDurationMs: Float!
    durationSource: String!
    cached: Boolean!
    batchDurationMs: Float
    batchSize: Int
    batchStatementIndex: Int
    timestamp: String!
    rowCount: Int
  }
`;
