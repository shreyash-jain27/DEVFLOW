const crypto = require('crypto');
const redis = require('../config/redis');
const logger = require('./logger');



const generateKey = (...parts) => parts.join(':');


const hashQuery = (queryObj) => {
  const str = JSON.stringify(queryObj, Object.keys(queryObj).sort());
  return crypto.createHash('md5').update(str).digest('hex').slice(0, 8);
};



const get = async (key) => {
  try {
    const raw = await redis.get(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (err) {
    logger.warn(`[Cache] GET error for key "${key}": ${err.message}`);
    return null; 
  }
};



const set = async (key, data, ttlSeconds = 300) => {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn(`[Cache] SET error for key "${key}": ${err.message}`);
  }
};



const del = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn(`[Cache] DEL error for key "${key}": ${err.message}`);
  }
};



const delByPattern = async (pattern) => {
  try {
    let cursor = '0';
    const pipeline = redis.pipeline ? redis.pipeline() : null;
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        deletedCount += keys.length;
        if (pipeline) {
          keys.forEach((k) => pipeline.del(k));
        } else {
          
          await Promise.all(keys.map((k) => redis.del(k)));
        }
      }
    } while (cursor !== '0');

    if (pipeline && deletedCount > 0) {
      await pipeline.exec();
    }

    if (deletedCount > 0) {
      logger.info(`[Cache] Deleted ${deletedCount} keys matching "${pattern}"`);
    }
  } catch (err) {
    logger.warn(`[Cache] delByPattern error for "${pattern}": ${err.message}`);
  }
};

module.exports = { get, set, del, delByPattern, generateKey, hashQuery };
