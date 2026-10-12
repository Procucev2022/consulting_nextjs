import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { CustomerController } from '../../src/controllers/customer.controller';
import { assessmentStore } from '../../src/services/assessmentStore';

function createMockReqRes(body: Record<string, unknown> = {}, params: Record<string, string> = {}, query: Record<string, string> = {}) {
  const req = {
    body,
    params,
    query,
    headers: { 'x-request-id': 'req-test-123', 'x-user-email': 'admin@procucev.com', 'x-user-role': 'INTERNAL_ADMIN' }
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  } as unknown as Response;

  return { req, res };
}

describe('CustomerController', () => {
  let createdCustomerId: string;

  beforeEach(() => {
    assessmentStore.resetToDefaultSeed();
    const customer = assessmentStore.createCustomer({
      customerName: 'Enterprise Client Alpha',
      industry: 'Automotive'
    });
    createdCustomerId = customer.id || customer.customerId;
  });

  it('handles getCustomers with and without filter', () => {
    const { req, res } = createMockReqRes({}, {}, { status: 'ACTIVE' });
    CustomerController.getCustomers(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.any(Array)
      })
    );
  });

  it('handles getCustomerById when found', () => {
    const { req, res } = createMockReqRes({}, { id: createdCustomerId });
    CustomerController.getCustomerById(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          customer: expect.objectContaining({ customerName: 'Enterprise Client Alpha' })
        })
      })
    );
  });

  it('handles getCustomerById when not found', () => {
    const { req, res } = createMockReqRes({}, { id: 'CUST-NON-EXISTENT' });
    CustomerController.getCustomerById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('handles createCustomer successfully and validation failure', () => {
    const { req, res } = createMockReqRes({
      customerName: 'Enterprise Client Beta',
      industry: 'Cement & Building Materials'
    });
    CustomerController.createCustomer(req, res);
    expect(res.status).toHaveBeenCalledWith(201);

    const { req: badReq, res: badRes } = createMockReqRes({});
    CustomerController.createCustomer(badReq, badRes);
    expect(badRes.status).toHaveBeenCalledWith(400);
  });

  it('handles updateCustomer successfully, validation failure, and 404', () => {
    const { req, res } = createMockReqRes({ notes: 'Updated notes' }, { id: createdCustomerId });
    CustomerController.updateCustomer(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: createdCustomerId })
      })
    );

    const { req: badReq, res: badRes } = createMockReqRes({ status: 'INVALID_STATUS' }, { id: createdCustomerId });
    CustomerController.updateCustomer(badReq, badRes);
    expect(badRes.status).toHaveBeenCalledWith(400);

    const { req: notFoundReq, res: notFoundRes } = createMockReqRes({ notes: 'Updated' }, { id: 'CUST-404' });
    CustomerController.updateCustomer(notFoundReq, notFoundRes);
    expect(notFoundRes.status).toHaveBeenCalledWith(404);
  });
});
