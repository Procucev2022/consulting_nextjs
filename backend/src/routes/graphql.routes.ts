/**
 * GraphQL API Routes (Backend)
 * 
 * Provides unified endpoint `/api/graphql` executing GraphQL queries and mutations
 * through the `graphql` execution engine with audit tracking and structured logging.
 */

import { Router, Request, Response } from 'express';
import { buildSchema, graphql } from 'graphql';
import { GRAPHQL_SCHEMA_SDL } from '../constants/graphql';
import { graphQLRequestSchema } from '../constants/validation';
import { validateBody } from '../utils/validation';
import { rootResolvers } from '../resolvers/graphqlResolvers';
import logger from '../utils/logger';

const router = Router();
export const schema = buildSchema(GRAPHQL_SCHEMA_SDL);

router.post('/', validateBody(graphQLRequestSchema), async (req: Request, res: Response) => {
  const start = Date.now();
  const { query, variables, operationName } = req.body;
  const requestId = String(req.headers['x-request-id']);

  try {
    const result = await graphql({
      schema,
      source: query,
      rootValue: rootResolvers,
      contextValue: {
        requestId,
        tenantId: 'tenant_default',
        timestamp: new Date().toISOString()
      },
      variableValues: variables,
      operationName
    });

    const durationMs = Date.now() - start;

    if (result.errors && result.errors.length > 0) {
      logger.warn('GraphQL query completed with execution errors', {
        requestId,
        operationName,
        durationMs,
        errors: result.errors.map((e) => e.message)
      });
    } else {
      logger.info('GraphQL query executed successfully', {
        requestId,
        operationName,
        durationMs
      });
    }

    return res.status(200).json(result);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    logger.error('Unhandled error during GraphQL query execution', {
      requestId,
      operationName,
      durationMs
    }, err);
    return res.status(500).json({
      errors: [{ message: err.message || 'Internal GraphQL execution error' }]
    });
  }
});

router.get('/', async (req: Request, res: Response) => {
  const query = req.query.query as string;
  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter "query" is required for GET requests'
    });
  }
  const requestId = String(req.headers['x-request-id']);
  const start = Date.now();
  try {
    const result = await graphql({
      schema,
      source: query,
      rootValue: rootResolvers,
      contextValue: {
        requestId,
        tenantId: 'tenant_default',
        timestamp: new Date().toISOString()
      }
    });
    const durationMs = Date.now() - start;
    logger.info('GraphQL GET query executed', { requestId, durationMs });
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      errors: [{ message: err.message || 'Internal GraphQL execution error' }]
    });
  }
});

export default router;
