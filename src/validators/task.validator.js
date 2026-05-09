const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  project: z.string().regex(objectIdRegex, 'Invalid project ObjectId').optional(),
  assignedTo: z.string().regex(objectIdRegex, 'Invalid assignedTo ObjectId').optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional()
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  project: z.string().regex(objectIdRegex, 'Invalid project ObjectId').optional(),
  assignedTo: z.string().regex(objectIdRegex, 'Invalid assignedTo ObjectId').optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional()
});

module.exports = {
  createTaskSchema,
  updateTaskSchema
};
