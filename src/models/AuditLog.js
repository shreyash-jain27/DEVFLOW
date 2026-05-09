const mongoose = require('mongoose');



const auditLogSchema = new mongoose.Schema(
  {
    
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      default: null,
    },

    
    action: {
      type: String,
      enum: [
        'REGISTER',
        'LOGIN',
        'LOGOUT',
        'LOGIN_FAILED',
        'ACCOUNT_LOCKED',
        'PASSWORD_RESET',
        'CREATE',
        'UPDATE',
        'DELETE',
      ],
      required: true,
    },

    
    resource: {
      type:    String,
      default: null,
    },

    
    resourceId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
    },

    
    ip:        { type: String, default: null },
    userAgent: { type: String, default: null },

    
    requestId: { type: String, default: null },

    
    meta: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    
    timestamps: { createdAt: true, updatedAt: false },
  }
);



const TTL_DAYS    = Number(process.env.AUDIT_TTL_DAYS) || 90;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: TTL_SECONDS });


auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
