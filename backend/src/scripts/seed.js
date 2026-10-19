import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';
import { Car } from '../models/Car.js';
import { Booking } from '../models/Booking.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/driveease';

// Stitch high-res images for top flagship models
const STITCH_IMAGES = {
  macan: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBDWj3N4FtPkdGmmRuhfYr7s_5lPLkeEiQTcmRa_5hyQqEJl4RzUna6Pd1LYoncVOYWuaMIVBZwpgdLHCoL4jLnrQwIQmnbndqdzC-MJrZq2vM8MKP651kLfcKTXhQ8t7XMrWizWsUjrdW_duFeL2ItT6sv4YswVWyzgjnUs97bB8y6XhORTaKD5HxT6cF_cYYmNY-VwHFb4u9lhvuJW-Akvmtuz-B9JtbLaMyS8Z1tBF1LGGbGmDCoxQ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB2ua6u0KUMBsl_mOU6KU4Y8R9GDO10SIM2n1iIYM-KxF_zT1Gw3l59ndbfH7Uw41vmTz2uH3e1rMAdECvWq78Mrj3EUa3iZyfLpEXZK-mtnEAX60xp0rAVk--EcdlaPkY9VbFNTDR6AcqJYMnVz1W-SYbSwH5jhAYdJ_R7BjanlzekFz4Jv3An_jhRv1EnIT61ukJAoKMQXNK0JeIb48QZrXJdviyZwfLLhKABrQPmBRrkbv8BAembnw',
  ],
  modelY: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDBSrmluOpgDzyIngbcEeU5JomglTWmrkg4FYfxoiXKyIKt8GJZlvLT7TGyr9qVx6OkVg8-orGNZxK_zUNcs1ngurUWbQ3IuQNhY7chssCKRvebC3wfojddD7xYNF2HP7F0-KxwAyz5n3vm3k3SsR3AcdMCB4XFquR6ZZolbtIrBWYM5v5wh64VVTmGEUw9XrkNCn3VRTxIClFVX_dsEmCEOt_dGbPl6kq3Zfkn7mDeP4DwLijCzcA3WQ',
  ],
  m340i: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAVMQ8HO28MSS6ANUTkuqdJYczlUATwDLHwXd8ZLaoIpnO9Xn1RRJhce3Dr4sbt5BZge0cyF-ETdsOaJzh0tlXYAaHAw1S8Ss5KM6ca108Ppd7H1R_07sHx4OIdkMmBFfVg3jpVa08pET2Nfsofp1BqnVyWtTb49xP4F-fOmbDT6Fi0Uqqfd5e4yPD8DsZLkj5tDMrZQgUNZHS9vJrPS0aBnJQNY-igUZAWKxdMQo5JYw9BCYtalI5Kpg',
  ],
  audiRS: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDJXJce1x7X14TdXdSlSTA9a1-IN2871mYZ4pbG82Aszz4hcsp2F5gnNI9W0h03eElfOexZR045dJ9yC61gxkE7_Ln4WryK3yuYemd7Q3vetKQ99mK4MKPv7hrPGTaqZZZOahJBePd4_NdXGw6qD4Ijx8WFi8HUdRZRFWc2ONGkNywp3XZ8oH56OipZNIJFrclLefm-MvwGXC-ssv_S_rahP0bZWBO6uaFK4nxnmLWfjcmMFe7intTLJA',
  ],
  velar: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDXw2sja7Ke0AYi6hNdwY6V2o3bGCg2qcMAJ4z90R9XZRjwwaTFrapKQKMfvhmWVAJs0f3OOds7yuKcsIAGKzFQU5EA6QA4VZ5crOV1W20TQr3ozR6aMu82XbcmlDYFO8ggKESqAIJoypTkEr3bsi7CBaMLz1PT0QSsYWBccBxbR7TujcU2PEoct44502gALEcFNT9SOqlR4ZqNgaGL1lNIvUmmj_KUEiNn-igIqTZdpKG2Eb09l4EJ9g',
  ],
  mini: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCzZmQPp_TV8VKSC70vds-lST4ltFzmnlB0I8IvIfhda02rKIUgZONqjduO1RcNB2hdYtfPV0woMricwRHlOnKBWssiau-5BXUShoGIp3RTTXNLc8mvUiz0oCxsCi6zMQ23JWpfY58on-FcizostQdlZ6eqKIRESDI8Gqt0kRToNk7s75JP36leMtLs_0p-S1V_VIC7IMrw3M07VpAA194pl4YQVfrB7mzob-33fll-SM-ZCAJO0jQ3rQ',
  ],
  taycan: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDCjxKZSyiVyihw5s27tMuO8nwB9pSchhwd1JqHjYC9CBP12Vbt5NHNv8Au8n95BYwIxj7pbc1pMsnJsIIMO4Hvr8QBT4AJfbPJw1fcP8mnCFgMBM9nxOMOPX6vwVOGXTqfXtSS8tk4gZ4NtVIJcOBltivuAH7g0YqCZcroSYYGfuwdF-X2b37iZBk2F1S8KclwTOHsBlgpgtdL1d50-gLgNltYL0WWoz3uSwerMvpCM8N3LT25vx-sJA',
  ],
  m3comp: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuATMgre3eNnKJrqmL8BK1P4b1MAiHVAiCkeEA4PDcUlmNvptCQ_ynMtsjrlDmu0CuLDjOSVJB1YV3U6WIuszn2wizaBpKNhfVo6aNbyO-HadhpTB7QJRPfAoeam1ybk58K28S4ohvIpuTRvCmXM5sfrp59PaQkGNxj_DEeop-O5xgQP3-bN07IdRZuVAfFgimK7G-TSh8F6etaOYjqCOlEQjzzRa4s5WiQYfN5nsZqJm8txTNnuNhIAtw',
  ],
};

