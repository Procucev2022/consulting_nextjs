import { describe, it, expect, vi } from 'vitest';
import { startServer } from '../src/server';

describe('server entrypoint', () => {
  it('should start server, invoke listen callback, and shut down cleanly', async () => {
    const { server, shutdown } = await startServer(0);
    expect(server).toBeDefined();

    await shutdown();
  });

  it('should register SIGTERM and SIGINT listeners', () => {
    const termListeners = process.listeners('SIGTERM');
    const intListeners = process.listeners('SIGINT');
    expect(termListeners.length).toBeGreaterThan(0);
    expect(intListeners.length).toBeGreaterThan(0);
  });
});
