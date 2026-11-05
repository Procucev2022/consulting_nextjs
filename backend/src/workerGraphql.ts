import { buildSchema, graphql, type GraphQLSchema } from 'graphql';
import { GRAPHQL_ERRORS, GRAPHQL_LOG_MESSAGES, GRAPHQL_SCHEMA_SDL } from './constants/graphql';
import { D1_ROUTE_MESSAGES } from './constants/d1';
import type { CloudflareEnvironment } from './types/cloudflare';
import { createD1GraphqlResolvers } from './resolvers/d1GraphqlResolvers';
import logger from './utils/logger';
import { getTenantFromD1, requireD1Binding } from './workerD1';
import { jsonResponse, readJson, RequestBodyTooLargeError, RequestJsonParseError } from './workerHttp';

let cachedGraphqlSchema: GraphQLSchema | undefined;

const getGraphqlSchema = (): GraphQLSchema => {
  cachedGraphqlSchema ??= buildSchema(GRAPHQL_SCHEMA_SDL);
  return cachedGraphqlSchema;
};

export const handleGraphQLRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<Response> => {
  try {
    const database = environment.DB;
    if (!database) return jsonResponse({ errors: [{ message: GRAPHQL_ERRORS.MISSING_BINDING }] }, 503, request);
    requireD1Binding(database);
    let source = '';
    let variableValues: Record<string, unknown> | undefined;
    let operationName: string | undefined;

    if (request.method === 'POST') {
      const body = await readJson(request);
      source = String(body.query || '');
      variableValues = body.variables as Record<string, unknown> | undefined;
      operationName = body.operationName as string | undefined;
    } else if (request.method === 'GET') {
      source = url.searchParams.get('query') || '';
    }

    if (!source) return jsonResponse({ errors: [{ message: GRAPHQL_ERRORS.QUERY_REQUIRED }] }, 400, request);
    const tenant = await getTenantFromD1(database, environment.REQUEST_TENANT_ID);
    // The Worker entry point assigns a validated request ID before API dispatch.
    const requestId = request.headers.get('x-request-id') as string;
    const result = await graphql({
      schema: getGraphqlSchema(),
      source,
      rootValue: createD1GraphqlResolvers(),
      contextValue: {
        requestId,
        tenantId: tenant.tenant_id,
        userId: environment.REQUEST_USER_ID,
        role: environment.REQUEST_USER_ROLE,
        timestamp: new Date().toISOString(),
        db: database
      },
      variableValues,
      operationName
    });
    for (const graphQLError of result.errors || []) {
      const errorContext = {
        requestId,
        method: request.method,
        path: url.pathname,
        operationName,
        graphqlPath: graphQLError.path?.join('.'),
        graphqlMessage: graphQLError.message,
        graphqlCode: graphQLError.extensions.code,
        locations: graphQLError.locations
      };
      if (graphQLError.originalError) {
        logger.error(GRAPHQL_LOG_MESSAGES.executionFailed, errorContext, graphQLError.originalError);
      } else {
        logger.warn(GRAPHQL_LOG_MESSAGES.operationRejected, errorContext);
      }
    }
    return jsonResponse(result as Record<string, unknown>, 200, request);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const invalidJson = err instanceof RequestJsonParseError;
    const bodyTooLarge = err instanceof RequestBodyTooLargeError;
    const failureStatus = bodyTooLarge ? 413 : errorMsg.includes(D1_ROUTE_MESSAGES.missingBinding) ? 503 : 500;
    const context = {
      requestId: request.headers.get('x-request-id') || undefined,
      method: request.method,
      path: url.pathname,
      statusCode: invalidJson ? 400 : failureStatus
    };
    if (bodyTooLarge) logger.warn(GRAPHQL_LOG_MESSAGES.invalidJsonBody, { ...context, maxBytes: err.maxBytes }, err);
    else if (invalidJson) logger.warn(GRAPHQL_LOG_MESSAGES.invalidJsonBody, context, err.underlyingError);
    else logger.error(GRAPHQL_LOG_MESSAGES.requestFailed, context, err);
    if (invalidJson || bodyTooLarge) return jsonResponse({
      success: false,
      message: bodyTooLarge ? errorMsg : D1_ROUTE_MESSAGES.validationFailed,
      errors: [{ path: 'body', message: errorMsg }]
    }, bodyTooLarge ? 413 : 400, request);
    return jsonResponse({ errors: [{ message: errorMsg }] }, failureStatus, request);
  }
};
