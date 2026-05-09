const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const redis = require('../config/redis');


router.use(auth);


router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
});




router.get('/cache-stats', async (req, res, next) => {
  try {
    
    const infoRaw = await redis.info('stats');

    
    const parse = (str, field) => {
      const match = str.match(new RegExp(`${field}:(\\d+)`));
      return match ? parseInt(match[1], 10) : 0;
    };

    const hits   = parse(infoRaw, 'keyspace_hits');
    const misses = parse(infoRaw, 'keyspace_misses');
    const total  = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : '0.00';

    
    const memInfo = await redis.info('memory');
    const usedMemory     = parse(memInfo, 'used_memory');
    const usedMemoryHuman = memInfo.match(/used_memory_human:(\S+)/)?.[1] ?? 'N/A';

    
    const dbInfo = await redis.info('keyspace');
    const keysMatch = dbInfo.match(/keys=(\d+)/);
    const totalKeys = keysMatch ? parseInt(keysMatch[1], 10) : 0;

    const stats = {
      hits,
      misses,
      total,
      hitRate: `${hitRate}%`,
      totalKeys,
      memory: {
        usedBytes: usedMemory,
        human:     usedMemoryHuman,
      },
      redisStatus: redis.status ?? 'unknown',
    };

    res.status(200).json(new ApiResponse(200, stats, 'Cache statistics retrieved'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
