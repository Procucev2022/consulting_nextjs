import { CLIENT_ERROR_REQUEST_ID_PREFIX, CLIENT_ERROR_REQUEST_ID_SUFFIX_LENGTH } from '../constants/errors';

export const createClientRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${CLIENT_ERROR_REQUEST_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 2 + CLIENT_ERROR_REQUEST_ID_SUFFIX_LENGTH)}`;
};
