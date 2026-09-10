import type { Server } from 'http';
import app from './app';
import logger from './utils/logger';

export const startServer = (
  port: number | string = process.env.PORT || 5001
): Promise<{ server: Server; shutdown: () => Promise<void> }> => {
  return new Promise<{ server: Server; shutdown: () => Promise<void> }>((resolve) => {
    const server = app.listen(port, () => {
      logger.info(`🚀 Consulting Backend Server running on port ${port}`, {
        port,
        baseUrl: `http://localhost:${port}`,
        healthCheck: `http://localhost:${port}/api/health`
      });
      resolve({ server, shutdown });
    });

    server.on('error', (err: Error) => {
      logger.warn('Server listen encountered error', { error: err });
      resolve({ server, shutdown });
    });

    const shutdown = (): Promise<void> => {
      return new Promise<void>((res) => {
        logger.info('Received kill signal, closing server gracefully...');
        server.close(() => {
          logger.info('Closed remaining connections.');
          res();
        });
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  });
};

/* v8 ignore start */
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
/* v8 ignore stop */

export default startServer;