const raw50Cars = [
  // 15 SUVs
  { name: 'Porsche Macan GTS', brand: 'Porsche', model: 'Macan GTS', category: 'suv', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 32, daily: 210, hp: 434, images: STITCH_IMAGES.macan },
  { name: 'Range Rover Velar P380', brand: 'Land Rover', model: 'Velar', category: 'suv', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 38, daily: 260, hp: 380, images: STITCH_IMAGES.velar },
  { name: 'BMW X5 xDrive40i', brand: 'BMW', model: 'X5', category: 'suv', transmission: 'automatic', fuelType: 'hybrid', seats: 7, hourly: 36, daily: 240, hp: 375, images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Mercedes-Benz GLE 450', brand: 'Mercedes-Benz', model: 'GLE 450', category: 'suv', transmission: 'automatic', fuelType: 'hybrid', seats: 7, hourly: 37, daily: 250, hp: 375, images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Audi Q7 55 TFSI quattro', brand: 'Audi', model: 'Q7', category: 'suv', transmission: 'automatic', fuelType: 'petrol', seats: 7, hourly: 35, daily: 235, hp: 335, images: ['https://images.unsplash.com/photo-1541348263662-e0c86437da7b?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Porsche Cayenne Turbo GT', brand: 'Porsche', model: 'Cayenne', category: 'suv', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 45, daily: 320, hp: 650, images: STITCH_IMAGES.macan },
  { name: 'Volvo XC90 B6 Ultimate', brand: 'Volvo', model: 'XC90', category: 'suv', transmission: 'automatic', fuelType: 'hybrid', seats: 7, hourly: 33, daily: 220, hp: 295, images: ['https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Genesis GV80 3.5T Prestige', brand: 'Genesis', model: 'GV80', category: 'suv', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 34, daily: 225, hp: 375, images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Ford Bronco Wildtrak 4x4', brand: 'Ford', model: 'Bronco', category: 'suv', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 29, daily: 195, hp: 315, images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Jeep Grand Cherokee L Summit', brand: 'Jeep', model: 'Grand Cherokee', category: 'suv', transmission: 'automatic', fuelType: 'petrol', seats: 7, hourly: 31, daily: 205, hp: 357, images: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Audi Q5 Sportback S Line', brand: 'Audi', model: 'Q5', category: 'suv', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 30, daily: 198, hp: 261, images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Lexus RX 350 F Sport', brand: 'Lexus', model: 'RX 350', category: 'suv', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 30, daily: 200, hp: 275, images: ['https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Alfa Romeo Stelvio Quadrifoglio', brand: 'Alfa Romeo', model: 'Stelvio', category: 'suv', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 42, daily: 290, hp: 505, images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Toyota Land Cruiser 300 VXR', brand: 'Toyota', model: 'Land Cruiser', category: 'suv', transmission: 'automatic', fuelType: 'diesel', seats: 7, hourly: 39, daily: 270, hp: 409, images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Tesla Model X Plaid Tri-Motor', brand: 'Tesla', model: 'Model X', category: 'suv', transmission: 'automatic', fuelType: 'electric', seats: 6, hourly: 44, daily: 310, hp: 1020, images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80'] },

  // 12 Sedans
  { name: 'BMW M340i xDrive Sedan', brand: 'BMW', model: 'M340i', category: 'sedan', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 30, daily: 190, hp: 382, images: STITCH_IMAGES.m340i },
  { name: 'Audi S5 Sportback', brand: 'Audi', model: 'S5', category: 'sedan', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 31, daily: 195, hp: 349, images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Mercedes-Benz C300 4MATIC', brand: 'Mercedes-Benz', model: 'C300', category: 'sedan', transmission: 'automatic', fuelType: 'hybrid', seats: 5, hourly: 28, daily: 180, hp: 255, images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Tesla Model 3 Dual Motor AWD', brand: 'Tesla', model: 'Model 3', category: 'sedan', transmission: 'automatic', fuelType: 'electric', seats: 5, hourly: 26, daily: 149, hp: 450, images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Porsche Panamera 4S E-Hybrid', brand: 'Porsche', model: 'Panamera', category: 'sedan', transmission: 'automatic', fuelType: 'hybrid', seats: 5, hourly: 42, daily: 295, hp: 552, images: STITCH_IMAGES.taycan },
  { name: 'Lexus IS 500 F Sport V8', brand: 'Lexus', model: 'IS 500', category: 'sedan', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 34, daily: 215, hp: 472, images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Alfa Romeo Giulia Ti Q4', brand: 'Alfa Romeo', model: 'Giulia', category: 'sedan', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 27, daily: 175, hp: 280, images: ['https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Genesis G70 3.3T Sport', brand: 'Genesis', model: 'G70', category: 'sedan', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 29, daily: 185, hp: 365, images: ['https://images.unsplash.com/photo-1541348263662-e0c86437da7b?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Audi A6 45 TFSI quattro', brand: 'Audi', model: 'A6', category: 'sedan', transmission: 'automatic', fuelType: 'hybrid', seats: 5, hourly: 31, daily: 200, hp: 261, images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80'] },
  { name: 'BMW 530i M Sport', brand: 'BMW', model: '530i', category: 'sedan', transmission: 'automatic', fuelType: 'hybrid', seats: 5, hourly: 33, daily: 210, hp: 255, images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Mercedes-Benz E350 4MATIC', brand: 'Mercedes-Benz', model: 'E350', category: 'sedan', transmission: 'automatic', fuelType: 'hybrid', seats: 5, hourly: 35, daily: 225, hp: 255, images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Volvo S60 Recharge AWD', brand: 'Volvo', model: 'S60', category: 'sedan', transmission: 'automatic', fuelType: 'hybrid', seats: 5, hourly: 30, daily: 190, hp: 455, images: ['https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'] },

  // 8 Hatchbacks
  { name: 'Mini Cooper S Hardtop', brand: 'Mini', model: 'Cooper S', category: 'hatchback', transmission: 'automatic', fuelType: 'petrol', seats: 4, hourly: 15, daily: 99, hp: 189, images: STITCH_IMAGES.mini },
  { name: 'Volkswagen Golf GTI 2.0T', brand: 'Volkswagen', model: 'Golf GTI', category: 'hatchback', transmission: 'manual', fuelType: 'petrol', seats: 5, hourly: 20, daily: 125, hp: 241, images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Audi S3 Sportback quattro', brand: 'Audi', model: 'S3', category: 'hatchback', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 24, daily: 155, hp: 306, images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Mercedes-Benz A250 Hatch', brand: 'Mercedes-Benz', model: 'A250', category: 'hatchback', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 22, daily: 140, hp: 221, images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Hyundai i30 N Performance', brand: 'Hyundai', model: 'i30 N', category: 'hatchback', transmission: 'manual', fuelType: 'petrol', seats: 5, hourly: 21, daily: 135, hp: 276, images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Ford Focus ST Turbo', brand: 'Ford', model: 'Focus ST', category: 'hatchback', transmission: 'manual', fuelType: 'petrol', seats: 5, hourly: 19, daily: 120, hp: 276, images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Mini John Cooper Works (JCW)', brand: 'Mini', model: 'JCW', category: 'hatchback', transmission: 'automatic', fuelType: 'petrol', seats: 4, hourly: 22, daily: 145, hp: 228, images: STITCH_IMAGES.mini },
  { name: 'BMW 128ti Turbo', brand: 'BMW', model: '128ti', category: 'hatchback', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 23, daily: 148, hp: 261, images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80'] },

  // 10 Electric
  { name: 'Tesla Model Y Performance', brand: 'Tesla', model: 'Model Y', category: 'electric', transmission: 'automatic', fuelType: 'electric', seats: 5, hourly: 28, daily: 185, hp: 456, images: STITCH_IMAGES.modelY },
  { name: 'Audi RS e-tron GT Flagship', brand: 'Audi', model: 'RS e-tron GT', category: 'electric', transmission: 'automatic', fuelType: 'electric', seats: 4, hourly: 45, daily: 310, hp: 637, images: STITCH_IMAGES.audiRS },
  { name: 'Porsche Taycan 4S Turbo', brand: 'Porsche', model: 'Taycan 4S', category: 'electric', transmission: 'automatic', fuelType: 'electric', seats: 4, hourly: 32, daily: 230, hp: 522, images: STITCH_IMAGES.taycan },
  { name: 'Polestar 2 Dual Motor Long Range', brand: 'Polestar', model: 'Polestar 2', category: 'electric', transmission: 'automatic', fuelType: 'electric', seats: 5, hourly: 25, daily: 160, hp: 408, images: ['https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Hyundai Ioniq 5 N AWD Drift', brand: 'Hyundai', model: 'Ioniq 5 N', category: 'electric', transmission: 'automatic', fuelType: 'electric', seats: 5, hourly: 33, daily: 220, hp: 641, images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'] },
  { name: 'BMW i4 M50 Gran Coupe', brand: 'BMW', model: 'i4 M50', category: 'electric', transmission: 'automatic', fuelType: 'electric', seats: 5, hourly: 34, daily: 225, hp: 536, images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Mercedes-Benz EQE 500 4MATIC', brand: 'Mercedes-Benz', model: 'EQE 500', category: 'electric', transmission: 'automatic', fuelType: 'electric', seats: 5, hourly: 36, daily: 240, hp: 402, images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Lucid Air Pure Dual Motor', brand: 'Lucid', model: 'Air Pure', category: 'electric', transmission: 'automatic', fuelType: 'electric', seats: 5, hourly: 40, daily: 280, hp: 480, images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Rivian R1S Adventure Quad-Motor', brand: 'Rivian', model: 'R1S', category: 'electric', transmission: 'automatic', fuelType: 'electric', seats: 7, hourly: 42, daily: 290, hp: 835, images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Tesla Model S Plaid Tri-Motor', brand: 'Tesla', model: 'Model S', category: 'electric', transmission: 'automatic', fuelType: 'electric', seats: 5, hourly: 46, daily: 330, hp: 1020, images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80'] },

  // 5 Luxury & Track
  { name: 'BMW M3 Competition xDrive', brand: 'BMW', model: 'M3 Competition', category: 'luxury', transmission: 'automatic', fuelType: 'petrol', seats: 5, hourly: 38, daily: 220, hp: 503, images: STITCH_IMAGES.m3comp },
  { name: 'Porsche 911 Carrera S (992)', brand: 'Porsche', model: '911 Carrera', category: 'luxury', transmission: 'automatic', fuelType: 'petrol', seats: 4, hourly: 44, daily: 310, hp: 443, images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Aston Martin Vantage V8 Biturbo', brand: 'Aston Martin', model: 'Vantage', category: 'luxury', transmission: 'automatic', fuelType: 'petrol', seats: 2, hourly: 48, daily: 350, hp: 503, images: ['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Mercedes-AMG GT Coupe', brand: 'Mercedes-Benz', model: 'AMG GT', category: 'luxury', transmission: 'automatic', fuelType: 'petrol', seats: 2, hourly: 47, daily: 340, hp: 523, images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80'] },
  { name: 'Chevrolet Corvette Stingray 3LT', brand: 'Chevrolet', model: 'Corvette C8', category: 'luxury', transmission: 'automatic', fuelType: 'petrol', seats: 2, hourly: 39, daily: 275, hp: 495, images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'] },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Car.deleteMany({});
    await Booking.deleteMany({});
    console.log('Cleared existing database entries');

    // Create Admin
    const admin = await User.create({
      name: 'Veloce Admin',
      email: 'admin@veloce.io',
      phone: '+1 (800) 835-6231',
      password: 'Admin@123',
      role: 'admin',
    });
    console.log(`Admin user created: ${admin.email}`);

    // Create Customer
    const customer = await User.create({
      name: 'Alex Morgan',
      email: 'alex.morgan@veloce.io',
      phone: '+1 (415) 890-2341',
      password: 'Demo@123',
      role: 'customer',
      drivingLicence: {
        number: 'CA DL-928-8842',
        expiryDate: '2028-09-15',
        verified: true,
      },
    });
    console.log(`Customer user created: ${customer.email}`);

    // Insert All 50 Cars
    const formattedCars = raw50Cars.map((item, idx) => ({
      name: item.name,
      brand: item.brand,
      model: item.model,
      year: 2024,
      category: item.category,
      transmission: item.transmission,
      fuelType: item.fuelType,
      seatingCapacity: item.seats,
      color: 'Track Spec',
      mileage: 25,
      plateNumber: `CA-${(100 + idx)}VELO`,
      totalQuantity: idx < 8 ? 4 : (idx < 20 ? 3 : 2), // Multi-unit fleet stock per model
      hubLocation: idx % 3 === 0 ? 'Main Downtown Car Hub - 4th Street' : (idx % 3 === 1 ? 'Central Office Hub & Lot' : 'West Metro Transit Hub'),
      pricing: {
        hourlyRate: item.hourly,
        dailyRate: item.daily,
        securityDeposit: 200,
        extraHourRate: Math.round(item.hourly * 1.15),
      },
      features: [
        'In-Person Driver Handover (6-Digit Code)',
        'Customer Refuels Own Tank',
        `${item.hp} HP Performance`,
        `${item.seats} Seats`,
        'Apple CarPlay & Android Auto',
      ],
      description: `Available for customer rental for selected duration. Fuel is not provided by the company; customer adds fuel. In-person handover by company driver with 6-digit secret code verification.`,
      fuelPolicy: 'customer-refuels',
      images: item.images,
      rating: 4.8 + Math.round(Math.random() * 20) / 100,
      reviewCount: 30 + Math.floor(Math.random() * 90),
      isAvailable: true,
      isActive: true,
    }));

    const cars = await Car.insertMany(formattedCars);
    console.log(`✅ Seeded ${cars.length} cars into fleet!`);

    // Create Initial Demo Booking for Alex Morgan
    const pickupDT = new Date();
    pickupDT.setDate(pickupDT.getDate() + 1);
    pickupDT.setHours(10, 0, 0, 0);

    const returnDT = new Date(pickupDT);
    returnDT.setDate(returnDT.getDate() + 2);
    returnDT.setHours(18, 0, 0, 0);

    const demoBooking = await Booking.create({
      customer: customer._id,
      car: cars[0]._id, // Porsche Macan GTS
      pickupDateTime: pickupDT,
      returnDateTime: returnDT,
      rentalDuration: { hours: 8, days: 2, totalHours: 56 },
      customerDetails: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        drivingLicenceNumber: 'CA DL-928-8842',
      },
      pricing: {
        hourlyRate: cars[0].pricing.hourlyRate,
        dailyRate: cars[0].pricing.dailyRate,
        securityDeposit: 200,
        rentalCharges: cars[0].pricing.dailyRate * 2 + cars[0].pricing.hourlyRate * 8,
        taxes: 18.5,
        totalAmount: 333.5,
      },
      payment: {
        method: 'online',
        status: 'paid',
        paidAt: new Date(),
        amount: 333.5,
        currency: 'USD',
      },
      status: 'confirmed',
      secretCode: '482916',
      handoverStatus: 'awaiting_code_verification',
      isDemo: true,
    });

    console.log(`Demo booking created: ${demoBooking.bookingId}`);
    console.log('\n========================================');
    console.log(`✅ VELOCE 50-Car Fleet Seed Completed!`);
    console.log(`Total Cars Available: ${cars.length}`);
    console.log(`Admin User:    admin@veloce.io / Admin@123`);
    console.log(`Customer User: alex.morgan@veloce.io / Demo@123`);
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
