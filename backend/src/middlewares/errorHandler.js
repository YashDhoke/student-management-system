const logger = require('../config/logger');

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // ── PostgreSQL Error Code Mapping ──────────────────────────────────────────

  // 23505 — Unique constraint violation (e.g. duplicate email)
  if (err.code === '23505') {
    statusCode = 409;
    if (err.constraint && err.constraint.includes('email')) {
      message = 'A student with this email already exists.';
    } else if (err.constraint && err.constraint.includes('marks_student_id_subject_exam_type_key')) {
      message = 'A mark for this subject and exam type already exists for this student.';
    } else {
      message = `Duplicate key violation on constraint: ${err.constraint || 'unknown'}.`;
    }
  }

  // 23503 — Foreign key violation (e.g. referencing a non-existent student)
  if (err.code === '23503') {
    statusCode = 404;
    message = 'Referenced resource not found (foreign key constraint violation).';
  }

  // 23502 — Not-null constraint violation
  if (err.code === '23502') {
    statusCode = 400;
    message = `Column "${err.column}" cannot be null.`;
  }

  // 22P02 — Invalid input syntax (e.g. string passed as integer)
  if (err.code === '22P02') {
    statusCode = 400;
    message = 'Invalid input: data type mismatch in query parameters or body.';
  }

  // 22003 — Numeric value out of range
  if (err.code === '22003') {
    statusCode = 400;
    message = 'Numeric value is out of the allowed range.';
  }

  // 42P01 — Undefined table (schema out-of-sync with code)
  if (err.code === '42P01') {
    statusCode = 500;
    message = 'Database table not found. Please run migrations.';
  }

  // ── Log the error ──────────────────────────────────────────────────────────
  const logPayload = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message,
    // Only include stack trace for unexpected 5xx errors
    ...(statusCode >= 500 && { stack: err.stack }),
  };

  if (statusCode >= 500) {
    logger.error('Internal Server Error', logPayload);
  } else {
    logger.warn('Client Error', logPayload);
  }

  // ── Send response ──────────────────────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    // Only expose stack in development
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
};

module.exports = {
  ApiError,
  errorHandler,
};
