import { describe, it, expect } from 'vitest';
import router from '../../src/routes/module3Canonical.routes';

describe('module3Canonical.routes', () => {
  it('registers all canonical audit routes', () => {
    expect(router).toBeDefined();
    const routePaths = router.stack
      .filter((layer) => layer.route)
      .map((layer) => layer.route?.path);

    expect(routePaths).toContain('/audit-report');
    expect(routePaths).toContain('/spend-reconciliation');
    expect(routePaths).toContain('/independent-audit');
    expect(routePaths).toContain('/test-matrix');
    expect(routePaths).toContain('/evidence-workbook');
  });
});
