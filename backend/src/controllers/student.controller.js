const db = require('../config/db');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../config/logger');

// Create a student
const createStudent = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, date_of_birth, enrollment_date } = req.body;

    const queryText = `
      INSERT INTO students (first_name, last_name, email, phone, date_of_birth, enrollment_date)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE))
      RETURNING *
    `;
    const values = [
      first_name.trim(),
      last_name.trim(),
      email.trim().toLowerCase(),
      typeof phone === 'string' ? phone.trim() || null : phone,
      typeof date_of_birth === 'string' ? date_of_birth.trim() || null : date_of_birth,
      typeof enrollment_date === 'string' ? enrollment_date.trim() || null : enrollment_date,
    ];

    const result = await db.query(queryText, values);
    logger.info(`Student created: id=${result.rows[0].id}, email=${result.rows[0].email}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// Get all students with pagination
const getAllStudents = async (req, res, next) => {
  try {
    // Clamp page to ≥ 1 and limit to 1–100 to prevent abuse / negative offsets
    const rawPage = parseInt(req.query.page);
    const rawLimit = parseInt(req.query.limit);

    const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 10;
    const offset = (page - 1) * limit;

    if (req.query.page && (isNaN(rawPage) || rawPage < 1)) {
      logger.warn(`Invalid 'page' query param received: "${req.query.page}" — defaulting to 1`);
    }
    if (req.query.limit && (isNaN(rawLimit) || rawLimit < 1)) {
      logger.warn(`Invalid 'limit' query param received: "${req.query.limit}" — defaulting to 10`);
    }

    const dataQuery = `
      SELECT * FROM students
      ORDER BY id DESC
      LIMIT $1 OFFSET $2
    `;
    const countQuery = `SELECT COUNT(*) FROM students`;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [limit, offset]),
      db.query(countQuery),
    ]);

    const totalRecords = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    res.status(200).json({
      success: true,
      data: dataResult.rows,
      meta: {
        totalRecords,
        currentPage: page,
        totalPages,
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get single student by ID with their nested marks list
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queryText = `
      SELECT 
        s.id, s.first_name, s.last_name, s.email, s.phone, s.date_of_birth, s.enrollment_date, s.created_at, s.updated_at,
        m.id AS mark_id, m.subject, m.score, m.max_score, m.exam_type, m.created_at AS mark_created_at
      FROM students s
      LEFT JOIN marks m ON s.id = m.student_id
      WHERE s.id = $1
    `;
    
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      throw new ApiError(404, `Student with ID ${id} not found.`);
    }

    const rows = result.rows;
    const student = {
      id: rows[0].id,
      first_name: rows[0].first_name,
      last_name: rows[0].last_name,
      email: rows[0].email,
      phone: rows[0].phone,
      date_of_birth: rows[0].date_of_birth,
      enrollment_date: rows[0].enrollment_date,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
      marks: [],
    };

    rows.forEach((row) => {
      if (row.mark_id) {
        student.marks.push({
          id: row.mark_id,
          subject: row.subject,
          score: parseFloat(row.score),
          max_score: parseFloat(row.max_score),
          exam_type: row.exam_type,
          created_at: row.mark_created_at,
        });
      }
    });

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (err) {
    next(err);
  }
};

// Update a student
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, date_of_birth, enrollment_date } = req.body;

    // Check if student exists first
    const checkQuery = await db.query('SELECT * FROM students WHERE id = $1', [id]);
    if (checkQuery.rows.length === 0) {
      throw new ApiError(404, `Student with ID ${id} not found.`);
    }

    const currentStudent = checkQuery.rows[0];

    const queryText = `
      UPDATE students 
      SET 
        first_name = $1, 
        last_name = $2, 
        email = $3, 
        phone = $4, 
        date_of_birth = $5, 
        enrollment_date = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;

    const values = [
      first_name !== undefined ? (typeof first_name === 'string' ? first_name.trim() : first_name) : currentStudent.first_name,
      last_name !== undefined ? (typeof last_name === 'string' ? last_name.trim() : last_name) : currentStudent.last_name,
      email !== undefined ? (typeof email === 'string' ? email.trim().toLowerCase() : email) : currentStudent.email,
      phone !== undefined ? (typeof phone === 'string' ? phone.trim() || null : phone) : currentStudent.phone,
      date_of_birth !== undefined ? (typeof date_of_birth === 'string' ? date_of_birth.trim() || null : date_of_birth) : currentStudent.date_of_birth,
      enrollment_date !== undefined ? (typeof enrollment_date === 'string' ? enrollment_date.trim() || null : enrollment_date) : currentStudent.enrollment_date,
      id,
    ];

    const result = await db.query(queryText, values);

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// Delete a student
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM students WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new ApiError(404, `Student with ID ${id} not found.`);
    }

    res.status(200).json({
      success: true,
      message: `Student with ID ${id} and all related marks deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
