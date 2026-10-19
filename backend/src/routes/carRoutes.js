import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { getCars, getCar, checkAvailability, createCar, updateCar, deleteCar, getAllCarsAdmin } from '../controllers/carController.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `car_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are permitted'));
    }
  }
});

const router = Router();

router.get('/', getCars);
router.get('/admin/all', protect, adminOnly, getAllCarsAdmin);
router.get('/:id', getCar);
router.get('/:id/availability', checkAvailability);
router.post('/', protect, adminOnly, createCar);
router.put('/:id', protect, adminOnly, updateCar);
router.delete('/:id', protect, adminOnly, deleteCar);
router.post('/upload-image', protect, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: imageUrl, filename: req.file.filename });
});

export default router;
