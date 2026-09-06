import app from './app';

export const startServer = (port: number | string = 5000) => {
  return new Promise<{ server: any; shutdown: () => Promise<void> }>((resolve) => {
    const server = app.listen(port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Consulting Backend Server running on port ${port}`);
      console.log(`🌐 Base URL: http://localhost:${port}`);
      console.log(`🩺 Health check: http://localhost:${port}/api/health`);
      console.log(`=======================================================`);
      resolve({ server, shutdown });
    });

    const shutdown = () => {
      return new Promise<void>((res) => {
        console.log('Received kill signal, closing server gracefully...');
        server.close(() => {
          console.log('Closed remaining connections.');
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
