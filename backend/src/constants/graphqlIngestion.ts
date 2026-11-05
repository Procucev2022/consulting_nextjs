export const GRAPHQL_INGESTION_TYPES_SDL = `
  type GraphQLPageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type IngestionQueuePage {
    items: [RawDocumentIngestion!]!
    pageInfo: GraphQLPageInfo!
  }

  type ValidationRecordsPage {
    items: [ValidationPreCheckRecord!]!
    pageInfo: GraphQLPageInfo!
  }
`;
