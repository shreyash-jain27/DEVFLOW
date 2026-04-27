const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  generateSubtasks,
  analyzeCode,
  suggestPriority,
  parseMeetingNotes
} = require('../controllers/aiController');

// All AI routes require authentication
router.use(auth);

// Task-specific AI operations
router.post('/tasks/:taskId/generate-subtasks', generateSubtasks);
router.post('/tasks/:taskId/suggest-priority', suggestPriority);

// Standalone AI operations
router.post('/code/analyze', analyzeCode);
router.post('/meeting-notes/parse', parseMeetingNotes);

module.exports = router;
