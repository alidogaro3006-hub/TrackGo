const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Route is required']
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  departureTime: {
    type: String,
    required: [true, 'Departure time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]\d|2[0-3]):[0-5]\d$/.test(v);
      },
      message: 'Departure time must be in HH:MM format (24-hour)'
    }
  },
  arrivalTime: {
    type: String,
    required: [true, 'Arrival time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]\d|2[0-3]):[0-5]\d$/.test(v);
      },
      message: 'Arrival time must be in HH:MM format (24-hour)'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  bookedSeats: {
    type: [Number],
    default: []
  }
});

scheduleSchema.index({ routeId: 1, date: 1 });
scheduleSchema.index(
  { routeId: 1, vehicleId: 1, date: 1, departureTime: 1 },
  { unique: true }
);

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
