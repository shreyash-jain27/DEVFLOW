

const Task     = require('../models/Task');
const aiHelper = require('../utils/aiHelper');
const logger   = require('../utils/logger');



const getIO = () => {
  try {
    
    const app = require('../server');
    return app.get('io');
  } catch {
    return null; 
  }
};




const generateSubtasks = async (job) => {
  const { taskId, userId } = job.data;

  const parentTask = await Task.findById(taskId);
  if (!parentTask) throw new Error(`Task ${taskId} not found`);

  await job.progress(10);

  const promptInput = parentTask.description || parentTask.title;
  const subtaskData = await aiHelper.generateSubtasks(promptInput);

  await job.progress(70);

  const subtasksToCreate = subtaskData.map((s) => ({
    title:       s.title,
    description: s.description,
    project:     parentTask.project,
    assignedTo:  parentTask.assignedTo,
    aiGenerated: true,
    createdBy:   userId,
  }));

  const createdTasks = await Task.insertMany(subtasksToCreate);

  await job.progress(100);

  const io = getIO();
  io?.emit('ai:subtasks-ready', { parentTaskId: parentTask._id, newTasks: createdTasks });

  return { parentTaskId: parentTask._id, count: createdTasks.length, tasks: createdTasks };
};


const suggestPriority = async (job) => {
  const { taskId } = job.data;

  const task = await Task.findById(taskId).populate('project', 'name description');
  if (!task) throw new Error(`Task ${taskId} not found`);

  await job.progress(10);

  const projectContext = task.project
    ? `${task.project.name} - ${task.project.description}`
    : 'No project context available';

  const suggestion = await aiHelper.suggestPriority(task.title, task.description || '', projectContext);

  await job.progress(70);

  task.aiSuggestions = {
    suggestedPriority: suggestion.priority,
    estimatedHours:    suggestion.estimatedHours,
  };
  await task.save();

  await job.progress(100);

  const io = getIO();
  io?.emit('ai:priority-suggested', { taskId: task._id, suggestion });

  return suggestion;
};


const parseMeetingNotes = async (job) => {
  const { notes, projectId, userId } = job.data;

  await job.progress(10);

  const parsedTasksData = await aiHelper.parseMeetingNotes(notes);

  await job.progress(60);

  const tasksToCreate = parsedTasksData.map((t) => ({
    title:       t.title,
    description: `Extracted from meeting notes.\nAssignee mentioned: ${t.assignee || 'None'}`,
    dueDate:     t.dueDate,
    project:     projectId || null,
    aiGenerated: true,
    createdBy:   userId,
  }));

  const createdTasks = await Task.insertMany(tasksToCreate);

  await job.progress(100);

  const io = getIO();
  io?.emit('ai:tasks-created', { projectId, count: createdTasks.length, tasks: createdTasks });

  return { count: createdTasks.length, tasks: createdTasks };
};


const analyzeCode = async (job) => {
  const { code, language, taskId } = job.data;

  await job.progress(10);

  const analysis = await aiHelper.analyzeCode(code, language);

  await job.progress(100);

  const io = getIO();
  io?.emit('ai:analysis-ready', { taskId: taskId || null, analysis });

  return analysis;
};


const HANDLERS = { generateSubtasks, suggestPriority, parseMeetingNotes, analyzeCode };


const aiProcessor = async (job) => {
  const handler = HANDLERS[job.name];
  if (!handler) throw new Error(`Unknown AI job type: "${job.name}"`);

  logger.info(`[AI Processor] Running job "${job.name}" (id: ${job.id})`);
  return handler(job);
};

module.exports = aiProcessor;
