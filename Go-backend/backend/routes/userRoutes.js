const express = require('express');
const { body } = require('express-validator');
const { auth, validate } = require('../middleware');
const { register, login, getProfile, updateProfile } = require('../controllers/userController');

const router = express.Router();

router.post('/register', validate([
  body('name').notEmpty().withMessage('Name is required').isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required').toLowerCase(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters').matches(/(?=.*[A-Z])(?=.*[0-9])/).withMessage('Password must contain at least one uppercase letter and one number'),
  body('phone').matches(/^0[0-9]{10}$/).withMessage('Phone number must be 11 digits starting with 0'),
]), register);

router.post('/login', validate([
  body('email').isEmail().withMessage('Valid email is required').toLowerCase(),
  body('password').notEmpty().withMessage('Password is required')
]), login);

router.get('/profile', auth, getProfile);

router.put('/profile', auth, validate([
  body('name').optional().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('phone').optional().matches(/^0[0-9]{10}$/).withMessage('Phone number must be 11 digits starting with 0')
]), updateProfile);

module.exports = router;
