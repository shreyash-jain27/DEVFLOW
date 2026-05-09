const Task = require('../models/Task');
const { deleteFile } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');




const uploadAttachments = async (req, res, next) => {
  try {
    
    const task = req.task || await Task.findById(req.params.id);
    if (!task) return next(new ApiError(404, 'Task not found'));

    if (!req.files || req.files.length === 0) {
      return next(new ApiError(400, 'No files were uploaded'));
    }

    
    const remaining = 5 - task.attachments.length;
    if (remaining <= 0) {
      return next(new ApiError(400, 'This task already has the maximum of 5 attachments'));
    }
    if (req.files.length > remaining) {
      return next(new ApiError(400, `You can only add ${remaining} more attachment(s) to this task`));
    }

    
    const newAttachments = req.files.map((file) => ({
      filename:   file.originalname,
      url:        file.path,          
      publicId:   file.filename,      
      fileType:   file.mimetype,
      size:       file.size,
      uploadedBy: req.user._id,
    }));

    task.attachments.push(...newAttachments);
    await task.save();

    res.status(201).json(
      new ApiResponse(201, task.attachments, 'Attachments uploaded successfully')
    );
  } catch (error) {
    next(error);
  }
};




const getAttachments = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('attachments.uploadedBy', 'name email avatar');
    if (!task) return next(new ApiError(404, 'Task not found'));

    res.status(200).json(
      new ApiResponse(200, task.attachments, 'Attachments retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};




const deleteAttachment = async (req, res, next) => {
  try {
    const task = req.task || await Task.findById(req.params.id);
    if (!task) return next(new ApiError(404, 'Task not found'));

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) return next(new ApiError(404, 'Attachment not found'));

    
    const isUploader = attachment.uploadedBy?.toString() === req.user._id.toString();
    const memberEntry = req.project?.members.find(m => m.user.toString() === req.user._id.toString());
    const isAdmin = req.project?.owner.toString() === req.user._id.toString() || memberEntry?.role === 'admin';

    if (!isUploader && !isAdmin) {
      return next(new ApiError(403, 'You are not authorized to delete this attachment'));
    }

    
    await deleteFile(attachment.publicId);
    task.attachments.pull(attachment._id);
    await task.save();

    res.status(200).json(
      new ApiResponse(200, null, 'Attachment deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadAttachments, getAttachments, deleteAttachment };
