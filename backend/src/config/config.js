import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/driveease',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  demoMode: process.env.DEMO_MODE === 'true',
  company: {
    name: process.env.COMPANY_NAME || 'DriveEase',
    email: process.env.COMPANY_EMAIL || 'support@driveease.in',
    phone: process.env.COMPANY_PHONE || '+91 98765 43210',
    address: process.env.COMPANY_ADDRESS || '123 Auto Plaza, MG Road, Bengaluru, Karnataka 560001',
    lat: parseFloat(process.env.COMPANY_LAT || '12.9752'),
    lng: parseFloat(process.env.COMPANY_LNG || '77.6070'),
  }
};
