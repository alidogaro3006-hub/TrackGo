const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: [true, 'Schedule is required']
  },
  seats: {
    type: [Number],
    required: [true, 'At least one seat is required'],
    validate: {
      validator: function(arr) {
        return arr.length >= 1;
      },
      message: 'At least one seat must be selected'
    }
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['confirmed', 'cancelled', 'pending'],
      message: 'Status must be confirmed, cancelled, or pending'
    },
    default: 'confirmed'
  },
  bookingDate: {
    type: Date,
    default: Date.now
  }
});

bookingSchema.index({ userId: 1 });
bookingSchema.index({ scheduleId: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
