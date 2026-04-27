const Task = require('../models/Task');
const { validationResult } = require('express-validator');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, status, priority, assignedTo, project, dueDate, tags } = req.body;

    // Create the task in the database
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      assignedTo,
      project,
      dueDate,
      tags,
      createdBy: req.user._id // Automatically assigned from the auth middleware
    });

    // Emit real-time event to all connected clients
    const io = req.app.get('io');
    io.emit('task:created', task);

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while creating task' });
  }
};

// @desc    Get all tasks (with optional filtering)
// @route   GET /api/tasks
// @access  Private
const getAllTasks = async (req, res) => {
  try {
    const { project, status, priority } = req.query;
    
    // Build a dynamic query object based on provided filters
    let query = {};
    if (project) query.project = project;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Find tasks and populate the referenced fields with actual data
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .populate('createdBy', 'name');

    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .populate('createdBy', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching task' });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update the task. { new: true } returns the updated document, runValidators ensures enum checks pass
    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // Emit real-time event if status was updated
    if (req.body.status) {
      const io = req.app.get('io');
      io.emit('task:updated', task);
    }

    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Task removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask
};
