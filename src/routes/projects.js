const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

// Protect all project routes
router.use(auth);

router.route('/')
  .post(createProject)
  .get(getAllProjects);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

module.exports = router;
