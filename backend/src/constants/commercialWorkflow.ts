export const COMMERCIAL_WORKFLOW = {
  otpDigits: 6,
  otpTtlSeconds: 300,
  otpMaxAttempts: 5,
  upgradeCodeTtlSeconds: 86400,
  subscriptionTermDays: 365,
  millisecondsPerDay: 86400000,
  developmentModes: ['DEV', 'DEVELOPMENT', 'TEST', 'INTERNAL_ASSESSMENT'],
  productionMode: 'PRODUCTION',
  maxRequestNoteLength: 2000,
  upgradeStatus: {
    PENDING: 'PENDING_ADMIN_ACTION',
    CODE_SENT: 'OTP_VERIFIED_CODE_SENT',
    COMPLETED: 'UPGRADE_COMPLETED',
    REJECTED: 'REJECTED'
  },
  upgradeMessages: {
    activeTenantRequired: 'Upgrade codes can only be redeemed by an active customer assigned to an active organization.',
    atomicBatchUnavailable: 'Upgrade redemption is temporarily unavailable because atomic database writes are unsupported.',
    concurrentChange: 'The upgrade code expired or the account changed before redemption. Ask an administrator to review the request.',
    atomicInvariantFailed: 'The upgrade could not be completed consistently. Contact an administrator with the request reference.'
  },
  upgradeRedemption: {
    REDEEMED: 'REDEEMED',
    CONFLICT: 'CONFLICT',
    UNAVAILABLE: 'UNAVAILABLE',
    INVARIANT_FAILURE: 'INVARIANT_FAILURE'
  },
  subscriptionStatus: {
    PENDING: 'PENDING_ACTIVATION',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED'
  },
  commercialStatus: {
    RECEIVED: 'PAYMENT_RECEIVED',
    COMPLETED: 'COMPLETED'
  },
  otpPurpose: {
    UPGRADE: 'UPGRADE_APPROVAL',
    PROVISION: 'SUBSCRIPTION_PROVISION'
  },
  provisionMessages: {
    userOnly: 'Paid subscriptions can only be provisioned to an enterprise user account.',
    inactiveUser: 'The customer account is inactive. Activate it before provisioning a subscription.',
    tenantConflict: 'The customer account is already assigned to another organization. Review its tenant assignment before provisioning.',
    tenantUnavailable: 'The selected organization is unavailable. Choose an active organization or contact an administrator.',
    demoTenantForbidden: 'The demo-only organization cannot receive a customer subscription. Select a customer organization.',
    concurrentChange: 'The customer account or tenant assignment changed during provisioning. Refresh the account and retry.',
    atomicBatchUnavailable: 'Subscription provisioning is temporarily unavailable because atomic database writes are unsupported. Contact support.'
  },
  subscriptionCustomerInvariantMarker: 'SUBSCRIPTION_CUSTOMER_TENANT_MISMATCH'
} as const;
