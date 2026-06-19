const db = require('../config/db');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../config/logger');

// Add a mark entry for a student
const addMark = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { subject, score, max_score, exam_type } = req.body;

    // Check if student exists first
    const studentCheck = await db.query('SELECT id FROM students WHERE id = $1', [studentId]);
    if (studentCheck.rows.length === 0) {
      throw new ApiError(404, `Student with ID ${studentId} not found.`);
    }

    const queryText = `
      INSERT INTO marks (student_id, subject, score, max_score, exam_type)
      VALUES ($1, $2, $3, COALESCE($4, 100), COALESCE($5, 'final'))
      RETURNING *
    `;
    const values = [studentId, subject, score, max_score || null, exam_type || null];

    const result = await db.query(queryText, values);
    logger.info(`Mark created: id=${result.rows[0].id}, student_id=${studentId}, subject=${result.rows[0].subject}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// Get all marks for a specific student
const getMarksByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Check if student exists first
    const studentCheck = await db.query('SELECT id FROM students WHERE id = $1', [studentId]);
    if (studentCheck.rows.length === 0) {
      throw new ApiError(404, `Student with ID ${studentId} not found.`);
    }

    const queryText = 'SELECT * FROM marks WHERE student_id = $1 ORDER BY id DESC';
    const result = await db.query(queryText, [studentId]);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// Update a specific mark entry
const updateMark = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, score, max_score, exam_type } = req.body;

    // Check if mark entry exists first
    const markCheck = await db.query('SELECT * FROM marks WHERE id = $1', [id]);
    if (markCheck.rows.length === 0) {
      throw new ApiError(404, `Mark entry with ID ${id} not found.`);
    }

    const currentMark = markCheck.rows[0];

    const queryText = `
      UPDATE marks
      SET
        subject = $1,
        score = $2,
        max_score = $3,
        exam_type = $4
      WHERE id = $5
      RETURNING *
    `;

    const values = [
      subject !== undefined ? subject : currentMark.subject,
      score !== undefined ? score : currentMark.score,
      max_score !== undefined ? max_score : currentMark.max_score,
      exam_type !== undefined ? exam_type : currentMark.exam_type,
      id,
    ];

    const result = await db.query(queryText, values);
    logger.info(`Mark updated: id=${id}`);

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// Delete a specific mark entry
const deleteMark = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM marks WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new ApiError(404, `Mark entry with ID ${id} not found.`);
    }

    logger.info(`Mark deleted: id=${id}`);
    res.status(200).json({
      success: true,
      message: `Mark entry with ID ${id} deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addMark,
  getMarksByStudent,
  updateMark,
  deleteMark,
};
