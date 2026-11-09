const { User } = require('../models');
const { signToken, createError } = require('../middleware');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email already registered'
    });
  }

  const user = await User.create({
    name,
    email,
    passwordHash: password,
    phone
  });

  res.status(201).json({
    success: true,
    data: {
      message: 'Account created successfully'
    }
  });
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const token = signToken({
    userId: user._id,
    role: user.role
  });

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.userId).select('-passwordHash');

  if (!user) {
    return next(createError(404, 'User not found'));
  }

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-passwordHash');

  if (!user) {
    return next(createError(404, 'User not found'));
  }

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
