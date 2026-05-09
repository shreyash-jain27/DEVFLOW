const { get, set } = require('../utils/cache');


const cacheMiddleware = (keyFn, ttl = 300) => async (req, res, next) => {
  
  if (req.method !== 'GET') return next();

  const key = keyFn(req);

  
  const cached = await get(key);

  if (cached !== null) {
    res.setHeader('x-cache', 'HIT');
    res.setHeader('x-cache-key', key);
    return res.status(200).json(cached);
  }

  
  res.setHeader('x-cache', 'MISS');
  res.setHeader('x-cache-key', key);

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      set(key, body, ttl); 
    }
    
    res.json = originalJson;
    return originalJson(body);
  };

  next();
};

module.exports = cacheMiddleware;
