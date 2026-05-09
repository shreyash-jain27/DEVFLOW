const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');


const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.js', '.mjs', '.cjs', '.sh', '.bat',
  '.cmd', '.php', '.py', '.rb', '.pl', '.ps1',
]);


const secureFileFilter = (req, file, cb) => {
  const ext = '.' + file.originalname.split('.').pop().toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return cb(new ApiError(400, `File type "${ext}" is not allowed`), false);
  }
  cb(null, true);
};


const attachmentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'devflow/attachments',
      resource_type: isImage ? 'image' : 'raw',
      
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
      
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt'],
    };
  },
});

const taskAttachments = multer({
  storage: attachmentStorage,
  fileFilter: secureFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 5,
  },
}).array('attachments', 5);


const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'devflow/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' }, 
    ],
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new ApiError(400, 'Only image files are allowed for avatars'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024, 
    files: 1,
  },
}).single('avatar');



const handleUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      
      const messages = {
        LIMIT_FILE_SIZE: 'File is too large. Check the size limit for this upload type.',
        LIMIT_FILE_COUNT: 'Too many files. Maximum allowed is 5.',
        LIMIT_UNEXPECTED_FILE: 'Unexpected field name in the upload form.',
      };
      return next(new ApiError(400, messages[err.code] || err.message));
    }

    if (err instanceof ApiError) {
      return next(err); 
    }

    
    next(new ApiError(500, 'An error occurred during file upload'));
  });
};

module.exports = { taskAttachments, avatarUpload, handleUpload };
