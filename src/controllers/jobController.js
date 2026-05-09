const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { aiQueue, emailQueue, cleanupQueue } = require('../config/queues');


const ALL_QUEUES = [
  { queue: aiQueue,      name: 'ai' },
  { queue: emailQueue,   name: 'email' },
  { queue: cleanupQueue, name: 'cleanup' },
];


const formatJob = async (job, queueName) => {
  const state = await job.getState(); 

  return {
    jobId:       job.id,
    jobName:     job.name,
    queue:       queueName,
    status:      state,
    progress:    job.progress(),
    result:      state === 'completed' ? job.returnvalue  : null,
    failReason:  state === 'failed'    ? job.failedReason : null,
    attempts:    job.attemptsMade,
    createdAt:   job.timestamp   ? new Date(job.timestamp).toISOString()   : null,
    processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
    finishedAt:  job.finishedOn  ? new Date(job.finishedOn).toISOString()  : null,
  };
};




const getJobStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    
    for (const { queue, name } of ALL_QUEUES) {
      const job = await queue.getJob(jobId);

      if (job) {
        const formatted = await formatJob(job, name);
        return res.status(200).json(new ApiResponse(200, formatted, 'Job status retrieved'));
      }
    }

    return next(new ApiError(404, `Job "${jobId}" not found in any queue`));
  } catch (error) {
    next(error);
  }
};

module.exports = { getJobStatus };
