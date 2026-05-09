const mongoose = require('mongoose');


const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS   = 2 * 60 * 60 * 1000; 

const userSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
  },
  email: {
    type:     String,
    required: true,
    unique:   true,
  },
  password: {
    type:     String,
    required: true,
  },
  role: {
    type:    String,
    enum:    ['admin', 'member', 'viewer'],
    default: 'member',
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Team',
  },
  refreshTokens: [
    {
      token: String,
      createdAt: {
        type:    Date,
        default: Date.now,
      },
    },
  ],
  avatar: {
    url:      { type: String, default: null },
    publicId: { type: String, default: null },
  },
  passwordResetToken:   { type: String, default: null },
  passwordResetExpires: { type: Date,   default: null },

  
  
  loginAttempts: { type: Number, default: 0 },
  
  lockUntil:     { type: Date,   default: null },

  createdAt: {
    type:    Date,
    default: Date.now,
  },
});



userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});



userSchema.methods.incrementLoginAttempts = async function () {
  
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set:   { loginAttempts: 1 },
      $unset: { lockUntil: '' },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }

  return this.updateOne(updates);
};



userSchema.methods.resetLoginAttempts = async function () {
  if (this.loginAttempts === 0 && !this.lockUntil) return; 

  return this.updateOne({
    $set:   { loginAttempts: 0 },
    $unset: { lockUntil: '' },
  });
};

module.exports = mongoose.model('User', userSchema);
