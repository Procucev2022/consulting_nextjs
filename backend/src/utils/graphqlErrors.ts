import type { GraphQLError } from 'graphql';
import { API_ERROR_CATEGORY, API_ERROR_CODE, API_ERROR_MESSAGES } from '../constants/errors';
import type { GraphqlClientError } from '../types/graphql';
import { ClientFacingError, resolveApiErrorCategory } from './apiErrors';

/**
 * Converts GraphQL errors into the response shape. A ClientFacingError keeps its message and code. Any other
 * execution failure gets a fixed message that carries the request ID, so raw database or runtime text stays in the
 * logs. Validation errors from graphql-js have no original error, and their messages are written for the client.
 */
export const toGraphqlClientErrors = (errors: readonly GraphQLError[], requestId: string): GraphqlClientError[] =>
  errors.map((error): GraphqlClientError => {
    const { originalError, locations, path } = error;
    if (originalError === undefined) return { message: error.message, locations, path, extensions: error.extensions };
    if (originalError instanceof ClientFacingError) {
      return {
        message: originalError.message,
        locations,
        path,
        extensions: {
          code: originalError.errorCode, errorCategory: resolveApiErrorCategory(originalError.status), requestId
        }
      };
    }
    return {
      message: API_ERROR_MESSAGES.internalError(requestId),
      locations,
      path,
      extensions: { code: API_ERROR_CODE.INTERNAL_ERROR, errorCategory: API_ERROR_CATEGORY.SERVER, requestId }
    };
  });
