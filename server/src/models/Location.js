const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  isLive: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Automatically delete after 24 hours
locationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Location', locationSchema);
