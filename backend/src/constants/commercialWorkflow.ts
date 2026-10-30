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
  }
} as const;
