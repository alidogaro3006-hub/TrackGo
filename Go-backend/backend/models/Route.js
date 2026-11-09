const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  source: {
    type: String,
    required: [true, 'Source is required'],
    trim: true,
    uppercase: true
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
    uppercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

routeSchema.index({ source: 1, destination: 1 }, { unique: true });

routeSchema.pre('validate', function(next) {
  if (this.source === this.destination) {
    next(new Error('Source and destination cannot be the same'));
  } else {
    next();
  }
});

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
