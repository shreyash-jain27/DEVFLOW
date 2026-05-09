

const { deleteFile } = require('../config/cloudinary');
const logger = require('../utils/logger');

const cleanupProcessor = async (job) => {
  const { publicIds = [] } = job.data;

  if (publicIds.length === 0) {
    logger.warn(`[Cleanup Processor] Job ${job.id} received no publicIds — skipping`);
    return { deleted: 0 };
  }

  logger.info(`[Cleanup Processor] Job ${job.id} — deleting ${publicIds.length} file(s) from Cloudinary`);

  const results = await Promise.allSettled(
    publicIds.map((id) => deleteFile(id))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed    = results.filter((r) => r.status === 'rejected');

  failed.forEach((f, i) => {
    logger.error(`[Cleanup Processor] Failed to delete publicId "${publicIds[i]}": ${f.reason?.message}`);
  });

  if (failed.length > 0) {
    
    
    throw new Error(`${failed.length}/${publicIds.length} Cloudinary deletions failed`);
  }

  logger.info(`[Cleanup Processor] Job ${job.id} — deleted ${succeeded} file(s) successfully`);
  return { deleted: succeeded };
};

module.exports = cleanupProcessor;
