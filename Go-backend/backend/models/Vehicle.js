const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: {
      values: ['bus', 'train'],
      message: 'Vehicle type must be either bus or train'
    }
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [10, 'Capacity must be at least 10'],
    max: [500, 'Capacity cannot exceed 500']
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
