const express = require('express');
const { body, query } = require('express-validator');
const { auth, validate } = require('../middleware');
const {
  searchSchedules,
  createBooking,
  cancelBooking,
  getMyBookings,
  getScheduleById
} = require('../controllers/bookingController');

const router = express.Router();

router.get('/search', validate([
  query('source').notEmpty().withMessage('Source is required'),
  query('destination').notEmpty().withMessage('Destination is required'),
  query('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Valid date is required'),
  query('vehicleType').optional().isIn(['bus', 'train', 'all']).withMessage('Vehicle type must be bus, train, or all')
]), searchSchedules);

router.post('/', auth, validate([
  body('scheduleId').isMongoId().withMessage('Valid schedule ID is required'),
  body('seats').isArray({ min: 1 }).withMessage('At least one seat must be selected'),
  body('seats.*').isInt({ min: 1 }).withMessage('Each seat must be a positive integer')
]), createBooking);

router.put('/:id/cancel', auth, cancelBooking);

router.get('/my', auth, getMyBookings);

router.get('/schedule/:id', auth, getScheduleById);

module.exports = router;
