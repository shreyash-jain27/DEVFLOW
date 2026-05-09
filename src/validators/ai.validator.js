const { z } = require('zod');

const meetingNotesSchema = z.object({
  notes: z.string().min(10, 'Notes must be at least 10 characters').max(5000, 'Notes cannot exceed 5000 characters')
});

const codeAnalysisSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.string().optional()
});

module.exports = {
  meetingNotesSchema,
  codeAnalysisSchema
};
