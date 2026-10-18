import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/driveease';

// Car images — using Unsplash for demo
const carImages = {
  hatchback: [
    'https://images.unsplash.com/photo-1623869675781-80aa31012fb6?w=800&q=80',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
  ],
  sedan: [
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80',
    'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80',
  ],
  suv: [
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
  ],
  luxury: [
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800&q=80',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
  ],
  mpv: [
    'https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=800&q=80',
  ],
  electric: [
    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
    'https://images.unsplash.com/photo-1641462413967-3de3e2e9b5d4?w=800&q=80',
  ],
};

const carData = [
  {
    name: 'Maruti Swift', brand: 'Maruti Suzuki', model: 'Swift', year: 2023,
    category: 'hatchback', transmission: 'manual', fuelType: 'petrol',
    seatingCapacity: 5, color: 'Pearl Arctic White', mileage: 23,
    plateNumber: 'KA01AB1234',
    pricing: { hourlyRate: 120, dailyRate: 1499, securityDeposit: 3000, extraHourRate: 150 },
    features: ['AC', 'Bluetooth', 'USB Charging', 'Power Windows', 'ABS'],
    description: 'The iconic Maruti Swift — nimble, fuel-efficient and fun to drive. Perfect for city commutes.',
    images: carImages.hatchback, isAvailable: true
  },
  {
    name: 'Hyundai Creta', brand: 'Hyundai', model: 'Creta', year: 2023,
    category: 'suv', transmission: 'automatic', fuelType: 'petrol',
    seatingCapacity: 5, color: 'Titan Grey', mileage: 16,
    plateNumber: 'KA01CD5678',
    pricing: { hourlyRate: 250, dailyRate: 2999, securityDeposit: 5000, extraHourRate: 300 },
    features: ['AC', 'Sunroof', 'Touchscreen', 'Rear Camera', 'Cruise Control', 'Ventilated Seats'],
    description: 'The best-selling SUV in India. Spacious, powerful and packed with premium features.',
    images: carImages.suv, isAvailable: true
  },
  {
    name: 'Honda City', brand: 'Honda', model: 'City', year: 2022,
    category: 'sedan', transmission: 'automatic', fuelType: 'petrol',
    seatingCapacity: 5, color: 'Lunar Silver', mileage: 18,
    plateNumber: 'KA02EF9012',
    pricing: { hourlyRate: 180, dailyRate: 1999, securityDeposit: 4000, extraHourRate: 220 },
    features: ['AC', 'Touchscreen', 'Rear Camera', 'Lane Watch', 'Bluetooth', 'Wireless Charging'],
    description: 'The Honda City — a premium sedan with a spacious cabin and smooth automatic gearbox.',
    images: carImages.sedan, isAvailable: true
  },
  {
    name: 'Toyota Innova Crysta', brand: 'Toyota', model: 'Innova Crysta', year: 2023,
    category: 'mpv', transmission: 'automatic', fuelType: 'diesel',
    seatingCapacity: 7, color: 'Avant-Garde Bronze', mileage: 14,
    plateNumber: 'KA03GH3456',
    pricing: { hourlyRate: 350, dailyRate: 3999, securityDeposit: 8000, extraHourRate: 400 },
    features: ['AC', 'Captain Seats', 'Touchscreen', 'Rear AC Vents', 'Ambient Lighting', '7 Seats'],
    description: 'India\'s most trusted MPV. Comfortable for long drives and family trips.',
    images: carImages.mpv, isAvailable: true
  },
  {
    name: 'BMW 3 Series', brand: 'BMW', model: '3 Series 330i', year: 2023,
    category: 'luxury', transmission: 'automatic', fuelType: 'petrol',
    seatingCapacity: 5, color: 'Alpine White', mileage: 15,
    plateNumber: 'KA04IJ7890',
    pricing: { hourlyRate: 800, dailyRate: 8999, securityDeposit: 25000, extraHourRate: 1000 },
    features: ['AC', 'Panoramic Sunroof', 'Harman Kardon Audio', 'Leather Seats', 'Heads-Up Display', 'Park Assist', 'Driving Modes'],
    description: 'Experience the ultimate driving machine. The BMW 3 Series — pure luxury, pure performance.',
    images: carImages.luxury, isAvailable: true
  },
  {
    name: 'Tata Nexon EV', brand: 'Tata', model: 'Nexon EV', year: 2024,
    category: 'electric', transmission: 'automatic', fuelType: 'electric',
    seatingCapacity: 5, color: 'Pristine White', mileage: 0,
    plateNumber: 'KA05KL4321',
    pricing: { hourlyRate: 200, dailyRate: 2499, securityDeposit: 5000, extraHourRate: 250 },
    features: ['AC', 'Touchscreen', 'Connected Car Tech', 'Regenerative Braking', 'Fast Charging', 'Zero Emissions'],
    description: 'India\'s best-selling electric SUV. 465km range, zero emissions and packed with tech.',
    images: carImages.electric, isAvailable: true
  },
  {
    name: 'Maruti Ertiga', brand: 'Maruti Suzuki', model: 'Ertiga', year: 2023,
    category: 'mpv', transmission: 'manual', fuelType: 'cng',
    seatingCapacity: 7, color: 'Brave Khaki', mileage: 26,
    plateNumber: 'KA06MN8765',
    pricing: { hourlyRate: 200, dailyRate: 2299, securityDeposit: 4000, extraHourRate: 250 },
    features: ['AC', 'Touchscreen', 'Bluetooth', '7 Seats', 'CNG', 'Rear Wiper'],
    description: 'The go-to family car. Spacious 7-seater with the economy of CNG fuel.',
    images: carImages.mpv, isAvailable: true
  },
  {
    name: 'Volkswagen Polo', brand: 'Volkswagen', model: 'Polo', year: 2022,
    category: 'hatchback', transmission: 'automatic', fuelType: 'petrol',
    seatingCapacity: 5, color: 'Candy White', mileage: 17,
    plateNumber: 'KA07OP2109',
    pricing: { hourlyRate: 150, dailyRate: 1799, securityDeposit: 3500, extraHourRate: 190 },
    features: ['AC', 'Touchscreen', 'Cruise Control', 'ABS', 'Bluetooth'],
    description: 'The European gem — the Polo offers a fun, spirited driving experience with premium build quality.',
    images: carImages.hatchback, isAvailable: true
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear old data
    const { User } = await import('../models/User.js');
    const { Car } = await import('../models/Car.js');
    const { Booking } = await import('../models/Booking.js');

    await Car.deleteMany({});
    await User.deleteMany({});
    await Booking.deleteMany({});
    console.log('Cleared existing data');

    // Create admin
    const admin = await User.create({
      name: 'DriveEase Admin',
      email: 'admin@driveease.in',
      phone: '+91 98765 43210',
      password: 'Admin@123',
      role: 'admin',
    });
    console.log(`Admin created: ${admin.email}`);

    // Create demo customer
    const customer = await User.create({
      name: 'Raghab Demo',
      email: 'demo@driveease.in',
      phone: '+91 99999 00001',
      password: 'Demo@123',
      role: 'customer',
    });
    console.log(`Demo customer: ${customer.email}`);

    // Create cars
    const cars = await Car.insertMany(carData);
    console.log(`${cars.length} cars inserted`);

    // Create a demo confirmed booking
    const pickupDT = new Date();
    pickupDT.setDate(pickupDT.getDate() + 2);
    const returnDT = new Date(pickupDT);
    returnDT.setDate(returnDT.getDate() + 1);

    const demoBooking = await Booking.create({
      customer: customer._id,
      car: cars[1]._id, // Creta
      pickupDateTime: pickupDT,
      returnDateTime: returnDT,
      rentalDuration: { hours: 0, days: 1, totalHours: 24 },
      customerDetails: { name: customer.name, email: customer.email, phone: customer.phone },
      pricing: {
        hourlyRate: cars[1].pricing.hourlyRate,
        dailyRate: cars[1].pricing.dailyRate,
        securityDeposit: cars[1].pricing.securityDeposit,
        rentalCharges: cars[1].pricing.dailyRate,
        taxes: Math.round(cars[1].pricing.dailyRate * 0.18),
        totalAmount: cars[1].pricing.dailyRate + Math.round(cars[1].pricing.dailyRate * 0.18) + cars[1].pricing.securityDeposit,
      },
      payment: { method: 'online', status: 'paid', paidAt: new Date(), amount: 8539 },
      status: 'confirmed',
      isDemo: true,
    });

    console.log(`Demo booking created: ${demoBooking.bookingId}`);
    console.log('\n✅ Seed data complete!');
    console.log('Admin  → admin@driveease.in / Admin@123');
    console.log('Customer → demo@driveease.in / Demo@123');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
