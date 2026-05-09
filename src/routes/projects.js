const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const { generateKey } = require('../utils/cache');
const { createProjectSchema } = require('../validators/project.validator');

const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
  getMembers
} = require('../controllers/projectController');


router.use(auth);

router.route('/')
  .post(validate(createProjectSchema), createProject)
  .get(
    cacheMiddleware((req) => generateKey('projects', req.user.id), 300), 
    getAllProjects
  );

router.route('/:id')
  .get(
    authorize('admin', 'member', 'viewer'),
    cacheMiddleware((req) => generateKey('project', req.params.id), 300), 
    getProjectById
  )
  .put(authorize('admin'), updateProject)
  .delete(authorize('admin'), deleteProject);


router.route('/:id/members')
  .post(authorize('admin'), addMember)
  .get(authorize('admin', 'member', 'viewer'), getMembers);

router.route('/:id/members/:userId')
  .put(authorize('admin'), updateMemberRole)
  .delete(authorize('admin'), removeMember);

module.exports = router;
