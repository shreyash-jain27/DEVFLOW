const Bull = require('bull');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';




if (process.env.NODE_ENV === 'test') {
  const makeMockQueue = (name) => ({
    name,
    add:    async (_jobName, _data, _opts) => ({ id: 'mock-job-id', name: _jobName }),
    process: () => {},
    getJob: async () => ({
      id:          'mock-job-id',
      name:        'mock',
      getState:    async () => 'completed',
      returnvalue: { mocked: true },
      failedReason: null,
      timestamp:   Date.now(),
      processedOn: Date.now(),
      finishedOn:  Date.now(),
      progress:    () => 100,
    }),
    on:     () => {},
    close:  async () => {},
  });

  const AI_JOB_OPTIONS      = {};
  const EMAIL_JOB_OPTIONS   = {};
  const CLEANUP_JOB_OPTIONS = {};

  module.exports = {
    aiQueue:      makeMockQueue('ai'),
    emailQueue:   makeMockQueue('email'),
    cleanupQueue: makeMockQueue('cleanup'),
    AI_JOB_OPTIONS,
    EMAIL_JOB_OPTIONS,
    CLEANUP_JOB_OPTIONS,
  };
} else {


const redisConfig = { url: redisUrl };




const AI_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  timeout: 30_000,
  removeOnComplete: { count: 100 },         
  removeOnFail:     { age: 7 * 24 * 3600 }, 
};


const EMAIL_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'fixed', delay: 5000 },
  removeOnComplete: { age: 24 * 3600 },
  removeOnFail:     { age: 7 * 24 * 3600 },
};


const CLEANUP_JOB_OPTIONS = {
  attempts: 2,
  backoff: { type: 'fixed', delay: 3000 },
  removeOnComplete: { age: 3600 },
  removeOnFail:     { age: 7 * 24 * 3600 },
};


const createQueue = (name) => {
  
  const redisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 500, 5000),
  };

  const q = new Bull(name, redisUrl, { 
    redis: redisOptions
  });

  q.on('error',          (err)  => logger.error(`[${name} queue] Error: ${err.message}`));
  q.on('waiting',        (id)   => logger.info(`[${name} queue] Job ${id} waiting`));
  q.on('active',         (job)  => logger.info(`[${name} queue] Job ${job.id} (${job.name}) active`));
  q.on('completed',      (job)  => logger.info(`[${name} queue] Job ${job.id} (${job.name}) completed`));
  q.on('failed',  (job, err)    => logger.error(`[${name} queue] Job ${job.id} (${job.name}) failed: ${err.message}`));
  q.on('stalled',        (job)  => logger.warn(`[${name} queue] Job ${job.id} stalled`));

  return q;
};

const aiQueue      = createQueue('devflow:ai');
const emailQueue   = createQueue('devflow:email');
const cleanupQueue = createQueue('devflow:cleanup');

module.exports = {
  aiQueue,
  emailQueue,
  cleanupQueue,
  AI_JOB_OPTIONS,
  EMAIL_JOB_OPTIONS,
  CLEANUP_JOB_OPTIONS,
};
}

