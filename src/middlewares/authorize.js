const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');

const authorize = (...roles) => async (req, res, next) => {
  try {
    let projectId;

    
    if (req.baseUrl.includes('/api/projects') && req.params.id) {
      projectId = req.params.id;
    }
    
    else if (req.baseUrl.includes('/api/tasks') && req.method === 'POST') {
      projectId = req.body.project;
    }
    
    else if (req.baseUrl.includes('/api/tasks') && req.params.id) {
      const task = await Task.findById(req.params.id);
      if (!task) {
        return next(new ApiError(404, 'Task not found'));
      }
      projectId = task.project;
      req.task = task; 
    }

    
    if (!projectId) {
      return next(new ApiError(400, 'Project context missing for authorization'));
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new ApiError(404, 'Project not found'));
    }

    req.project = project; 

    
    const isOwner = project.owner.toString() === req.user._id.toString();
    if (isOwner) {
      if (roles.includes('admin')) {
        return next();
      }
    }

    
    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    
    if (!member || !roles.includes(member.role)) {
      if (isOwner) {
        return next(); 
      }
      return next(new ApiError(403, 'User role is not authorized to access this route'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authorize;
