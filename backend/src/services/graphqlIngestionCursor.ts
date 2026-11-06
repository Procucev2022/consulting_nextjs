import { GRAPHQL_ERRORS } from '../constants/graphql';
import { D1_GRAPHQL_BASE64_BLOCK_LENGTH, D1_GRAPHQL_BASE64_PADDING } from '../constants/d1';
import { graphqlIngestionCursorSchema } from '../constants/validation';
import type { GraphQLIngestionCursor } from '../types/graphql';

export const encodeGraphQLIngestionCursor = (cursor: GraphQLIngestionCursor): string => {
  const payload = graphqlIngestionCursorSchema.parse(cursor);
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
};

export const decodeGraphQLIngestionCursor = (value: string): GraphQLIngestionCursor => {
  try {
    const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    const paddedLength = Math.ceil(base64.length / D1_GRAPHQL_BASE64_BLOCK_LENGTH) * D1_GRAPHQL_BASE64_BLOCK_LENGTH;
    const padded = base64.padEnd(paddedLength, D1_GRAPHQL_BASE64_PADDING);
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const parsed = graphqlIngestionCursorSchema.safeParse(payload);
    if (!parsed.success) throw new Error(GRAPHQL_ERRORS.INVALID_INGESTION_CURSOR);
    return parsed.data;
  } catch {
    throw new Error(GRAPHQL_ERRORS.INVALID_INGESTION_CURSOR);
  }
};
