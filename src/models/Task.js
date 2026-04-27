const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'done'],
    default: 'todo',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  dueDate: {
    type: Date,
  },
  tags: [{
    type: String,
  }],
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  aiSuggestions: {
    suggestedPriority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    estimatedHours: {
      type: Number,
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt fields
});

module.exports = mongoose.model('Task', taskSchema);
