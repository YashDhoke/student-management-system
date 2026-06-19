const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marks.controller');
const { validateMark } = require('../middlewares/validate');

// Student nested marks endpoints
router.route('/students/:studentId/marks')
  .post(validateMark, marksController.addMark)
  .get(marksController.getMarksByStudent);

// Specific mark endpoints
router.route('/marks/:id')
  .put(validateMark, marksController.updateMark)
  .delete(marksController.deleteMark);

module.exports = router;
