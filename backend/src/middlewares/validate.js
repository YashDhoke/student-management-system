const { ApiError } = require('./errorHandler');

// Email regex helper
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validateStudent = (req, res, next) => {
  const { first_name, last_name, email, phone, date_of_birth } = req.body;
  const errors = {};

  // For PUT / update requests, we might allow partial updates.
  // But standard CREATE POST requires first_name, last_name, and email.
  const isUpdate = req.method === 'PUT';

  if (!isUpdate) {
    if (!first_name || typeof first_name !== 'string' || first_name.trim() === '') {
      errors.first_name = 'First name is required and must be a string.';
    }
    if (!last_name || typeof last_name !== 'string' || last_name.trim() === '') {
      errors.last_name = 'Last name is required and must be a string.';
    }
    if (!email || !isValidEmail(email)) {
      errors.email = 'A valid email address is required.';
    }
  } else {
    // If update request and field is provided, validate it
    if (first_name !== undefined && (typeof first_name !== 'string' || first_name.trim() === '')) {
      errors.first_name = 'First name must be a non-empty string.';
    }
    if (last_name !== undefined && (typeof last_name !== 'string' || last_name.trim() === '')) {
      errors.last_name = 'Last name must be a non-empty string.';
    }
    if (email !== undefined && !isValidEmail(email)) {
      errors.email = 'A valid email address is required.';
    }
  }

  // Date of birth validation if provided
  if (date_of_birth) {
    const dob = new Date(date_of_birth);
    if (isNaN(dob.getTime())) {
      errors.date_of_birth = 'Date of birth must be a valid date (YYYY-MM-DD).';
    }
  }

  if (Object.keys(errors).length > 0) {
    const err = new ApiError(400, 'Validation Failed');
    err.errors = errors;
    return next(err);
  }

  next();
};

const validateMark = (req, res, next) => {
  const { subject, score, max_score, exam_type } = req.body;
  const errors = {};
  const isUpdate = req.method === 'PUT';

  if (!isUpdate) {
    if (!subject || typeof subject !== 'string' || subject.trim() === '') {
      errors.subject = 'Subject is required and must be a string.';
    }
    if (score === undefined || isNaN(Number(score)) || Number(score) < 0 || Number(score) > 100) {
      errors.score = 'Score is required and must be a number between 0 and 100.';
    }
  } else {
    if (subject !== undefined && (typeof subject !== 'string' || subject.trim() === '')) {
      errors.subject = 'Subject must be a non-empty string.';
    }
    if (score !== undefined && (isNaN(Number(score)) || Number(score) < 0 || Number(score) > 100)) {
      errors.score = 'Score must be a number between 0 and 100.';
    }
  }

  if (max_score !== undefined && (isNaN(Number(max_score)) || Number(max_score) <= 0)) {
    errors.max_score = 'Maximum score must be a positive number.';
  }

  if (exam_type !== undefined && (typeof exam_type !== 'string' || exam_type.trim() === '')) {
    errors.exam_type = 'Exam type must be a non-empty string.';
  }

  if (Object.keys(errors).length > 0) {
    const err = new ApiError(400, 'Validation Failed');
    err.errors = errors;
    return next(err);
  }

  next();
};

module.exports = {
  validateStudent,
  validateMark,
};
