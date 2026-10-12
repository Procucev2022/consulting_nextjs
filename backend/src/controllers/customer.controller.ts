import type { Request, Response } from 'express';
import { assessmentStore } from '../services/assessmentStore';
import { createCustomerSchema, updateCustomerSchema } from '../constants/assessmentValidation';

export class CustomerController {
  public static getCustomers(req: Request, res: Response): void {
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;
    const customers = assessmentStore.getCustomers(statusFilter);
    res.json({ success: true, data: customers, count: customers.length });
  }

  public static getCustomerById(req: Request, res: Response): void {
    const { id } = req.params;
    const customer = assessmentStore.getCustomerById(id);
    if (!customer) {
      res.status(404).json({ success: false, message: `Customer ${id} not found` });
      return;
    }
    const customerAssessments = assessmentStore.getAssessments().filter(
      (a) => a.customerId === id || a.customerName.toLowerCase() === customer.customerName.toLowerCase()
    );
    const customerWithId = {
      ...customer,
      id: customer.id || customer.customerId
    };
    res.json({
      success: true,
      data: {
        customer: customerWithId,
        assessments: customerAssessments,
        ...customerWithId
      }
    });
  }

  public static createCustomer(req: Request, res: Response): void {
    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.format() });
      return;
    }

    const actorEmail = (req.headers['x-user-email'] as string) || 'admin@procucev.com';
    const record = assessmentStore.createCustomer(parsed.data, actorEmail);
    res.status(201).json({ success: true, data: record });
  }

  public static updateCustomer(req: Request, res: Response): void {
    const { id } = req.params;
    const parsed = updateCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.format() });
      return;
    }

    const record = assessmentStore.updateCustomer(id, parsed.data);
    if (!record) {
      res.status(404).json({ success: false, message: `Customer ${id} not found` });
      return;
    }
    res.json({ success: true, data: record });
  }
}
