

const { aiQueue, emailQueue, cleanupQueue } = require('../config/queues');
const aiProcessor      = require('./ai.processor');
const emailProcessor   = require('./email.processor');
const cleanupProcessor = require('./cleanup.processor');
const logger           = require('../utils/logger');

const bootstrapJobs = () => {
  
  aiQueue.process(2,      aiProcessor);
  emailQueue.process(5,   emailProcessor);
  cleanupQueue.process(3, cleanupProcessor);

  logger.info('[Jobs] All queue processors registered');
};

module.exports = bootstrapJobs;
