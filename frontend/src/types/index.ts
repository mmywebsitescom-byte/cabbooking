export const APP_NAME = 'VELOCE';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  token?: string;
  address?: string;
  dateOfBirth?: string;
  drivingLicence?: {
    number: string;
    expiryDate: string;
    verified: boolean;
  };
}

export type CarCategory = 'hatchback' | 'sedan' | 'suv' | 'luxury' | 'mpv' | 'electric';
export type Transmission = 'manual' | 'automatic';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';

export interface Car {
  _id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  category: CarCategory;
  transmission: Transmission;
  fuelType: FuelType;
  seatingCapacity: number;
  images: string[];
  thumbnail?: string;
  thumbnailIndex: number;
  pricing: {
    hourlyRate: number;
    dailyRate: number;
    securityDeposit: number;
    extraHourRate: number;
  };
  features: string[];
  description: string;
  plateNumber: string;
  color: string;
  mileage: number;
  fuelPolicy: string;
  minAgeRequired: number;
  licenceRequired: boolean;
  totalQuantity?: number;
  hubLocation?: string;
  isAvailable: boolean;
  isActive: boolean;
  isAvailableForPeriod?: boolean;
  availableUnits?: number;
  bookedUnits?: number;
  totalRentals: number;
  rating: number;
  reviewCount: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'no_show';
export type PaymentMethod = 'online' | 'cash';
export type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed';

export interface Booking {
  _id: string;
  bookingId: string;
  customer: User | string;
  car: Car;
  pickupDateTime: string;
  returnDateTime: string;
  actualReturnDateTime?: string;
  rentalDuration: {
    hours: number;
    days: number;
    totalHours: number;
  };
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    drivingLicenceNumber?: string;
  };
  pricing: {
    hourlyRate: number;
    dailyRate: number;
    securityDeposit: number;
    rentalCharges: number;
    extraTimeCharges: number;
    taxes: number;
    discounts: number;
    totalAmount: number;
  };
  status: BookingStatus;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paidAt?: string;
    amount: number;
    currency: string;
  };
  extraCharges?: {
    extraHours: number;
    extraAmount: number;
    reason: string;
  };
  cancellation?: {
    cancelledAt: string;
    cancelledBy: 'customer' | 'admin';
    reason: string;
    refundAmount: number;
    refundStatus: 'pending' | 'processed' | 'not_applicable';
  };
  specialRequests?: string;
  secretCode?: string;
  handoverStatus?: 'awaiting_code_verification' | 'code_verified_delivered' | 'returned';
  deliveredAt?: string;
  deliveredBy?: string;
  adminNotes?: string;
  isDemo: boolean;
  createdAt: string;
}

export interface FareEstimate {
  hourlyRate: number;
  dailyRate: number;
  securityDeposit: number;
  rentalCharges: number;
  taxes: number;
  discounts: number;
  totalAmount: number;
  duration: { totalHours: number; days: number; hours: number };
}

export interface CarFilters {
  category?: CarCategory | '';
  transmission?: Transmission | '';
  fuelType?: FuelType | '';
  minSeats?: number;
  maxPrice?: number;
  search?: string;
  pickupDateTime?: string;
  returnDateTime?: string;
}

export interface PublicSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyLat: number;
  companyLng: number;
  cancellationPolicy: string;
  termsConditions: string;
  privacyPolicy: string;
  fuelPolicy: string;
  minAgeRequirement: number;
  licenceRequirements: string;
  securityDepositPolicy: string;
  razorpayEnabled: boolean;
  cashEnabled: boolean;
}

export interface AuditLog {
  _id: string;
  action: string;
  category: 'booking' | 'fleet' | 'user' | 'payment' | 'settings' | 'pricing' | 'security';
  details: string;
  targetId?: string;
  performedBy: {
    userId?: string;
    name: string;
    email: string;
  };
  ipAddress?: string;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  minHours: number;
  maxDiscount: number;
  isActive: boolean;
  description: string;
}

