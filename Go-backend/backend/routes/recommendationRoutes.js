const express = require('express');
const { query } = require('express-validator');
const { auth, validate } = require('../middleware');
const { getRecommendations } = require('../controllers/recommendationController');

const router = express.Router();

router.get('/', auth, validate([
  query('source')
    .notEmpty().withMessage('Source is required')
    .trim()
    .isLength({ min: 2 }).withMessage('Source must be at least 2 characters'),
  query('destination')
    .notEmpty().withMessage('Destination is required')
    .trim()
    .isLength({ min: 2 }).withMessage('Destination must be at least 2 characters')
    .custom((value, { req }) => {
      if (value === req.query.source) {
        throw new Error('Source and destination cannot be the same');
      }
      return true;
    }),
  query('date')
    .notEmpty().withMessage('Date is required')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (inputDate < today) {
        throw new Error('Date cannot be in the past');
      }
      return true;
    })
]), getRecommendations);

module.exports = router;
