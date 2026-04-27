const Project = require('../models/Project');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description, team, status, startDate, endDate } = req.body;

    const project = await Project.create({
      name,
      description,
      team,
      status,
      startDate,
      endDate,
      createdBy: req.user._id
    });

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while creating project' });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'name email')
      .populate('team', 'name'); // Populates team info if you eventually create a Team model

    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching projects' });
  }
};

// @desc    Get a single project and populate its tasks
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('team', 'name')
      // This uses the virtual field we added to the Project model
      .populate('tasks'); 

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching project' });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating project' });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Project removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting project' });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject
};
