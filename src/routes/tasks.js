const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

// All task routes require authentication (this applies the middleware to all routes below)
router.use(auth);

// @route   POST /api/tasks
// @route   GET /api/tasks
router.route('/')
  .post(
    [
      // Validation middleware for creating a task
      check('title', 'Title is required').not().isEmpty(),
    ],
    createTask
  )
  .get(getAllTasks);

// @route   GET /api/tasks/:id
// @route   PUT /api/tasks/:id
// @route   DELETE /api/tasks/:id
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
