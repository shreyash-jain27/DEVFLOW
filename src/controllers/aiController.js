const Task = require('../models/Task');
const Project = require('../models/Project');
const aiHelper = require('../utils/aiHelper');

// @desc    Generate subtasks for a specific task using AI
// @route   POST /api/ai/tasks/:taskId/generate-subtasks
// @access  Private
const generateSubtasks = async (req, res, next) => {
  try {
    const parentTask = await Task.findById(req.params.taskId);
    if (!parentTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Call the AI helper with the parent task description or title
    const promptInput = parentTask.description || parentTask.title;
    const subtaskData = await aiHelper.generateSubtasks(promptInput);

    // Map AI output to our Mongoose schema format
    const subtasksToCreate = subtaskData.map(subtask => ({
      title: subtask.title,
      description: subtask.description,
      project: parentTask.project,
      assignedTo: parentTask.assignedTo,
      aiGenerated: true,
      createdBy: req.user._id
    }));

    // Save all newly generated tasks to the database
    const createdTasks = await Task.insertMany(subtasksToCreate);

    // Emit real-time event that subtasks are ready
    const io = req.app.get('io');
    io.emit('ai:subtasks-ready', { parentTaskId: parentTask._id, newTasks: createdTasks });

    res.status(201).json(createdTasks);
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

// @desc    Analyze code for quality, issues, and suggestions
// @route   POST /api/ai/code/analyze
// @access  Private
const analyzeCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Please provide both code and language.' });
    }

    const analysis = await aiHelper.analyzeCode(code, language);

    res.status(200).json(analysis);
  } catch (error) {
    next(error);
  }
};

// @desc    Suggest priority for a task using AI
// @route   POST /api/ai/tasks/:taskId/suggest-priority
// @access  Private
const suggestPriority = async (req, res, next) => {
  try {
    // Find task and populate project to get context for the AI
    const task = await Task.findById(req.params.taskId).populate('project', 'name description');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const projectContext = task.project ? `${task.project.name} - ${task.project.description}` : 'No project context available';
    
    // Call AI helper
    const suggestion = await aiHelper.suggestPriority(task.title, task.description || '', projectContext);

    // Save the AI's suggestions into the database on the task document
    task.aiSuggestions = {
      suggestedPriority: suggestion.priority,
      estimatedHours: suggestion.estimatedHours
    };
    
    await task.save();

    res.status(200).json(suggestion);
  } catch (error) {
    next(error);
  }
};

// @desc    Parse meeting notes and create actionable tasks
// @route   POST /api/ai/meeting-notes/parse
// @access  Private
const parseMeetingNotes = async (req, res, next) => {
  try {
    const { notes, projectId } = req.body;

    if (!notes) {
      return res.status(400).json({ message: 'Please provide meeting notes.' });
    }

    // Call AI helper to extract data
    const parsedTasksData = await aiHelper.parseMeetingNotes(notes);

    // Prepare tasks for database insertion
    const tasksToCreate = parsedTasksData.map(taskData => ({
      title: taskData.title,
      description: `Extracted from meeting notes.\nAssignee mentioned: ${taskData.assignee || 'None'}`,
      dueDate: taskData.dueDate,
      project: projectId || null,
      aiGenerated: true,
      createdBy: req.user._id
    }));

    // Save tasks to database
    const createdTasks = await Task.insertMany(tasksToCreate);

    res.status(201).json(createdTasks);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateSubtasks,
  analyzeCode,
  suggestPriority,
  parseMeetingNotes
};
