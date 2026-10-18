import { User } from '../models/User.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { generateToken } from '../middlewares/auth.js';

// @POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, dateOfBirth, address } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, error: 'Email already registered' });
  }

  const user = await User.create({ name, email, phone, password, dateOfBirth, address });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token
    }
  });
});

// @POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, error: 'Account is deactivated. Contact support.' });
  }

  const token = generateToken(user._id);
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token
    }
  });
});

// @GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

// @PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, dateOfBirth, drivingLicence } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, address, dateOfBirth, drivingLicence },
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: user, message: 'Profile updated' });
});

// @PUT /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return res.status(400).json({ success: false, error: 'Current password is incorrect' });
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});
