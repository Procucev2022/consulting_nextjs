import { describe, expect, it } from 'vitest';
import { GRAPHQL_ERRORS } from '../../src/constants/graphql';
import { D1_GRAPHQL_CURSOR_VERSION } from '../../src/constants/d1';
import { decodeGraphQLIngestionCursor, encodeGraphQLIngestionCursor } from '../../src/services/graphqlIngestionCursor';
import type { GraphQLIngestionCursor } from '../../src/types/graphql';

const cursor: GraphQLIngestionCursor = {
  version: D1_GRAPHQL_CURSOR_VERSION,
  kind: 'ingestionQueue',
  tenantId: 'TNT-1',
  timestamp: '2026-03-01T00:00:00.000Z',
  id: 'DOC-采购-1'
};

describe('GraphQL keyset cursors', () => {
  it('round-trips UTF-8 cursor values using URL-safe base64', () => {
    const encoded = encodeGraphQLIngestionCursor(cursor);

    expect(encoded).not.toMatch(/[+/=]/u);
    expect(decodeGraphQLIngestionCursor(encoded)).toEqual(cursor);
  });

  it('rejects malformed base64 and invalid cursor payloads with the same public error', () => {
    expect(() => decodeGraphQLIngestionCursor('%%%')).toThrow(GRAPHQL_ERRORS.INVALID_INGESTION_CURSOR);
    const invalidPayload = btoa(JSON.stringify({ ...cursor, id: 'DOC-1', version: D1_GRAPHQL_CURSOR_VERSION + 1 }));
    expect(() => decodeGraphQLIngestionCursor(invalidPayload)).toThrow(GRAPHQL_ERRORS.INVALID_INGESTION_CURSOR);
  });

  it('validates cursor payloads before encoding', () => {
    expect(() => encodeGraphQLIngestionCursor({ ...cursor, id: '' })).toThrow();
  });
});
