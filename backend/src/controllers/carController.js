import { Car } from '../models/Car.js';
import { Booking } from '../models/Booking.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// Check availability helper
const isCarAvailable = async (carId, pickupDateTime, returnDateTime, excludeBookingId = null) => {
  const query = {
    car: carId,
    status: { $in: ['pending', 'confirmed', 'active'] },
    $or: [
      { pickupDateTime: { $lt: returnDateTime }, returnDateTime: { $gt: pickupDateTime } }
    ]
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  const conflict = await Booking.findOne(query);
  return !conflict;
};

// @GET /api/cars
export const getCars = asyncHandler(async (req, res) => {
  const { category, transmission, fuelType, minSeats, maxPrice, search, pickupDateTime, returnDateTime } = req.query;
  const filter = { isActive: true };

  if (category) filter.category = category;
  if (transmission) filter.transmission = transmission;
  if (fuelType) filter.fuelType = fuelType;
  if (minSeats) filter.seatingCapacity = { $gte: parseInt(minSeats) };
  if (maxPrice) filter['pricing.dailyRate'] = { $lte: parseFloat(maxPrice) };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } }
    ];
  }

  let cars = await Car.find(filter).sort({ 'pricing.dailyRate': 1 });

  // Filter by availability if dates provided
  if (pickupDateTime && returnDateTime) {
    const pickup = new Date(pickupDateTime);
    const ret = new Date(returnDateTime);
    const availabilityChecks = await Promise.all(
      cars.map(car => isCarAvailable(car._id, pickup, ret))
    );
    cars = cars.filter((_, i) => availabilityChecks[i]);
  }

  res.json({ success: true, count: cars.length, data: cars });
});

// @GET /api/cars/:id
export const getCar = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car || !car.isActive) {
    return res.status(404).json({ success: false, error: 'Car not found' });
  }
  res.json({ success: true, data: car });
});

// @GET /api/cars/:id/availability
export const checkAvailability = asyncHandler(async (req, res) => {
  const { pickupDateTime, returnDateTime } = req.query;
  if (!pickupDateTime || !returnDateTime) {
    return res.status(400).json({ success: false, error: 'Pickup and return date-times are required' });
  }
  const pickup = new Date(pickupDateTime);
  const ret = new Date(returnDateTime);
  if (pickup >= ret) {
    return res.status(400).json({ success: false, error: 'Return time must be after pickup time' });
  }
  const available = await isCarAvailable(req.params.id, pickup, ret);
  res.json({ success: true, data: { available, carId: req.params.id } });
});

// @POST /api/cars (Admin)
export const createCar = asyncHandler(async (req, res) => {
  const car = await Car.create(req.body);
  res.status(201).json({ success: true, data: car, message: 'Car added successfully' });
});

// @PUT /api/cars/:id (Admin)
export const updateCar = asyncHandler(async (req, res) => {
  const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!car) return res.status(404).json({ success: false, error: 'Car not found' });
  res.json({ success: true, data: car, message: 'Car updated successfully' });
});

// @DELETE /api/cars/:id (Admin)
export const deleteCar = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ success: false, error: 'Car not found' });
  car.isActive = false;
  await car.save();
  res.json({ success: true, message: 'Car deactivated successfully' });
});

// @GET /api/cars/admin/all (Admin)
export const getAllCarsAdmin = asyncHandler(async (req, res) => {
  const cars = await Car.find().sort({ createdAt: -1 });
  res.json({ success: true, count: cars.length, data: cars });
});

export { isCarAvailable };
