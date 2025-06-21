// Models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String }, // ← nouveau champ
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  codeExpiration: { type: Date }
}, {
  collection: 'Registered'
});

module.exports = mongoose.model('User', UserSchema);
