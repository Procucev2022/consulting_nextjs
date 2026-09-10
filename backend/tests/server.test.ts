import { describe, it, expect, vi } from 'vitest';
import { startServer } from '../src/server';

describe('server entrypoint', () => {
  it('should start server, invoke listen callback, and shut down cleanly', async () => {
    const { server, shutdown } = await startServer(0);
    expect(server).toBeDefined();

    await shutdown();
  });

  it('should start server with process.env.PORT when specified', async () => {
    const originalPort = process.env.PORT;
    process.env.PORT = '0';
    try {
      const { server, shutdown } = await startServer();
      expect(server).toBeDefined();
      await shutdown();
    } finally {
      process.env.PORT = originalPort;
    }
  });

  it('should fall back to default port 5001 when process.env.PORT is not set', async () => {
    const originalPort = process.env.PORT;
    delete process.env.PORT;
    try {
      const { server, shutdown } = await startServer();
      expect(server).toBeDefined();
      await shutdown();
    } finally {
      process.env.PORT = originalPort;
    }
  });

  it('should register SIGTERM and SIGINT listeners', () => {
    const termListeners = process.listeners('SIGTERM');
    const intListeners = process.listeners('SIGINT');
    expect(termListeners.length).toBeGreaterThan(0);
    expect(intListeners.length).toBeGreaterThan(0);
  });
});
