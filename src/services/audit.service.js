const AuditLog = require('../models/AuditLog');
const logger   = require('../utils/logger');


const audit = (req, action, resource = null, resourceId = null, meta = null) => {
  
  const entry = {
    userId:     req.user?._id ?? req.user?.id ?? null,
    action,
    resource,
    resourceId: resourceId || null,
    ip:         req.ip || req.headers['x-forwarded-for'] || null,
    userAgent:  req.headers['user-agent'] || null,
    requestId:  req.id || null,
    meta,
  };

  
  AuditLog.create(entry).catch((err) => {
    logger.error(`[Audit] Failed to write audit log (action: ${action}): ${err.message}`, {
      requestId: req.id,
      entry,
    });
  });
};

module.exports = { audit };
