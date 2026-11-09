const mongoose = require('mongoose');
const { Route, Vehicle, Schedule, Booking } = require('../models');
const { createError } = require('../middleware');
const asyncHandler = require('../utils/asyncHandler');

const searchSchedules = asyncHandler(async (req, res, next) => {
  const { source, destination, date, vehicleType } = req.query;

  if (!source || !destination || !date) {
    return res.status(400).json({
      success: false,
      message: 'Source, destination, and date are required'
    });
  }

  const routes = await Route.find({
    source: source.toUpperCase(),
    destination: destination.toUpperCase()
  });

  if (routes.length === 0) {
    return res.status(200).json({
      success: true,
      data: { schedules: [] }
    });
  }

  const routeIds = routes.map(r => r._id);

  const searchDate = new Date(date);
  const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

  const query = {
    routeId: { $in: routeIds },
    date: { $gte: startOfDay, $lte: endOfDay }
  };

  if (vehicleType && vehicleType !== 'all') {
    const vehicles = await Vehicle.find({ type: vehicleType });
    const vehicleIds = vehicles.map(v => v._id);
    query.vehicleId = { $in: vehicleIds };
  }

  const schedules = await Schedule.find(query)
    .populate('routeId')
    .populate('vehicleId')
    .sort({ departureTime: 1 });

  const schedulesWithAvailableSeats = schedules.map(schedule => {
    const scheduleObj = schedule.toObject();
    scheduleObj.availableSeats = schedule.vehicleId.capacity - schedule.bookedSeats.length;
    return scheduleObj;
  });

  res.status(200).json({
    success: true,
    data: {
      schedules: schedulesWithAvailableSeats
    }
  });
});

const createBooking = asyncHandler(async (req, res, next) => {
  const { scheduleId, seats } = req.body;

  const schedule = await Schedule.findById(scheduleId).populate('vehicleId');

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found'
    });
  }

  const uniqueSeats = new Set(seats);
  if (uniqueSeats.size !== seats.length) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate seat numbers are not allowed'
    });
  }

  const capacity = schedule.vehicleId.capacity;
  const invalidSeats = seats.filter(seat => seat < 1 || seat > capacity);
  if (invalidSeats.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Invalid seat number(s): ${invalidSeats.join(', ')}. Valid range is 1-${capacity}`
    });
  }

  const seatConflicts = seats.filter(seat => schedule.bookedSeats.includes(seat));
  if (seatConflicts.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'One or more seats are already booked. Please reselect.'
    });
  }

  const updatedSchedule = await Schedule.findOneAndUpdate(
    {
      _id: scheduleId,
      bookedSeats: { $not: { $elemMatch: { $in: seats } } }
    },
    {
      $push: { bookedSeats: { $each: seats } }
    },
    { new: true }
  );

  if (!updatedSchedule) {
    return res.status(409).json({
      success: false,
      message: 'One or more seats are already booked. Please reselect.'
    });
  }

  const totalPrice = seats.length * schedule.price;

  const booking = await Booking.create({
    userId: req.user.userId,
    scheduleId,
    seats,
    totalPrice,
    status: 'confirmed'
  });

  res.status(201).json({
    success: true,
    data: {
      booking
    }
  });
});

const cancelBooking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(createError(400, 'Invalid booking ID'));
  }

  const booking = await Booking.findById(id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to cancel this booking'
    });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Booking is already cancelled'
    });
  }

  await Schedule.findByIdAndUpdate(
    booking.scheduleId,
    {
      $pull: { bookedSeats: { $in: booking.seats } }
    }
  );

  booking.status = 'cancelled';
  await booking.save();

  res.status(200).json({
    success: true,
    data: {
      message: 'Booking cancelled successfully',
      booking
    }
  });
});

const getMyBookings = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({ userId: req.user.userId })
    .populate({
      path: 'scheduleId',
      populate: [
        { path: 'routeId' },
        { path: 'vehicleId' }
      ]
    })
    .sort({ bookingDate: -1 });

  res.status(200).json({
    success: true,
    data: {
      bookings
    }
  });
});

const getScheduleById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(createError(400, 'Invalid schedule ID'));
  }

  const schedule = await Schedule.findById(id)
    .populate('routeId')
    .populate('vehicleId');

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found'
    });
  }

  const scheduleObj = schedule.toObject();
  scheduleObj.availableSeats = schedule.vehicleId.capacity - schedule.bookedSeats.length;

  res.status(200).json({
    success: true,
    data: { schedule: scheduleObj }
  });
});

module.exports = {
  searchSchedules,
  createBooking,
  cancelBooking,
  getMyBookings,
  getScheduleById
};
