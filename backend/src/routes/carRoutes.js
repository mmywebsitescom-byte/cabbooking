import { Router } from 'express';
import { getCars, getCar, checkAvailability, createCar, updateCar, deleteCar, getAllCarsAdmin } from '../controllers/carController.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = Router();

router.get('/', getCars);
router.get('/admin/all', protect, adminOnly, getAllCarsAdmin);
router.get('/:id', getCar);
router.get('/:id/availability', checkAvailability);
router.post('/', protect, adminOnly, createCar);
router.put('/:id', protect, adminOnly, updateCar);
router.delete('/:id', protect, adminOnly, deleteCar);

export default router;
