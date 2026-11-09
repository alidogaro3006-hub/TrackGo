const mongoose = require('mongoose');
const { Route, Vehicle, Schedule, Booking } = require('../models');
const { createError } = require('../middleware');
const asyncHandler = require('../utils/asyncHandler');

const createRoute = asyncHandler(async (req, res, next) => {
  const { source, destination } = req.body;

  if (source.toUpperCase() === destination.toUpperCase()) {
    return res.status(400).json({
      success: false,
      message: 'Source and destination cannot be the same'
    });
  }

  const existingRoute = await Route.findOne({
    source: source.toUpperCase(),
    destination: destination.toUpperCase()
  });

  if (existingRoute) {
    return res.status(409).json({
      success: false,
      message: 'Route already exists'
    });
  }

  const route = await Route.create({ source, destination });

  res.status(201).json({
    success: true,
    data: { route }
  });
});

const getRoutes = asyncHandler(async (req, res, next) => {
  const routes = await Route.find().sort({ source: 1 });

  res.status(200).json({
    success: true,
    data: { routes }
  });
});

const updateRoute = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { source, destination } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(createError(400, 'Invalid route ID'));
  }

  if (source.toUpperCase() === destination.toUpperCase()) {
    return res.status(400).json({
      success: false,
      message: 'Source and destination cannot be the same'
    });
  }

  let route;
  try {
    route = await Route.findByIdAndUpdate(
      id,
      { source, destination },
      { new: true, runValidators: true }
    );
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Route already exists'
      });
    }
    throw err;
  }

  if (!route) {
    return next(createError(404, 'Route not found'));
  }

  res.status(200).json({
    success: true,
    data: { route }
  });
});

const deleteRoute = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(createError(400, 'Invalid route ID'));
  }

  const scheduleOnRoute = await Schedule.findOne({ routeId: id });
  if (scheduleOnRoute) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete route with existing schedules'
    });
  }

  const route = await Route.findByIdAndDelete(id);

  if (!route) {
    return next(createError(404, 'Route not found'));
  }

  res.status(200).json({
    success: true,
    data: { message: 'Route deleted successfully' }
  });
});

const createVehicle = asyncHandler(async (req, res, next) => {
  const { type, capacity, registrationNumber } = req.body;

  const existingVehicle = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });

  if (existingVehicle) {
    return res.status(409).json({
      success: false,
      message: 'Vehicle with this registration number already exists'
    });
  }

  const vehicle = await Vehicle.create({ type, capacity, registrationNumber });

  res.status(201).json({
    success: true,
    data: { vehicle }
  });
});

const getVehicles = asyncHandler(async (req, res, next) => {
  const vehicles = await Vehicle.find();

  res.status(200).json({
    success: true,
    data: { vehicles }
  });
});

const updateVehicle = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { type, capacity, registrationNumber } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(createError(400, 'Invalid vehicle ID'));
  }

  let vehicle;
  try {
    vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { type, capacity, registrationNumber },
      { new: true, runValidators: true }
    );
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this registration number already exists'
      });
    }
    throw err;
  }

  if (!vehicle) {
    return next(createError(404, 'Vehicle not found'));
  }

  res.status(200).json({
    success: true,
    data: { vehicle }
  });
});

const deleteVehicle = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(createError(400, 'Invalid vehicle ID'));
  }

  const scheduleWithVehicle = await Schedule.findOne({ vehicleId: id });
  if (scheduleWithVehicle) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete vehicle with existing schedules'
    });
  }

  const vehicle = await Vehicle.findByIdAndDelete(id);

  if (!vehicle) {
    return next(createError(404, 'Vehicle not found'));
  }

  res.status(200).json({
    success: true,
    data: { message: 'Vehicle deleted successfully' }
  });
});

