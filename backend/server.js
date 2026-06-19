const app = require('./src/app');
const { pool } = require('./src/config/db');
const logger = require('./src/config/logger');
require('dotenv').config();

// Railway watch path trigger
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// ── Graceful Shutdown ──────────────────────────────────────────────────────
// Allow in-flight requests to finish before closing the DB pool and exiting.
const shutdown = (signal) => {
  logger.warn(`${signal} received — shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed. Draining DB pool...');
    try {
      await pool.end();
      logger.info('Database pool drained. Exiting cleanly.');
      process.exit(0);
    } catch (err) {
      logger.error('Error draining DB pool during shutdown', { error: err.message });
      process.exit(1);
    }
  });

  // Force-kill if graceful shutdown exceeds 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded — forcing exit.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM')); // Kubernetes / Docker stop
process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C in terminal

// ── Unhandled Rejection / Exception Guards ─────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason: String(reason) });
  // Do NOT exit here — let the error propagate to the error handler
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception — shutting down', { error: err.message, stack: err.stack });
  shutdown('uncaughtException');
});
