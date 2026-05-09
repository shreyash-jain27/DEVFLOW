const Redis = require('ioredis');
const logger = require('../utils/logger');




if (process.env.NODE_ENV === 'test') {
  const mock = {
    status: 'ready',
    get:    async () => null,
    set:    async () => 'OK',
    del:    async () => 1,
    scan:   async () => ['0', []],
    info:   async () => '',
    on:     function() { return this; },
    quit:   async () => {},
    pipeline: () => ({
      del:  function() { return this; },
      exec: async () => [],
    }),
  };
  module.exports = mock;
} else {

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client = new Redis(redisUrl, {
  
  retryStrategy: (times) => {
    
    if (times > 10) {
      logger.error('[Redis] Connection failing repeatedly. Some features (queues, rate limiting) will be impaired.');
      return null; 
    }
    return Math.min(times * 500, 5000); 
  },
  lazyConnect: true, 
  maxRetriesPerRequest: null, 
  connectTimeout: 5000,
});

client.on('connect',      () => logger.info('[Redis] Connected'));
client.on('ready',        () => logger.info('[Redis] Ready'));
client.on('error',  (err) => logger.error(`[Redis] Error: ${err.message}`));
client.on('close',        () => logger.warn('[Redis] Connection closed'));
client.on('reconnecting', () => logger.warn('[Redis] Reconnecting…'));

module.exports = client;
}
