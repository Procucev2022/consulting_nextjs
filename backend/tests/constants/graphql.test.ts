import { describe, it, expect } from 'vitest';
import { GRAPHQL_SCHEMA_SDL, GRAPHQL_ERRORS } from '../../src/constants/graphql';
import * as ConstantsIndex from '../../src/constants/index';
import { buildSchema } from 'graphql';

describe('GraphQL Constants', () => {
  it('should define a valid, parsable GraphQL schema SDL', () => {
    expect(GRAPHQL_SCHEMA_SDL).toBeDefined();
    expect(typeof GRAPHQL_SCHEMA_SDL).toBe('string');
    
    // Validate that the SDL can be parsed into a GraphQL schema
    const schema = buildSchema(GRAPHQL_SCHEMA_SDL);
    expect(schema).toBeDefined();
    expect(schema.getQueryType()?.name).toBe('Query');
    expect(schema.getMutationType()?.name).toBe('Mutation');
    
    // Verify essential queries exist
    const queryFields = schema.getQueryType()?.getFields();
    expect(queryFields?.tenant).toBeDefined();
    expect(queryFields?.categories).toBeDefined();
    expect(queryFields?.dashboardOverview).toBeDefined();
    expect(queryFields?.queryMetrics).toBeDefined();

    // Verify essential mutations exist
    const mutationFields = schema.getMutationType()?.getFields();
    expect(mutationFields?.updateTenant).toBeDefined();
    expect(mutationFields?.addIngestionItem).toBeDefined();
    expect(mutationFields?.mergeVendor).toBeDefined();
  });

  it('should define structured error constants', () => {
    expect(GRAPHQL_ERRORS.INVALID_QUERY).toBe('Invalid GraphQL query string provided');
    expect(GRAPHQL_ERRORS.EXECUTION_FAILED).toBe('GraphQL execution encountered errors');
    expect(GRAPHQL_ERRORS.MISSING_OPERATION).toBe('GraphQL request requires query or mutation string');
  });

  it('should re-export via unified barrel', () => {
    expect(ConstantsIndex.GRAPHQL_SCHEMA_SDL).toBe(GRAPHQL_SCHEMA_SDL);
    expect(ConstantsIndex.GRAPHQL_ERRORS).toEqual(GRAPHQL_ERRORS);
  });
});
