import { Settings } from '../models/Settings.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { config } from '../config/config.js';

const DEFAULT_SETTINGS = {
  companyName: { value: 'DriveEase', category: 'company', label: 'Company Name' },
  companyEmail: { value: 'support@driveease.in', category: 'company', label: 'Support Email' },
  companyPhone: { value: '+91 98765 43210', category: 'company', label: 'Phone Number' },
  companyAddress: { value: '123 Auto Plaza, MG Road, Bengaluru, Karnataka 560001', category: 'company', label: 'Address' },
  companyLat: { value: 12.9752, category: 'company', label: 'Latitude' },
  companyLng: { value: 77.6070, category: 'company', label: 'Longitude' },
  gstPercent: { value: 18, category: 'pricing', label: 'GST Percentage' },
  latePenaltyMultiplier: { value: 1.5, category: 'pricing', label: 'Late Return Penalty Multiplier' },
  minRentalHours: { value: 2, category: 'policy', label: 'Minimum Rental Hours' },
  maxAdvanceBookingDays: { value: 90, category: 'policy', label: 'Max Advance Booking (Days)' },
  cancellationPolicy: { value: 'Free cancellation 24h before pickup. 50% refund within 4-24h. No refund within 4h.', category: 'policy', label: 'Cancellation Policy' },
  termsConditions: { value: 'Full terms available at driveease.in/terms', category: 'policy', label: 'Terms & Conditions' },
  privacyPolicy: { value: 'We respect your privacy. Data is used only for booking purposes.', category: 'policy', label: 'Privacy Policy' },
  fuelPolicy: { value: 'Vehicles must be returned with the same fuel level as pickup.', category: 'policy', label: 'Fuel Policy' },
  minAgeRequirement: { value: 21, category: 'policy', label: 'Minimum Age Requirement' },
  licenceRequirements: { value: 'Valid Indian driving licence required. International licence accepted with passport.', category: 'policy', label: 'Licence Requirements' },
  securityDepositPolicy: { value: 'A refundable security deposit is charged. Returned within 7 working days of car return.', category: 'policy', label: 'Security Deposit Policy' },
  razorpayEnabled: { value: true, category: 'payment', label: 'Razorpay Online Payment Enabled' },
  cashEnabled: { value: true, category: 'payment', label: 'Cash Payment Enabled' },
  selfDriveGuidelines: { value: 'Customers must hold a valid driving licence. No smoking in vehicles. Pets allowed in carriers only. Speed limits must be observed. Report accidents immediately.', category: 'policy', label: 'Self-Drive Guidelines' },
};

// @GET /api/settings/public
export const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.find({ category: { $in: ['company', 'policy', 'payment'] } });
  const result = {};
  settings.forEach(s => { result[s.key] = s.value; });

  // Fill in defaults for missing keys
  Object.entries(DEFAULT_SETTINGS).forEach(([key, def]) => {
    if (!['pricing'].includes(def.category) && result[key] === undefined) {
      result[key] = def.value;
    }
  });

  result.companyLat = result.companyLat || config.company.lat;
  result.companyLng = result.companyLng || config.company.lng;

  res.json({ success: true, data: result });
});

// @GET /api/admin/settings
export const getAllSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.find().sort({ category: 1, key: 1 });
  const result = {};
  settings.forEach(s => { result[s.key] = { value: s.value, category: s.category, label: s.label }; });

  // Fill defaults
  Object.entries(DEFAULT_SETTINGS).forEach(([key, def]) => {
    if (!result[key]) result[key] = def;
  });

  res.json({ success: true, data: result });
});

// @PUT /api/admin/settings
export const updateSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body; // { key: value, ... }
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ success: false, error: 'Settings object required' });
  }

  const ops = Object.entries(settings).map(([key, value]) => {
    const def = DEFAULT_SETTINGS[key] || {};
    return {
      updateOne: {
        filter: { key },
        update: { $set: { key, value, category: def.category || 'general', label: def.label || key, updatedBy: req.user._id } },
        upsert: true
      }
    };
  });

  await Settings.bulkWrite(ops);
  res.json({ success: true, message: 'Settings updated successfully' });
});
