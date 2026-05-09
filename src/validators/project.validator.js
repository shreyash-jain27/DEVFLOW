const { z } = require('zod');

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  team: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')).optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

module.exports = {
  createProjectSchema
};
