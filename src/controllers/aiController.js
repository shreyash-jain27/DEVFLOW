const Task    = require('../models/Task');
const ApiError = require('../utils/ApiError');
const { aiQueue, AI_JOB_OPTIONS } = require('../config/queues');




const accepted = (res, job, message) =>
  res.status(202).json({ jobId: job.id, message, hint: `Poll GET /api/ai/jobs/${job.id} for status` });






const generateSubtasks = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId).select('_id title');
    if (!task) return next(new ApiError(404, 'Task not found'));

    const job = await aiQueue.add(
      'generateSubtasks',
      { taskId: task._id.toString(), userId: req.user._id.toString() },
      AI_JOB_OPTIONS
    );

    return accepted(res, job, `Subtask generation queued for "${task.title}"`);
  } catch (error) {
    next(error);
  }
};




const suggestPriority = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId).select('_id title');
    if (!task) return next(new ApiError(404, 'Task not found'));

    const job = await aiQueue.add(
      'suggestPriority',
      { taskId: task._id.toString() },
      AI_JOB_OPTIONS
    );

    return accepted(res, job, `Priority suggestion queued for "${task.title}"`);
  } catch (error) {
    next(error);
  }
};




const analyzeCode = async (req, res, next) => {
  try {
    const { code, language, taskId } = req.body;

    if (!code || !language) {
      return next(new ApiError(400, 'Please provide both code and language'));
    }

    const job = await aiQueue.add(
      'analyzeCode',
      { code, language, taskId: taskId || null },
      AI_JOB_OPTIONS
    );

    return accepted(res, job, 'Code analysis queued');
  } catch (error) {
    next(error);
  }
};




const parseMeetingNotes = async (req, res, next) => {
  try {
    const { notes, projectId } = req.body;

    if (!notes) return next(new ApiError(400, 'Please provide meeting notes'));

    const job = await aiQueue.add(
      'parseMeetingNotes',
      { notes, projectId: projectId || null, userId: req.user._id.toString() },
      AI_JOB_OPTIONS
    );

    return accepted(res, job, 'Meeting-notes parsing queued');
  } catch (error) {
    next(error);
  }
};

module.exports = { generateSubtasks, analyzeCode, suggestPriority, parseMeetingNotes };
