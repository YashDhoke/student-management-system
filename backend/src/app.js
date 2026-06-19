const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./config/logger');
const { errorHandler } = require('./middlewares/errorHandler');
const studentRouter = require('./routes/student.routes');
const marksRouter = require('./routes/marks.routes');

const app = express();

// ── Core Middlewares ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HTTP Request Logger (morgan → winston) ─────────────────────────────────
// Stream morgan output through our Winston logger so all logs go one place
const morganStream = {
  write: (message) => logger.http(message.trim()),
};

app.use(
  morgan(
    process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    { stream: morganStream }
  )
);

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api', studentRouter);
app.use('/api', marksRouter);

// ── 404 Handler — catches any unmatched route ──────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ── Centralized Error Handler (must be last) ───────────────────────────────
app.use(errorHandler);

module.exports = app;
