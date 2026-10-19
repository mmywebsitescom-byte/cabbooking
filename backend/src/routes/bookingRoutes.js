import { Router } from 'express';
import {
  createBooking, getMyBookings, getBooking, getBookingByBookingId,
  cancelBooking, createPaymentOrder, verifyPayment, confirmCashBooking,
  verifySecretCodeAndDeliverCar,
  getAllBookings, updateBookingStatus, getDashboardStats
} from '../controllers/bookingController.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = Router();

// Customer
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/id/:bookingId', protect, getBookingByBookingId);
router.get('/:id', protect, getBooking);
router.post('/:id/cancel', protect, cancelBooking);
router.post('/:id/payment/create-order', protect, createPaymentOrder);
router.post('/:id/payment/verify', protect, verifyPayment);
router.post('/:id/verify-code', protect, verifySecretCodeAndDeliverCar);

// Admin
router.get('/', protect, adminOnly, getAllBookings);
router.put('/:id/status', protect, adminOnly, updateBookingStatus);
router.post('/:id/cash-confirm', protect, adminOnly, confirmCashBooking);
router.get('/admin/dashboard', protect, adminOnly, getDashboardStats);

export default router;
