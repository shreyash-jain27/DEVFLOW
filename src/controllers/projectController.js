const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const { del, delByPattern, generateKey } = require('../utils/cache');
const { audit } = require('../services/audit.service');




const createProject = async (req, res, next) => {
  try {
    const { name, description, team, status, startDate, endDate } = req.body;

    const project = await Project.create({
      name,
      description,
      team,
      status,
      startDate,
      endDate,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    await del(generateKey('projects', req.user.id));
    audit(req, 'CREATE', 'Project', project._id);

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};




const getAllProjects = async (req, res, next) => {
  try {
    
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('team', 'name'); 

    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};




const getProjectById = async (req, res, next) => {
  try {
    
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('team', 'name')
      .populate('tasks'); 

    if (!project) {
      return next(new ApiError(404, 'Project not found'));
    }

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};




const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await Promise.all([
      del(generateKey('project', req.params.id)),
      del(generateKey('projects', project.owner.toString())),
    ]);
    audit(req, 'UPDATE', 'Project', project._id);

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};




const deleteProject = async (req, res, next) => {
  try {
    const project = req.project;

    if (project.owner.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Only the project owner can delete this project'));
    }

    await Project.findByIdAndDelete(req.params.id);

    await Promise.all([
      del(generateKey('project', req.params.id)),
      del(generateKey('projects', project.owner.toString())),
    ]);
    audit(req, 'DELETE', 'Project', req.params.id);

    res.status(200).json({ message: 'Project removed successfully' });
  } catch (error) {
    next(error);
  }
};




const addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = req.project;

    if (project.members.find(m => m.user.toString() === userId)) {
      return next(new ApiError(400, 'User is already a member of this project'));
    }

    project.members.push({ user: userId, role: role || 'member' });
    await project.save();

    await del(generateKey('project', project._id.toString()));
    audit(req, 'UPDATE', 'Project', project._id, { action: 'addMember', userId });

    res.status(200).json({ message: 'Member added successfully', members: project.members });
  } catch (error) {
    next(error);
  }
};




const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    const project = req.project;

    const memberIndex = project.members.findIndex(m => m.user.toString() === userId);
    if (memberIndex === -1) {
      return next(new ApiError(404, 'Member not found in project'));
    }
    if (project.owner.toString() === userId) {
      return next(new ApiError(400, 'Cannot change the role of the project owner'));
    }

    project.members[memberIndex].role = role;
    await project.save();

    await del(generateKey('project', project._id.toString()));

    res.status(200).json({ message: 'Member role updated successfully', members: project.members });
  } catch (error) {
    next(error);
  }
};




const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const project = req.project;

    if (project.owner.toString() === userId) {
      return next(new ApiError(400, 'Cannot remove the project owner'));
    }

    project.members = project.members.filter(m => m.user.toString() !== userId);
    await project.save();

    await del(generateKey('project', project._id.toString()));
    audit(req, 'DELETE', 'Project', project._id, { action: 'removeMember', userId });

    res.status(200).json({ message: 'Member removed successfully', members: project.members });
  } catch (error) {
    next(error);
  }
};




const getMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.user', 'name email role');
    res.status(200).json(project.members);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
  getMembers
};
