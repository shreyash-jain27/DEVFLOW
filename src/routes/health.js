const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redis = require('../config/redis');




router.get('/', async (req, res) => {
  
  
  
  const dbState   = mongoose.connection.readyState;
  const dbStatus  = dbState === 1 ? 'connected' : 'disconnected';

  
  
  
  let redisStatus = 'disconnected';
  try {
    
    redisStatus = redis.status === 'ready' ? 'connected' : redis.status;
  } catch {
    redisStatus = 'disconnected';
  }

  
  
  
  const isHealthy = dbState === 1;

  const payload = {
    status:    isHealthy ? 'ok' : 'degraded',
    uptime:    process.uptime(),           
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis:    redisStatus,
    },
  };

  
  return res.status(isHealthy ? 200 : 503).json(payload);
});

module.exports = router;
