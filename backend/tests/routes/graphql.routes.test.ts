import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import * as graphqlModule from 'graphql';

describe('GraphQL Routes (/api/graphql)', () => {
  describe('POST /api/graphql', () => {
    it('should successfully execute a valid GraphQL query', async () => {
      const res = await request(app)
        .post('/api/graphql')
        .set('x-request-id', 'test-gql-req')
        .send({
          query: `
            query GetTenantInfo {
              tenant {
                tenant_id
                enterprise_name
                base_currency
              }
            }
          `
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.tenant).toBeDefined();
      expect(res.body.data.tenant.enterprise_name).toBeDefined();
    });

    it('should execute dashboardOverview aggregated batch query in a single trip', async () => {
      const res = await request(app)
        .post('/api/graphql')
        .send({
          query: `
            query DashboardBatch {
              dashboardOverview {
                tenant {
                  enterprise_name
                }
                categories {
                  id
                  name
                }
                queryMetrics {
                  totalQueries
                }
              }
            }
          `
        });

      expect(res.status).toBe(200);
      expect(res.body.data.dashboardOverview).toBeDefined();
      expect(res.body.data.dashboardOverview.tenant).toBeDefined();
      expect(Array.isArray(res.body.data.dashboardOverview.categories)).toBe(true);
    });

    it('should execute GraphQL mutation successfully', async () => {
      const res = await request(app)
        .post('/api/graphql')
        .send({
          query: `
            mutation UpdateEnterprise($input: UpdateTenantInput!) {
              updateTenant(input: $input) {
                enterprise_name
              }
            }
          `,
          variables: {
            input: { enterprise_name: 'Super Global Inc.' }
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.data.updateTenant.enterprise_name).toBe('Super Global Inc.');
    });

    it('should return errors for invalid GraphQL query syntax', async () => {
      const res = await request(app)
        .post('/api/graphql')
        .send({
          query: 'query { invalidFieldDoesNotExist }'
        });

      expect(res.status).toBe(200);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should fail with HTTP 400 when query body is missing', async () => {
      const res = await request(app)
        .post('/api/graphql')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should handle unhandled internal errors with HTTP 500', async () => {
      const graphqlSpy = vi.spyOn(graphqlModule, 'graphql').mockRejectedValueOnce(new Error('Simulated failure'));

      const res = await request(app)
        .post('/api/graphql')
        .send({
          query: 'query { tenant { enterprise_name } }'
        });

      expect(res.status).toBe(500);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Simulated failure');

      graphqlSpy.mockRestore();
    });

    it('should handle unhandled internal errors without message with HTTP 500 fallback', async () => {
      const graphqlSpy = vi.spyOn(graphqlModule, 'graphql').mockRejectedValueOnce({});

      const res = await request(app)
        .post('/api/graphql')
        .send({
          query: 'query { tenant { enterprise_name } }'
        });

      expect(res.status).toBe(500);
      expect(res.body.errors[0].message).toBe('Internal GraphQL execution error');

      graphqlSpy.mockRestore();
    });

    it('should handle request without x-request-id header', async () => {
      const res = await request(app)
        .post('/api/graphql')
        .send({
          query: 'query { tenant { enterprise_name } }'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.tenant).toBeDefined();
    });
  });

  describe('GET /api/graphql', () => {
    it('should successfully execute query provided via query parameter with x-request-id', async () => {
      const res = await request(app)
        .get('/api/graphql')
        .set('x-request-id', 'test-get-req-id')
        .query({ query: '{ tenant { enterprise_name } }' });

      expect(res.status).toBe(200);
      expect(res.body.data.tenant).toBeDefined();
    });

    it('should successfully execute query provided via query parameter without x-request-id', async () => {
      const res = await request(app)
        .get('/api/graphql')
        .query({ query: '{ tenant { enterprise_name } }' });

      expect(res.status).toBe(200);
      expect(res.body.data.tenant).toBeDefined();
    });

    it('should return HTTP 400 when query parameter is missing', async () => {
      const res = await request(app).get('/api/graphql');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should handle unhandled internal error on GET with HTTP 500', async () => {
      const graphqlSpy = vi.spyOn(graphqlModule, 'graphql').mockRejectedValueOnce(new Error('GET failure'));

      const res = await request(app)
        .get('/api/graphql')
        .query({ query: '{ tenant { enterprise_name } }' });

      expect(res.status).toBe(500);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('GET failure');

      graphqlSpy.mockRestore();
    });

    it('should handle unhandled internal error on GET without message with HTTP 500 fallback', async () => {
      const graphqlSpy = vi.spyOn(graphqlModule, 'graphql').mockRejectedValueOnce({});

      const res = await request(app)
        .get('/api/graphql')
        .query({ query: '{ tenant { enterprise_name } }' });

      expect(res.status).toBe(500);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Internal GraphQL execution error');

      graphqlSpy.mockRestore();
    });
  });
});
