const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { validateStudent } = require('../middlewares/validate');

router.route('/students')
  .get(studentController.getAllStudents)
  .post(validateStudent, studentController.createStudent);

router.route('/students/:id')
  .get(studentController.getStudentById)
  .put(validateStudent, studentController.updateStudent)
  .delete(studentController.deleteStudent);

module.exports = router;
