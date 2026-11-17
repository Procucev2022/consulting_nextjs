import { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';
import { API_ERROR_CATEGORY, API_ERROR_CODE, API_ERROR_MESSAGES, API_HTTP_STATUS } from '../../src/constants/errors';
import { ClientFacingError } from '../../src/utils/apiErrors';
import { toGraphqlClientErrors } from '../../src/utils/graphqlErrors';

describe('toGraphqlClientErrors', () => {
  it('keeps validation messages, which graphql-js writes for the client', () => {
    const validation = new GraphQLError('Cannot query field "noSuchField" on type "Query".');

    expect(toGraphqlClientErrors([validation], 'req-g1')).toEqual([expect.objectContaining({
      message: 'Cannot query field "noSuchField" on type "Query".'
    })]);
  });

  it('keeps a curated message and reports its code and category', () => {
    const curated = new GraphQLError('GraphQL request failed', {
      originalError: new ClientFacingError(API_HTTP_STATUS.FORBIDDEN, API_ERROR_CODE.ADMIN_REQUIRED,
        'Only administrators can update tenants.'),
      path: ['updateTenant']
    });

    expect(toGraphqlClientErrors([curated], 'req-g2')).toEqual([{
      message: 'Only administrators can update tenants.',
      locations: undefined,
      path: ['updateTenant'],
      extensions: { code: API_ERROR_CODE.ADMIN_REQUIRED, errorCategory: API_ERROR_CATEGORY.AUTH, requestId: 'req-g2' }
    }]);
  });

  it('replaces unexpected failures with the fixed server message, and keeps the raw text out of the response', () => {
    const failure = new GraphQLError('SQLITE_ERROR: no such table: TenantMaster', {
      originalError: new Error('SQLITE_ERROR: no such table: TenantMaster'),
      path: ['tenant']
    });

    const [clientError] = toGraphqlClientErrors([failure], 'req-g3');

    expect(clientError).toEqual({
      message: API_ERROR_MESSAGES.internalError('req-g3'),
      locations: undefined,
      path: ['tenant'],
      extensions: { code: API_ERROR_CODE.INTERNAL_ERROR, errorCategory: API_ERROR_CATEGORY.SERVER, requestId: 'req-g3' }
    });
    expect(JSON.stringify(clientError)).not.toContain('SQLITE_ERROR');
  });
});
