const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const deleteFile = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    
    console.error(`[Cloudinary] Failed to delete asset: ${publicId}`, err.message);
  }
};


const deleteFiles = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) return;
  await Promise.allSettled(publicIds.map(deleteFile));
};

module.exports = { cloudinary, deleteFile, deleteFiles };
