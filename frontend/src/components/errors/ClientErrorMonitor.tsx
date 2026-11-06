'use client';

import { useEffect } from 'react';
import { installClientErrorMonitoring } from '../../utils/clientErrorTelemetry';

export const ClientErrorMonitor = (): null => {
  useEffect(() => installClientErrorMonitoring(), []);
  return null;
};
