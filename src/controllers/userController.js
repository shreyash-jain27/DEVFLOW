const User = require('../models/User');
const { deleteFile } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');




const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ApiError(400, 'No image file was provided'));
    }

    const user = await User.findById(req.user._id);
    if (!user) return next(new ApiError(404, 'User not found'));

    
    if (user.avatar?.publicId) {
      await deleteFile(user.avatar.publicId);
    }

    
    user.avatar = {
      url:      req.file.path,     
      publicId: req.file.filename, 
    };
    await user.save();

    res.status(200).json(
      new ApiResponse(200, { avatar: user.avatar }, 'Avatar updated successfully')
    );
  } catch (error) {
    next(error);
  }
};




const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshTokens');
    if (!user) return next(new ApiError(404, 'User not found'));

    res.status(200).json(new ApiResponse(200, user, 'Profile retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = { updateAvatar, getMe };
