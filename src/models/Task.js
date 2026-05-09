const mongoose = require('mongoose');
const { deleteFiles } = require('../config/cloudinary');


const attachmentSchema = new mongoose.Schema({
  filename:   { type: String, required: true },
  url:        { type: String, required: true },
  publicId:   { type: String, required: true },
  fileType:   { type: String, required: true },
  size:       { type: Number, required: true }, 
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true }); 


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
  attachments: [attachmentSchema],
}, {
  timestamps: true,
});



taskSchema.pre(['findOneAndDelete', 'deleteOne'], { document: false, query: true }, async function () {
  const task = await this.model.findOne(this.getFilter());
  if (task && task.attachments.length > 0) {
    const publicIds = task.attachments.map(a => a.publicId);
    await deleteFiles(publicIds);
  }
});

module.exports = mongoose.model('Task', taskSchema);

