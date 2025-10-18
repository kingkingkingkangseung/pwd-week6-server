// src/models/user.model.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: null },
    provider: { type: String, enum: ['local', 'google', 'naver'], default: 'local', index: true },
    providerId: { type: String, default: null, index: true },
    password: { type: String, select: false },
    userType: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

function hashPassword(plain) {
  const iterations = 120000;
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (stored.startsWith('pbkdf2$')) {
    const [, iterStr, salt, hash] = stored.split('$');
    const iterations = parseInt(iterStr, 10) || 120000;
    const calc = crypto.pbkdf2Sync(plain, salt, iterations, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(calc, 'hex'), Buffer.from(hash, 'hex'));
  }
  return plain === stored;
}

UserSchema.pre('save', function (next) {
  if (this.provider === 'local' && this.isModified('password') && this.password && !String(this.password).startsWith('pbkdf2$')) {
    this.password = hashPassword(this.password);
  }
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (this.provider !== 'local') return false;
  if (this.password == null) {
    const fresh = await this.constructor.findById(this._id).select('+password');
    if (!fresh || fresh.password == null) return false;
    return verifyPassword(candidatePassword, fresh.password);
  }
  return verifyPassword(candidatePassword, this.password);
};

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

UserSchema.set('toObject', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);

