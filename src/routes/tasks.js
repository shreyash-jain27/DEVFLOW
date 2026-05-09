const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { taskAttachments, handleUpload } = require('../middlewares/upload');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const { generateKey, hashQuery } = require('../utils/cache');
const { createTaskSchema, updateTaskSchema } = require('../validators/task.validator');
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const {
  uploadAttachments,
  getAttachments,
  deleteAttachment,
} = require('../controllers/attachmentController');


router.use(auth);



router.route('/')
  .post(
    validate(createTaskSchema),
    authorize('admin', 'member'),
    createTask
  )
  .get(
    cacheMiddleware((req) => generateKey('tasks', req.user.id, hashQuery(req.query)), 120), 
    getAllTasks
  );




router.route('/:id')
  .get(
    cacheMiddleware((req) => generateKey('task', req.params.id), 300), 
    getTaskById
  )
  .put(validate(updateTaskSchema), authorize('admin', 'member'), updateTask)
  .delete(authorize('admin', 'member'), deleteTask);




router.route('/:id/attachments')
  .post(handleUpload(taskAttachments), authorize('admin', 'member'), uploadAttachments)
  .get(authorize('admin', 'member', 'viewer'), getAttachments);


router.delete('/:id/attachments/:attachmentId', authorize('admin', 'member'), deleteAttachment);

module.exports = router;

