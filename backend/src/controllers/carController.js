import { Car } from '../models/Car.js';
import { Booking } from '../models/Booking.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// Check availability helper with multi-unit fleet stock support
const getCarAvailability = async (carId, pickupDateTime, returnDateTime, excludeBookingId = null) => {
  const car = await Car.findById(carId);
  if (!car || !car.isActive || !car.isAvailable) {
    return { available: false, bookedUnits: 0, availableUnits: 0, totalQuantity: car ? car.totalQuantity || 1 : 0 };
  }

  const query = {
    car: carId,
    status: { $in: ['pending', 'confirmed', 'active'] },
    $or: [
      { pickupDateTime: { $lt: returnDateTime }, returnDateTime: { $gt: pickupDateTime } }
    ]
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const bookedUnits = await Booking.countDocuments(query);
  const totalQuantity = car.totalQuantity || 1;
  const availableUnits = Math.max(0, totalQuantity - bookedUnits);

  return {
    available: availableUnits > 0,
    bookedUnits,
    availableUnits,
    totalQuantity
  };
};

const isCarAvailable = async (carId, pickupDateTime, returnDateTime, excludeBookingId = null) => {
  const info = await getCarAvailability(carId, pickupDateTime, returnDateTime, excludeBookingId);
  return info.available;
};

// @GET /api/cars
export const getCars = asyncHandler(async (req, res) => {
  const { category, transmission, fuelType, minSeats, maxPrice, search, pickupDateTime, returnDateTime, availableOnly } = req.query;
  const filter = { isActive: true };

  if (category && category !== 'all') filter.category = category;
  if (transmission && transmission !== 'all') filter.transmission = transmission;
  if (fuelType && fuelType !== 'all') filter.fuelType = fuelType;
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

  // Annotate with exact availability for requested time period if dates are supplied
  if (pickupDateTime && returnDateTime) {
    const pickup = new Date(pickupDateTime);
    const ret = new Date(returnDateTime);
    if (!isNaN(pickup) && !isNaN(ret) && pickup < ret) {
      const annotated = await Promise.all(
        cars.map(async car => {
          const avail = await getCarAvailability(car._id, pickup, ret);
          const carObj = car.toObject ? car.toObject() : { ...car };
          return {
            ...carObj,
            isAvailableForPeriod: avail.available,
            availableUnits: avail.availableUnits,
            bookedUnits: avail.bookedUnits,
            totalQuantity: avail.totalQuantity
          };
        })
      );
      if (availableOnly === 'true') {
        cars = annotated.filter(c => c.isAvailableForPeriod);
      } else {
        cars = annotated;
      }
    }
  }

  res.json({ success: true, count: cars.length, data: cars });
});

// @GET /api/cars/:id
export const getCar = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car || !car.isActive) {
    return res.status(404).json({ success: false, error: 'Car not found' });
  }

  const { pickupDateTime, returnDateTime } = req.query;
  let carData = car.toObject ? car.toObject() : { ...car };

  if (pickupDateTime && returnDateTime) {
    const pickup = new Date(pickupDateTime);
    const ret = new Date(returnDateTime);
    if (!isNaN(pickup) && !isNaN(ret) && pickup < ret) {
      const avail = await getCarAvailability(car._id, pickup, ret);
      carData = {
        ...carData,
        isAvailableForPeriod: avail.available,
        availableUnits: avail.availableUnits,
        bookedUnits: avail.bookedUnits,
        totalQuantity: avail.totalQuantity
      };
    }
  }

  res.json({ success: true, data: carData });
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
  const info = await getCarAvailability(req.params.id, pickup, ret);
  res.json({ success: true, data: { ...info, carId: req.params.id } });
});

// @POST /api/cars (Admin - Add new car model with quantity of vehicles)
export const createCar = asyncHandler(async (req, res) => {
  const car = await Car.create(req.body);
  res.status(201).json({ success: true, data: car, message: 'Car model added successfully' });
});

// @PUT /api/cars/:id (Admin - Update car model details or quantity)
export const updateCar = asyncHandler(async (req, res) => {
  const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!car) return res.status(404).json({ success: false, error: 'Car not found' });
  res.json({ success: true, data: car, message: 'Car updated successfully' });
});

// @DELETE /api/cars/:id (Admin - Delete car model permanently)
export const deleteCar = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ success: false, error: 'Car not found' });
  await Car.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Car model deleted permanently from fleet' });
});

// @GET /api/cars/admin/all (Admin)
export const getAllCarsAdmin = asyncHandler(async (req, res) => {
  const cars = await Car.find().sort({ createdAt: -1 });
  res.json({ success: true, count: cars.length, data: cars });
});

export { isCarAvailable, getCarAvailability };
