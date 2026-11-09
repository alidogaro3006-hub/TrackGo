const express = require('express');
const { body, query } = require('express-validator');
const { auth, requireRole, validate } = require('../middleware');
const {
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
} = require('../controllers/adminController');

const router = express.Router();

router.post('/routes', auth, requireRole('admin'), validate([
  body('source').notEmpty().withMessage('Source is required'),
  body('destination').notEmpty().withMessage('Destination is required')
]), createRoute);

router.get('/routes', auth, requireRole('admin'), getRoutes);

router.put('/routes/:id', auth, requireRole('admin'), validate([
  body('source').notEmpty().withMessage('Source is required'),
  body('destination').notEmpty().withMessage('Destination is required')
]), updateRoute);

router.delete('/routes/:id', auth, requireRole('admin'), deleteRoute);

router.post('/vehicles', auth, requireRole('admin'), validate([
  body('type').isIn(['bus', 'train']).withMessage('Type must be either bus or train'),
  body('capacity').isInt({ min: 10, max: 500 }).withMessage('Capacity must be between 10 and 500'),
  body('registrationNumber').notEmpty().withMessage('Registration number is required')
]), createVehicle);

router.get('/vehicles', auth, requireRole('admin'), getVehicles);

router.put('/vehicles/:id', auth, requireRole('admin'), validate([
  body('type').isIn(['bus', 'train']).withMessage('Type must be either bus or train'),
  body('capacity').isInt({ min: 10, max: 500 }).withMessage('Capacity must be between 10 and 500'),
  body('registrationNumber').notEmpty().withMessage('Registration number is required')
]), updateVehicle);

router.delete('/vehicles/:id', auth, requireRole('admin'), deleteVehicle);

router.post('/schedules', auth, requireRole('admin'), validate([
  body('routeId').isMongoId().withMessage('Valid route ID is required'),
  body('vehicleId').isMongoId().withMessage('Valid vehicle ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('departureTime').matches(/^([0-1]\d|2[0-3]):[0-5]\d$/).withMessage('Departure time must be in HH:MM format'),
  body('arrivalTime').matches(/^([0-1]\d|2[0-3]):[0-5]\d$/).withMessage('Arrival time must be in HH:MM format'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
]), createSchedule);

router.get('/schedules', auth, requireRole('admin'), getSchedules);

router.put('/schedules/:id', auth, requireRole('admin'), validate([
  body('routeId').optional().isMongoId().withMessage('Valid route ID is required'),
  body('vehicleId').optional().isMongoId().withMessage('Valid vehicle ID is required'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('departureTime').optional().matches(/^([0-1]\d|2[0-3]):[0-5]\d$/).withMessage('Departure time must be in HH:MM format'),
  body('arrivalTime').optional().matches(/^([0-1]\d|2[0-3]):[0-5]\d$/).withMessage('Arrival time must be in HH:MM format'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
]), updateSchedule);

router.delete('/schedules/:id', auth, requireRole('admin'), deleteSchedule);

router.get('/bookings', auth, requireRole('admin'), getAllBookings);

module.exports = router;
