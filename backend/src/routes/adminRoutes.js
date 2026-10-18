import { Router } from 'express';
import { getPublicSettings, getAllSettings, updateSettings } from '../controllers/settingsController.js';
import { getDashboardStats, getAllBookings, updateBookingStatus } from '../controllers/bookingController.js';
import { getAllCarsAdmin } from '../controllers/carController.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = Router();

// Public
router.get('/settings/public', getPublicSettings);

// Admin settings
router.get('/admin/settings', protect, adminOnly, getAllSettings);
router.put('/admin/settings', protect, adminOnly, updateSettings);

// Admin dashboard
router.get('/admin/dashboard', protect, adminOnly, getDashboardStats);
router.get('/admin/bookings', protect, adminOnly, getAllBookings);
router.put('/admin/bookings/:id/status', protect, adminOnly, updateBookingStatus);
router.get('/admin/cars', protect, adminOnly, getAllCarsAdmin);

// Admin users
router.get('/admin/users', protect, adminOnly, asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'customer' }).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
}));

router.put('/admin/users/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, data: user });
}));

export default router;
