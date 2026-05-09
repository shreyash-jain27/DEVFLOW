const Task = require('../models/Task');
const { validationResult } = require('express-validator');
const { del, delByPattern, generateKey } = require('../utils/cache');
const { audit } = require('../services/audit.service');




const createTask = async (req, res, next) => {
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, status, priority, assignedTo, project, dueDate, tags } = req.body;

    
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      assignedTo,
      project,
      dueDate,
      tags,
      createdBy: req.user._id 
    });

    
    const io = req.app.get('io');
    io.emit('task:created', task);

    await delByPattern(generateKey('tasks', req.user.id.toString(), '*'));
    audit(req, 'CREATE', 'Task', task._id);

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};




const getAllTasks = async (req, res, next) => {
  try {
    const { project, status, priority } = req.query;
    
    
    let query = {};
    if (project) query.project = project;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .populate('createdBy', 'name');

    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};




const getTaskById = async (req, res, next) => {
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
    next(error);
  }
};




const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    
    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    
    if (req.body.status) {
      const io = req.app.get('io');
      io.emit('task:updated', task);
    }

    await Promise.all([
      del(generateKey('task', req.params.id)),
      delByPattern(generateKey('tasks', req.user.id.toString(), '*')),
    ]);
    audit(req, 'UPDATE', 'Task', task._id);

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};




const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    await Promise.all([
      del(generateKey('task', req.params.id)),
      delByPattern(generateKey('tasks', req.user.id.toString(), '*')),
    ]);
    audit(req, 'DELETE', 'Task', req.params.id);

    res.status(200).json({ message: 'Task removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask
};