const createSchedule = asyncHandler(async (req, res, next) => {
  const { routeId, vehicleId, date, departureTime, arrivalTime, price } = req.body;

  const route = await Route.findById(routeId);
  if (!route) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  const scheduleDate = new Date(date);
  if (scheduleDate < new Date(new Date().setHours(0, 0, 0, 0))) {
    return res.status(400).json({
      success: false,
      message: 'Date cannot be in the past'
    });
  }

  const existingSchedule = await Schedule.findOne({
    routeId,
    vehicleId,
    date: scheduleDate,
    departureTime
  });

  if (existingSchedule) {
    return res.status(409).json({
      success: false,
      message: 'Schedule already exists for this route, vehicle, date, and time'
    });
  }

  let schedule;
  try {
    schedule = await Schedule.create({
      routeId,
      vehicleId,
      date: scheduleDate,
      departureTime,
      arrivalTime,
      price
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Schedule already exists for this route, vehicle, date, and time'
      });
    }
    throw err;
  }

  const populatedSchedule = await Schedule.findById(schedule._id)
    .populate('routeId')
    .populate('vehicleId');

  res.status(201).json({
    success: true,
    data: { schedule: populatedSchedule }
  });
});

const getSchedules = asyncHandler(async (req, res, next) => {
  const { source, destination, date, vehicleType } = req.query;

  const query = {};

  if (source || destination) {
    const routeFilter = {};
    if (source) routeFilter.source = source.toUpperCase();
    if (destination) routeFilter.destination = destination.toUpperCase();
    const matchedRoutes = await Route.find(routeFilter);
    query.routeId = { $in: matchedRoutes.map(r => r._id) };
  }

  if (date) {
    const d = new Date(date);
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    query.date = { $gte: start, $lte: end };
  }

  if (vehicleType) {
    const matchedVehicles = await Vehicle.find({ type: vehicleType });
    query.vehicleId = { $in: matchedVehicles.map(v => v._id) };
  }

  const schedules = await Schedule.find(query)
    .populate('routeId')
    .populate('vehicleId')
    .sort({ date: 1, departureTime: 1 });

  res.status(200).json({
    success: true,
    data: { schedules }
  });
});

const updateSchedule = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { routeId, vehicleId, date, departureTime, arrivalTime, price } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(createError(400, 'Invalid schedule ID'));
  }

  if (routeId) {
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
  }

  if (vehicleId) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
  }

  if (date) {
    const scheduleDate = new Date(date);
    if (scheduleDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      return res.status(400).json({
        success: false,
        message: 'Date cannot be in the past'
      });
    }
  }

  const updateData = {};
  if (routeId) updateData.routeId = routeId;
  if (vehicleId) updateData.vehicleId = vehicleId;
  if (date) updateData.date = new Date(date);
  if (departureTime) updateData.departureTime = departureTime;
  if (arrivalTime) updateData.arrivalTime = arrivalTime;
  if (price !== undefined) updateData.price = price;

  const schedule = await Schedule.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('routeId').populate('vehicleId');

  if (!schedule) {
    return next(createError(404, 'Schedule not found'));
  }

  res.status(200).json({
    success: true,
    data: { schedule }
  });
});

const deleteSchedule = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(createError(400, 'Invalid schedule ID'));
  }

  const activeBooking = await Booking.findOne({
    scheduleId: id,
    status: { $in: ['confirmed', 'pending'] }
  });

  if (activeBooking) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete schedule with active bookings'
    });
  }

  const schedule = await Schedule.findByIdAndDelete(id);

  if (!schedule) {
    return next(createError(404, 'Schedule not found'));
  }

  res.status(200).json({
    success: true,
    data: { message: 'Schedule deleted successfully' }
  });
});

const getAllBookings = asyncHandler(async (req, res, next) => {
  const { status } = req.query;

  const query = {};
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('userId', 'name email phone')
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
    data: { bookings }
  });
});

module.exports = {
  createRoute,
  getRoutes,
  updateRoute,
  deleteRoute,
  createVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
  getAllBookings
};
