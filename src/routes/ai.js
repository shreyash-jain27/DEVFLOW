const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
  generateSubtasks,
  analyzeCode,
  suggestPriority,
  parseMeetingNotes
} = require('../controllers/aiController');
const { getJobStatus } = require('../controllers/jobController');

const validate = require('../middlewares/validate');
const { meetingNotesSchema, codeAnalysisSchema } = require('../validators/ai.validator');


router.use(auth);



router.get('/jobs/:jobId', getJobStatus);


router.post('/tasks/:taskId/generate-subtasks', generateSubtasks);
router.post('/tasks/:taskId/suggest-priority',  suggestPriority);


router.post('/code/analyze',        validate(codeAnalysisSchema),   analyzeCode);
router.post('/meeting-notes/parse', validate(meetingNotesSchema),   parseMeetingNotes);

module.exports = router;

