/**
 * Subscription Data Store & Audit Log (Prompt 288)
 */

import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATES,
  COMMERCIAL_STATUS
} from '../constants/subscription';
import type { SubscriptionRecord, SubscriptionAuditEvent } from '../types/subscription';
import logger from '../utils/logger';

export class SubscriptionStore {
  private subscriptions: Map<string, SubscriptionRecord> = new Map();
  private auditEvents: SubscriptionAuditEvent[] = [];

  constructor() {
    this.seedDefaultSubscriptions();
  }

  public seedDefaultSubscriptions(): void {
    const defaultSub: SubscriptionRecord = {
      id: 'sub-default-tnt-global',
      tenant_id: 'TNT-GLOBAL-8902',
      customer_id: 'usr-default-buyer',
      customer_email: 'buyer@enterprise.com',
      customer_name: 'Procurement Director',
      company_name: 'Enterprise Client',
      tier: SUBSCRIPTION_TIERS.GOLD,
      status: SUBSCRIPTION_STATES.ACTIVE,
      commercial_status: COMMERCIAL_STATUS.COMPLETED,
      payment_confirmed: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.subscriptions.set(defaultSub.id, defaultSub);

    const bronzeSub: SubscriptionRecord = {
      id: 'sub-bronze-demo',
      tenant_id: 'TNT-BRONZE-CLIENT',
      customer_id: 'usr-bronze-buyer',
      customer_email: 'bronze@enterprise.com',
      customer_name: 'Bronze User',
      company_name: 'Bronze Discovery Client',
      tier: SUBSCRIPTION_TIERS.BRONZE,
      status: SUBSCRIPTION_STATES.FREE,
      commercial_status: COMMERCIAL_STATUS.FREE_TIER,
      payment_confirmed: false,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.subscriptions.set(bronzeSub.id, bronzeSub);

    const silverSub: SubscriptionRecord = {
      id: 'sub-silver-demo',
      tenant_id: 'TNT-SILVER-CLIENT',
      customer_id: 'usr-silver-buyer',
      customer_email: 'silver@enterprise.com',
      customer_name: 'Silver User',
      company_name: 'Silver Assess Client',
      tier: SUBSCRIPTION_TIERS.SILVER,
      status: SUBSCRIPTION_STATES.ACTIVE,
      commercial_status: COMMERCIAL_STATUS.COMPLETED,
      payment_confirmed: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.subscriptions.set(silverSub.id, silverSub);

    const suspendedSub: SubscriptionRecord = {
      id: 'sub-suspended-demo',
      tenant_id: 'TNT-SUSPENDED-CLIENT',
      customer_id: 'usr-suspended-buyer',
      customer_email: 'suspended@enterprise.com',
      customer_name: 'Suspended User',
      company_name: 'Suspended Client',
      tier: SUBSCRIPTION_TIERS.GOLD,
      status: SUBSCRIPTION_STATES.SUSPENDED,
      commercial_status: COMMERCIAL_STATUS.COMPLETED,
      payment_confirmed: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.subscriptions.set(suspendedSub.id, suspendedSub);

    const expiredSub: SubscriptionRecord = {
      id: 'sub-expired-demo',
      tenant_id: 'TNT-EXPIRED-CLIENT',
      customer_id: 'usr-expired-buyer',
      customer_email: 'expired@enterprise.com',
      customer_name: 'Expired User',
      company_name: 'Expired Client',
      tier: SUBSCRIPTION_TIERS.GOLD,
      status: SUBSCRIPTION_STATES.EXPIRED,
      commercial_status: COMMERCIAL_STATUS.COMPLETED,
      payment_confirmed: true,
      start_date: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.subscriptions.set(expiredSub.id, expiredSub);

    const pendingSub: SubscriptionRecord = {
      id: 'sub-pending-demo',
      tenant_id: 'TNT-PENDING-CLIENT',
      customer_id: 'usr-pending-buyer',
      customer_email: 'pending@enterprise.com',
      customer_name: 'Pending User',
      company_name: 'Pending Activation Client',
      tier: SUBSCRIPTION_TIERS.GOLD,
      status: SUBSCRIPTION_STATES.PENDING_ACTIVATION,
      commercial_status: COMMERCIAL_STATUS.PAYMENT_RECEIVED,
      payment_confirmed: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.subscriptions.set(pendingSub.id, pendingSub);
  }

  public logAudit(
    action: SubscriptionAuditEvent['action'],
    subscriptionId: string,
    tenantId: string,
    actor: string,
    actorRole: string,
    result: 'SUCCESS' | 'FAILURE',
    details?: Record<string, unknown>
  ): SubscriptionAuditEvent {
    const event: SubscriptionAuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      subscription_id: subscriptionId,
      tenant_id: tenantId,
      action,
      actor,
      actor_role: actorRole,
      result,
      details
    };
    this.auditEvents.unshift(event);
    logger.info(`Subscription audit: [${action}] by ${actor} (${actorRole}) - ${result}`, {
      subscriptionId,
      tenantId
    });
    return event;
  }

  public getAuditEvents(subscriptionId?: string): SubscriptionAuditEvent[] {
    if (subscriptionId) {
      return this.auditEvents.filter((e) => e.subscription_id === subscriptionId);
    }
    return [...this.auditEvents];
  }

  public getAuditTrail(subscriptionId?: string): SubscriptionAuditEvent[] {
    return this.getAuditEvents(subscriptionId);
  }

  public addAuditEvent(event: SubscriptionAuditEvent): void {
    this.auditEvents.unshift(event);
  }

  public getAllSubscriptions(): SubscriptionRecord[] {
    return Array.from(this.subscriptions.values());
  }

  public listSubscriptions(): SubscriptionRecord[] {
    return this.getAllSubscriptions();
  }

  public getSubscriptionById(id: string): SubscriptionRecord | null {
    return this.subscriptions.get(id) || null;
  }

  public setSubscription(id: string, record: SubscriptionRecord): void {
    this.subscriptions.set(id, record);
  }

  public getSubscriptionByTenantId(tenantId: string): SubscriptionRecord {
    const found = Array.from(this.subscriptions.values()).find((s) => s.tenant_id === tenantId);
    if (found) return found;

    return {
      id: `sub-auto-${tenantId}`,
      tenant_id: tenantId,
      customer_id: `usr-${tenantId}`,
      customer_email: `admin@${tenantId.toLowerCase()}.com`,
      customer_name: 'Procurement Lead',
      company_name: 'Registered Enterprise',
      tier: SUBSCRIPTION_TIERS.BRONZE,
      status: SUBSCRIPTION_STATES.FREE,
      commercial_status: COMMERCIAL_STATUS.FREE_TIER,
      payment_confirmed: false,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  public reset(): void {
    this.subscriptions.clear();
    this.auditEvents = [];
    this.seedDefaultSubscriptions();
  }
}

export const subscriptionStore = new SubscriptionStore();
