import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { carsApi, bookingsApi } from '../lib/api';
import type { Car } from '../types';
import { LoadingPage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function BookingPage() {
  const { carId } = useParams<{ carId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const pickupParam = searchParams.get('pickupDateTime');
  const returnParam = searchParams.get('returnDateTime');

  const toLocalIso = (d: Date) => {
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getTodayMinDateTime = () => {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const defaultPickup = new Date();
  defaultPickup.setHours(defaultPickup.getHours() + 2, 0, 0, 0);
  const defaultReturn = new Date(defaultPickup.getTime() + 48 * 60 * 60 * 1000); // 2 days

  const [pickupDateTime, setPickupDateTime] = useState<string>(() => {
    if (pickupParam) {
      const d = new Date(pickupParam);
      if (!isNaN(d.getTime())) return toLocalIso(d);
    }
    return toLocalIso(defaultPickup);
  });

  const [returnDateTime, setReturnDateTime] = useState<string>(() => {
    if (returnParam) {
      const d = new Date(returnParam);
      if (!isNaN(d.getTime())) return toLocalIso(d);
    }
    return toLocalIso(defaultReturn);
  });

  const handlePickupChange = (value: string) => {
    if (!value) return;
    const selected = new Date(value);
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (selected < todayMidnight) {
      toast.error('You cannot book for a previous day. Only bookings for today and future days are permitted.');
      return;
    }

    setPickupDateTime(value);
    if (new Date(returnDateTime) <= selected) {
      const nextDay = new Date(selected.getTime() + 24 * 60 * 60 * 1000);
      setReturnDateTime(toLocalIso(nextDay));
    }
  };

  const handleReturnChange = (value: string) => {
    if (!value) return;
    const ret = new Date(value);
    const dep = new Date(pickupDateTime);
    if (ret <= dep) {
      toast.error('Return time must be after the pickup time.');
      return;
    }
    setReturnDateTime(value);
  };

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [protectionPlan, setProtectionPlan] = useState<'zero' | 'standard'>('zero');
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: boolean }>({});
  const [paymentTab, setPaymentTab] = useState<'card' | 'wallet' | 'upi' | 'cash'>('card');
  const [agreed, setAgreed] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<2 | 3>(2);

  // Form details
  const [driverName, setDriverName] = useState(user?.name || '');
  const [driverEmail, setDriverEmail] = useState(user?.email || '');
  const [driverPhone, setDriverPhone] = useState(user?.phone || '+91 98765 43210');
  const [driverLicence, setDriverLicence] = useState('DL-04-2022-8842');

  // Card form state
  const [cardName, setCardName] = useState(user?.name || 'Alex Morgan');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('11/27');
  const [cardCvv, setCardCvv] = useState('883');
  const [saveCard, setSaveCard] = useState(true);

  // Countdown timer for session hold
  const [timeLeft, setTimeLeft] = useState(872); // 14:32 in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    if (!carId) {
      navigate('/cars');
      return;
    }

    carsApi.getById(carId)
      .then(res => {
        setCar(res.data.data);
      })
      .catch(() => {
        toast.error('Vehicle could not be loaded');
        navigate('/cars');
      })
      .finally(() => setLoading(false));
  }, [carId, navigate]);

  useEffect(() => {
    if (user) {
      if (user.name) {
        setDriverName(user.name);
        setCardName(user.name);
      }
      if (user.email) setDriverEmail(user.email);
      if (user.phone) setDriverPhone(user.phone);
    }
  }, [user]);

  if (loading) return <LoadingPage />;
  if (!car) return null;

  // Duration & Pricing calculation in Indian Rupees (INR ₹)
  const pDate = new Date(pickupDateTime);
  const rDate = new Date(returnDateTime);
  const diffMs = Math.max(rDate.getTime() - pDate.getTime(), 3600000);
  const totalHours = Math.round(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;

  let baseRate = 0;
  if (days > 0) {
    baseRate = days * (car.pricing?.dailyRate || 2100);
    if (remHours > 0) {
      baseRate += remHours > 12 ? (car.pricing?.dailyRate || 2100) : remHours * (car.pricing?.hourlyRate || 299);
    }
  } else {
    baseRate = totalHours * (car.pricing?.hourlyRate || 299);
  }

  const protectionCost = protectionPlan === 'zero' ? 999.00 * Math.max(days, 1) : 0.00;
  const childSeatCost = selectedAddons.childSeat ? 399.00 : 0.00;
  const extraDriverCost = selectedAddons.extraDriver ? 599.00 : 0.00;
  const prepaidFuelCost = selectedAddons.prepaidFuel ? 1499.00 : 0.00;
  const addonsTotal = childSeatCost + extraDriverCost + prepaidFuelCost;

  // Taxes (18% GST)
  const tax = Math.round((baseRate + protectionCost + addonsTotal) * 0.18 * 100) / 100;
  const securityHold = car.pricing?.securityDeposit || 5000.00;
  const totalDueNow = Math.round((baseRate + protectionCost + addonsTotal + tax) * 100) / 100;

  const handleConfirmReservation = async () => {
    if (!agreed) {
      toast.error('Please accept the VELOCE rental agreement');
      return;
    }

    // MANDATORY SIGN IN CHECK: Without sign-in, nobody can complete a booking!
    if (!user) {
      toast.error('Sign-in is mandatory before completing your booking. Please sign in or register.');
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (!driverName.trim()) {
      toast.error('Please enter the primary driver name');
      return;
    }

    setProcessing(true);
    try {

      const isCash = paymentTab === 'cash';
      const res = await bookingsApi.create({
        carId: car._id,
        pickupDateTime: pDate.toISOString(),
        returnDateTime: rDate.toISOString(),
        paymentMethod: isCash ? 'cash' : 'online',
        customerDetails: {
          name: driverName,
          email: driverEmail,
          phone: driverPhone,
          drivingLicenceNumber: driverLicence,
        },
      });

      const newBooking = res.data.data;

      if (!isCash) {
        // Instant simulated payment confirmation for demo
        try {
          await bookingsApi.createPaymentOrder(newBooking._id);
          await bookingsApi.verifyPayment(newBooking._id, {
            razorpayPaymentId: `pay_BLE_${Date.now()}`,
            razorpayOrderId: `order_NFC_${Date.now()}`,
            razorpaySignature: 'veloce_digital_pass_sig',
          });
          toast.success('🎉 Booking confirmed! 6-digit Secret Verification Code generated.');
        } catch {
          // If payment mock fails, still route to confirmation
        }
      } else {
        toast.success('Reservation held at company hub! Present 6-digit code at driver handover.');
      }

      navigate(`/booking-confirmation/${newBooking._id}${isCash ? '?method=cash' : ''}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking reservation failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-[#FFFDEB] text-[#1E2024] min-h-screen flex flex-col font-sans" style={{ paddingTop: '6.5rem', paddingBottom: '7rem' }}>
      {/* STEP PROGRESS INDICATOR STRIP */}
      <section className="bg-[#FAF7E8]/95 border-b border-[#E8DBB3] py-3.5 sticky top-[68px] z-30 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#6D7179]">
            <span className="material-symbols-outlined text-[#CE2626] text-[20px]">lock</span>
            <span>
              Reservation Checkout Session • Vehicle Reserved (<strong className="text-[#CE2626] font-bold">{formatTimer(timeLeft)}</strong> remaining)
            </span>
          </div>

          {/* Progress Steps Cluster - Fully Interactive */}
          <div className="flex items-center gap-3">
            {/* Step 1: Vehicle & Dates (Completed) */}
            <Link to={`/cars/${car._id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity no-underline text-inherit">
              <div className="w-6 h-6 rounded-full bg-[#CE2626] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                <span className="material-symbols-outlined text-[15px]">check</span>
              </div>
              <span className="text-xs font-bold text-[#1E2024]">Vehicle &amp; Dates</span>
            </Link>
            <div className="w-8 h-px bg-[#CE2626]"></div>

            {/* Step 2: Verification & Protection */}
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 text-left"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                currentStep === 2
                  ? 'bg-[#CE2626] text-white ring-4 ring-[#FFDEDE]'
                  : 'bg-[#E8DBB3] text-[#18191B]'
              }`}>
                {currentStep === 3 ? (
                  <span className="material-symbols-outlined text-[15px]">check</span>
                ) : (
                  '2'
                )}
              </div>
              <span className={`text-xs font-bold ${currentStep === 2 ? 'text-[#CE2626]' : 'text-[#6D7179]'}`}>
                Verification &amp; Protection
              </span>
            </button>
            <div className={`w-8 h-px ${currentStep === 3 ? 'bg-[#CE2626]' : 'bg-[#E8DBB3]'}`}></div>

            {/* Step 3: Payment & Secret Code Handover */}
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  toast.error('Sign in is required to access payment.');
                  navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                  return;
                }
                if (!driverName.trim()) {
                  toast.error('Please enter primary driver name');
                  return;
                }
                setCurrentStep(3);
              }}
              className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 text-left"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                currentStep === 3
                  ? 'bg-[#CE2626] text-white ring-4 ring-[#FFDEDE]'
                  : 'border border-[#E8DBB3] bg-white text-[#8C877E]'
              }`}>
                3
              </div>
              <span className={`text-xs font-bold ${currentStep === 3 ? 'text-[#CE2626]' : 'text-[#8C877E]'}`}>
                Payment &amp; Secret Code
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* MAIN CANVAS: 2-COLUMN SPLIT DESKTOP LAYOUT */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Primary Checkout Tasks (8/12 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 min-w-0 flex flex-col gap-6">

            {/* ================= STEP 2: VERIFICATION & PROTECTION ================= */}
            {currentStep === 2 && (
              <>
                {/* CARD 1: Rental Time Period & Schedule */}
                <div className="bg-white rounded-3xl border border-[#E2DDD5] p-6 sm:p-7 shadow-sm">
                  <div className="flex items-center justify-between pb-5 border-b border-[#E2DDD5] flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF8ED] text-[#F5A623] flex items-center justify-center border border-[#FDE68A]">
                        <span className="material-symbols-outlined text-[24px]">schedule</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#1E2024] m-0">1. Rental Time Period &amp; Schedule</h2>
                        <p className="text-xs text-[#6D7179] m-0 mt-0.5">Vehicle rented for your designated hours/days. Customer refuels.</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF8ED] text-[#B45309] border border-[#FDE68A]">
                      <span className="material-symbols-outlined text-[16px]">timelapse</span>
                      Duration: {days > 0 ? `${days}d ` : ''}{remHours > 0 ? `${remHours}h` : ''} ({totalHours} hrs)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
                    <div className="p-3.5 bg-[#FAF6F1] rounded-2xl border border-[#E2DDD5]">
                      <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#6D7179] block">
                        Start Date &amp; Time (Pick-up)
                      </label>
                      <input
                        type="datetime-local"
                        min={getTodayMinDateTime()}
                        value={pickupDateTime}
                        onChange={e => handlePickupChange(e.target.value)}
                        className="w-full bg-white rounded-xl mt-1.5 px-3 py-2 text-[#1E2024] font-semibold text-sm border border-[#E2DDD5] focus:border-[#F5A623] focus:outline-none"
                      />
                      <span className="text-[11px] text-[#8C877E] block mt-1.5">Driver hands over car keys at this time (Today or later)</span>
                    </div>

                    <div className="p-3.5 bg-[#FAF6F1] rounded-2xl border border-[#E2DDD5]">
                      <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#6D7179] block">
                        End Date &amp; Time (Return)
                      </label>
                      <input
                        type="datetime-local"
                        min={pickupDateTime || getTodayMinDateTime()}
                        value={returnDateTime}
                        onChange={e => handleReturnChange(e.target.value)}
                        className="w-full bg-white rounded-xl mt-1.5 px-3 py-2 text-[#1E2024] font-semibold text-sm border border-[#E2DDD5] focus:border-[#F5A623] focus:outline-none"
                      />
                      <span className="text-[11px] text-[#8C877E] block mt-1.5">Return vehicle to company hub or office</span>
                    </div>
                  </div>

                  {/* Fuel Warning Notice */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center gap-3 text-xs text-[#92400E] font-medium">
                    <span className="material-symbols-outlined text-[20px] text-[#B45309] shrink-0">local_gas_station</span>
                    <span><strong>Fuel Notice:</strong> Fuel is not provided by the company. Customer is responsible for adding fuel during the booked time period.</span>
                  </div>
                </div>

                {/* CARD 2: Verified Driver Information */}
                <div className="bg-white rounded-3xl border border-[#E2DDD5] p-6 sm:p-7 shadow-sm">
                  <div className="flex items-center justify-between pb-5 border-b border-[#E2DDD5] flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF8ED] text-[#F5A623] flex items-center justify-center border border-[#FDE68A]">
                        <span className="material-symbols-outlined text-[24px]">badge</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#1E2024] m-0">2. Verified Driver Information</h2>
                        <p className="text-xs text-[#6D7179] m-0 mt-0.5">Validated for instant terminal bypass and direct Bluetooth car access.</p>
                      </div>
                    </div>
                    {user ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                        Verified Account
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        Sign-In Required
                      </span>
                    )}
                  </div>

                  {!user && (
                    <div className="p-4 sm:p-5 mt-4 rounded-2xl bg-[#FFF7ED] border-2 border-[#F97316] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-[24px] text-[#C2410C] shrink-0 mt-0.5">lock</span>
                        <div>
                          <p className="m-0 font-extrabold text-sm text-[#9A3412]">
                            MANDATORY SIGN-IN: Booking cannot be completed without signing in.
                          </p>
                          <p className="m-0 text-xs text-[#C2410C]/80 mt-0.5">
                            Please sign in or create an account to finalize and pay for this reservation.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            login('alex.morgan@veloce.io', 'Demo@123');
                            toast.success('Signed in as Alex Morgan!');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white border border-[#FDBA74] text-xs font-bold text-[#C2410C] hover:bg-orange-50 cursor-pointer shadow-sm transition-all"
                        >
                          1-Click Sign In (Alex)
                        </button>
                        <Link
                          to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                          className="px-4 py-2 rounded-xl bg-[#F5A623] hover:bg-[#E29418] text-[#18191B] text-xs font-bold no-underline inline-flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <span>Sign In</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {user && (
                    <div className="p-3.5 mt-4 rounded-2xl bg-[#F0FDF4] border border-[#86EFAC] flex items-center justify-between flex-wrap gap-2 text-xs text-[#166534] font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#15803D]">verified_user</span>
                        <span>Signed In as <strong>{user.name}</strong> ({user.email})</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#15803D] bg-[#BBF7D0] px-2.5 py-0.5 rounded-full">
                        Authenticated ✓
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
                    <div className="p-3.5 bg-[#FAF6F1] rounded-2xl border border-[#E2DDD5]">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#6D7179] block">Primary Driver</span>
                      <input
                        type="text"
                        value={driverName}
                        onChange={e => setDriverName(e.target.value)}
                        className="w-full bg-transparent font-bold text-sm text-[#1E2024] mt-1 border-none p-0 focus:ring-0 focus:outline-none"
                      />
                      <input
                        type="email"
                        value={driverEmail}
                        onChange={e => setDriverEmail(e.target.value)}
                        className="w-full bg-transparent text-xs text-[#6D7179] mt-0.5 border-none p-0 focus:ring-0 focus:outline-none"
                      />
                    </div>

                    <div className="p-3.5 bg-[#FAF6F1] rounded-2xl border border-[#E2DDD5]">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#6D7179] block">Mobile Verification</span>
                      <input
                        type="tel"
                        value={driverPhone}
                        onChange={e => setDriverPhone(e.target.value)}
                        className="w-full bg-transparent font-bold text-sm text-[#1E2024] mt-1 border-none p-0 focus:ring-0 focus:outline-none"
                      />
                      <span className="text-xs text-[#15803D] flex items-center gap-1 mt-0.5 font-medium">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> SMS Authenticated
                      </span>
                    </div>

                    <div className="p-3.5 bg-[#FAF6F1] rounded-2xl border border-[#E2DDD5]">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#6D7179] block">Driver License Status</span>
                      <input
                        type="text"
                        value={driverLicence}
                        onChange={e => setDriverLicence(e.target.value)}
                        className="w-full bg-transparent font-bold text-sm text-[#1E2024] mt-1 border-none p-0 focus:ring-0 focus:outline-none uppercase font-mono"
                      />
                      <span className="text-xs text-[#6D7179] block mt-0.5">Expires 09/2028 • Tier 1 Valid</span>
                    </div>
                  </div>
                </div>

                {/* CARD 3: Insurance & Coverage Selection */}
                <div className="bg-white rounded-3xl border border-[#E2DDD5] p-6 sm:p-7 shadow-sm">
                  <div className="flex items-center justify-between pb-4 flex-wrap gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-[#1E2024] m-0">Insurance &amp; Coverage Selection</h2>
                      <p className="text-xs text-[#6D7179] m-0 mt-0.5">Choose your liability protection level for uninterrupted peace of mind.</p>
                    </div>
                    <Link to="/policies" target="_blank" className="text-xs font-bold text-[#D97706] flex items-center gap-1 hover:underline no-underline">
                      <span className="material-symbols-outlined text-[16px]">policy</span> Policy Details
                    </Link>
                  </div>

                  {/* Comparison Grid (Fixed bounds, no horizontal overflow into sidebar) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                    {/* Standard Option */}
                    <label
                      onClick={() => setProtectionPlan('standard')}
                      className={`relative flex flex-col p-5 rounded-2xl border cursor-pointer transition-all min-w-0 ${
                        protectionPlan === 'standard'
                          ? 'border-2 border-[#F5A623] bg-[#FFFBF0] shadow-md'
                          : 'border-[#E2DDD5] bg-white hover:border-[#F5A623]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="protection_plan"
                            checked={protectionPlan === 'standard'}
                            onChange={() => setProtectionPlan('standard')}
                            className="w-4 h-4 text-[#F5A623] focus:ring-[#F5A623] accent-[#F5A623]"
                          />
                          <span className="font-bold text-base text-[#1E2024]">Standard Cover</span>
                        </div>
                        <span className="text-sm font-semibold text-[#6D7179]">Included (₹0)</span>
                      </div>
                      <p className="text-xs text-[#6D7179] mt-2 mb-4 leading-relaxed">
                        Standard collision damage waiver with standard financial responsibility.
                      </p>
                      <ul className="space-y-2 mt-auto text-xs text-[#6D7179] border-t border-[#E2DDD5] pt-3 list-none p-0 m-0">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[#16A34A]">check</span>
                          ₹15,000 maximum deductible
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[#16A34A]">check</span>
                          Third-party liability covered
                        </li>
                        <li className="flex items-center gap-2 text-[#9CA3AF]">
                          <span className="material-symbols-outlined text-[16px] text-[#DC2626]">close</span>
                          Tire &amp; Windshield glass excluded
                        </li>
                      </ul>
                    </label>

                    {/* Zero Deductible Option (Recommended Badge contained inside cleanly) */}
                    <label
                      onClick={() => setProtectionPlan('zero')}
                      className={`relative flex flex-col p-5 rounded-2xl border cursor-pointer transition-all min-w-0 overflow-hidden ${
                        protectionPlan === 'zero'
                          ? 'border-2 border-[#F5A623] bg-[#FFFBF0] shadow-md'
                          : 'border-[#E2DDD5] bg-white hover:border-[#F5A623]/50'
                      }`}
                    >
                      <div className="absolute top-3 right-3 bg-[#F5A623] text-[#18191B] font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                        Recommended
                      </div>
                      <div className="flex items-start justify-between pr-20">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="protection_plan"
                            checked={protectionPlan === 'zero'}
                            onChange={() => setProtectionPlan('zero')}
                            className="w-4 h-4 text-[#F5A623] focus:ring-[#F5A623] accent-[#F5A623]"
                          />
                          <span className="font-bold text-base text-[#1E2024]">Zero Deductible</span>
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="text-lg font-extrabold text-[#D97706]">₹999.00</span>
                        <span className="text-xs text-[#6D7179] ml-1">/ day</span>
                      </div>
                      <p className="text-xs text-[#6D7179] mt-2 mb-4 leading-relaxed">
                        Comprehensive complete shield. Zero customer out-of-pocket exposure.
                      </p>
                      <ul className="space-y-2 mt-auto text-xs text-[#1E2024] border-t border-[#FDE68A] pt-3 list-none p-0 m-0">
                        <li className="flex items-center gap-2 font-bold text-[#D97706]">
                          <span className="material-symbols-outlined text-[16px] text-[#D97706]">verified_user</span>
                          ₹0 Excess / No deductible under any event
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[#16A34A]">check</span>
                          Full Glass, Wheels &amp; Undercarriage shield
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[#16A34A]">check</span>
                          24/7 Priority Concierge Roadside Assist
                        </li>
                      </ul>
                    </label>
                  </div>
                </div>

                {/* CARD 4: Vehicle Handover at Hub / Office */}
                <div className="bg-white rounded-3xl border border-[#E2DDD5] p-6 sm:p-7 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF8ED] text-[#F5A623] flex items-center justify-center border border-[#FDE68A]">
                        <span className="material-symbols-outlined text-[24px]">key</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#1E2024] m-0">3. Hub / Office Handover &amp; 6-Digit Code</h2>
                        <p className="text-xs text-[#6D7179] m-0 mt-0.5">
                          In-person vehicle handover by company driver at our car hub or office.
                        </p>
                      </div>
                    </div>
                    <span className="p-2 rounded-xl bg-[#FAF6F1] text-[#F5A623] flex items-center justify-center border border-[#E2DDD5]">
                      <span className="material-symbols-outlined text-[20px]">pin</span>
                    </span>
                  </div>

                  <div className="mt-5 p-4 rounded-2xl bg-[#FAF6F1] border border-[#E2DDD5]">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3.5 rounded-xl border border-[#E2DDD5]">
                        <span className="font-bold text-[#D97706] block mb-1">Step 1: Car Hub / Office</span>
                        <p className="text-[#6D7179] m-0">
                          Go to our {car.hubLocation || 'Main Downtown Car Hub'} or Company Office at your scheduled start time.
                        </p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-[#E2DDD5]">
                        <span className="font-bold text-[#D97706] block mb-1">Step 2: Driver with Car</span>
                        <p className="text-[#6D7179] m-0">
                          Company driver brings your prepared {car.name} and asks for your 6-digit Secret Code.
                        </p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-[#E2DDD5]">
                        <span className="font-bold text-[#15803D] block mb-1">Step 3: Verification &amp; Keys</span>
                        <p className="text-[#6D7179] m-0">
                          After code verification, driver hands over car keys and inspection sheet. You refuel and begin!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3.5 text-xs text-[#6D7179]">
                    <span className="material-symbols-outlined text-[16px] text-[#F5A623]">verified</span>
                    <span>Your unique 6-digit Secret Verification Code will be generated and shown instantly upon booking confirmation.</span>
                  </div>
                </div>

                {/* STEP 2 BOTTOM ACTION BAR */}
                <div className="bg-white rounded-3xl border border-[#E2DDD5] p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
                  <Link to={`/cars/${car._id}`} className="btn-ghost" style={{ textDecoration: 'none' }}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span>Back to Vehicle Details</span>
                  </Link>
                  <button
                    type="button"
                    id="proceed-to-step3-btn"
                    onClick={() => {
                      if (!user) {
                        toast.error('Sign-in is mandatory before proceeding to payment.');
                        const currentUrl = window.location.pathname + window.location.search;
                        navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
                        return;
                      }
                      if (!driverName.trim()) {
                        toast.error('Please enter the primary driver name');
                        return;
                      }
                      setCurrentStep(3);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="btn-primary"
                    style={{
                      padding: '0.85rem 2.25rem', borderRadius: '9999px',
                      fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      backgroundColor: '#F5A623', color: '#18191B', border: 'none', cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(245,166,35,0.35)'
                    }}
                  >
                    <span>Proceed to Step 3: Payment &amp; Secret Code</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
          </>
        )}

        {/* ================= STEP 3: PAYMENT & SECRET CODE ================= */}
        {currentStep === 3 && (
          <>
            {/* Step 2 Verified Summary Banner */}
            <div className="bg-surface-container-lowest rounded-xl border border-primary/40 p-space-md shadow-sm flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-primary">Driver Verified &amp; Protected</div>
                  <div className="font-bold text-on-surface text-sm">
                    {driverName} ({driverEmail}) • {protectionPlan === 'zero' ? 'Zero Deductible Shield ($35/day)' : 'Standard Cover ($0)'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn-ghost"
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit Verification</span>
              </button>
            </div>

            {/* CARD 4: Payment Method Selector */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-space-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 flex-wrap gap-2">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Payment Method</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Choose your guaranteed billing medium. Fully encrypted end-to-end.</p>
                </div>
                <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[16px] text-green-700">shield</span>
                  256-Bit SSL Encrypted
                </div>
              </div>

              {/* Payment Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-space-md">
                <button
                  type="button"
                  onClick={() => setPaymentTab('card')}
                  className={`py-2.5 px-3 rounded-lg border text-label-md font-label-md flex items-center justify-center gap-1.5 transition-all ${
                    paymentTab === 'card'
                      ? 'border-2 border-primary bg-primary/5 text-primary font-bold shadow-sm'
                      : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">credit_card</span>
                  <span>Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('wallet')}
                  className={`py-2.5 px-3 rounded-lg border text-label-md font-label-md flex items-center justify-center gap-1.5 transition-all ${
                    paymentTab === 'wallet'
                      ? 'border-2 border-primary bg-primary/5 text-primary font-bold shadow-sm'
                      : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  <span>Apple Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('upi')}
                  className={`py-2.5 px-3 rounded-lg border text-label-md font-label-md flex items-center justify-center gap-1.5 transition-all ${
                    paymentTab === 'upi'
                      ? 'border-2 border-primary bg-primary/5 text-primary font-bold shadow-sm'
                      : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                  <span>UPI / Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('cash')}
                  className={`py-2.5 px-3 rounded-lg border text-label-md font-label-md flex items-center justify-center gap-1.5 transition-all ${
                    paymentTab === 'cash'
                      ? 'border-2 border-secondary bg-secondary/5 text-secondary font-bold shadow-sm'
                      : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  <span>Cash on Hub</span>
                </button>
              </div>

              {/* Tab Form Content */}
              {paymentTab === 'card' && (
                <div className="space-y-3.5 pt-space-md">
                  <div className="space-y-1">
                    <label className="text-label-sm font-label-sm text-outline uppercase tracking-wider block">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2.5 text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-label-sm font-label-sm text-outline uppercase tracking-wider block">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2.5 pr-12 text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary font-mono"
                      />
                      <span className="absolute right-3.5 top-2.5 material-symbols-outlined text-outline text-[22px]">credit_card</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-label-sm font-label-sm text-outline uppercase tracking-wider block">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2.5 text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary text-center font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-label-sm font-label-sm text-outline uppercase tracking-wider block">CVV Security Code</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2.5 text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary text-center font-mono"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-2 cursor-pointer text-body-sm font-body-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={e => setSaveCard(e.target.checked)}
                      className="rounded text-primary focus:ring-primary border-outline-variant"
                    />
                    <span>Save card securely for future high-performance trips</span>
                  </label>
                </div>
              )}

              {paymentTab === 'wallet' && (
                <div className="p-6 text-center space-y-3 bg-surface-container-low rounded-xl mt-space-md border border-outline-variant/30">
                  <div className="w-12 h-12 rounded-full bg-surface-container-lowest mx-auto flex items-center justify-center text-on-surface shadow-xs">
                    <span className="material-symbols-outlined text-[28px]">contactless</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface">Apple Pay &amp; Google Wallet Ready</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto">
                    You can authorize this reservation seamlessly with Touch ID / Face ID. Your digital key is linked to your device wallet instantly.
                  </p>
                </div>
              )}

              {paymentTab === 'upi' && (
                <div className="p-6 text-center space-y-3 bg-surface-container-low rounded-xl mt-space-md border border-outline-variant/30">
                  <div className="w-12 h-12 rounded-full bg-surface-container-lowest mx-auto flex items-center justify-center text-primary shadow-xs">
                    <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface">Direct Bank / UPI Verification</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto">
                    Scan or approve transfer via your banking app. Dynamic zero-fee payment with instant telematics clearance.
                  </p>
                </div>
              )}

              {paymentTab === 'cash' && (
                <div className="p-6 space-y-3 bg-orange-50 border border-orange-200 rounded-xl mt-space-md">
                  <div className="flex items-center gap-2.5 text-secondary font-headline-sm text-headline-sm">
                    <span className="material-symbols-outlined text-[24px]">storefront</span>
                    <span>Pay Cash at Hub Counter</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-secondary-container">
                    Your car reservation will be securely placed on hold at our company hub. You can pay cash or swipe a physical card with our company hub manager prior to 6-digit secret code verification and driver handover.
                  </p>
                </div>
              )}

              {/* Terms Agreement Checkbox */}
              <div className="pt-space-md border-t border-outline-variant/30 mt-space-md">
                <label className="flex items-start gap-2.5 cursor-pointer text-body-sm font-body-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-1 rounded text-primary focus:ring-primary border-outline-variant"
                  />
                  <span>
                    I agree to the <Link to="/policies#terms" target="_blank" className="text-primary hover:underline">VELOCE Rental Agreement</Link>, <Link to="/policies#cancellation" target="_blank" className="text-primary hover:underline">Cancellation Policy</Link>, and authorize biometric license &amp; telemetry speed verification.
                  </span>
                </label>
              </div>
            </div>

            {/* STEP 3 BOTTOM ACTION BAR */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-space-md shadow-sm flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(2);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-ghost"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Back to Verification &amp; Protection</span>
              </button>
              <button
                type="button"
                id="complete-booking-bottom-btn"
                onClick={handleConfirmReservation}
                disabled={processing || !agreed}
                className="btn-primary"
                style={{
                  padding: '0.85rem 2.25rem', borderRadius: 'var(--radius-full)',
                  fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 18px rgba(0,74,198,0.35)'
                }}
              >
                <span>
                  {processing
                    ? 'Processing Reservation & Payment...'
                    : paymentTab === 'cash'
                    ? `Hold Bay 14B • Pay ₹${Math.round(totalDueNow).toLocaleString('en-IN')} at Hub`
                    : `Pay ₹${Math.round(totalDueNow).toLocaleString('en-IN')} & Complete Booking`}
                </span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </>
        )}

      </div>

          {/* RIGHT COLUMN: Sticky Order Summary Card (Dark Panel from Image 1) */}
          <aside className="lg:col-span-5 xl:col-span-4 min-w-0 sticky top-24 space-y-4">
            <div className="bg-[#202226] text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/10 flex flex-col gap-5 min-w-0">
              
              {/* Header & Car Preview */}
              <div>
                <span className="text-[11px] font-mono tracking-widest text-[#F5A623] uppercase font-bold block mb-3">
                  RESERVATION SUMMARY
                </span>
                <div className="flex items-center gap-3.5 bg-[#2B2D33] p-3 rounded-2xl border border-white/5">
                  <div className="w-20 h-14 rounded-xl overflow-hidden bg-[#1E2024] shrink-0 border border-white/10 flex items-center justify-center">
                    <img
                      src={car.images?.[0] || car.thumbnail}
                      alt={car.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-white text-base truncate m-0">{car.name}</h3>
                    <p className="text-xs font-semibold text-[#F5A623] uppercase m-0 mt-0.5">{car.category} · {car.transmission}</p>
                    <p className="text-[11px] text-white/60 flex items-center gap-1 truncate m-0 mt-0.5">
                      <span className="material-symbols-outlined text-[13px] text-[#F5A623]">location_on</span>
                      {car.hubLocation || 'Main Downtown Car Hub (Bay 14)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-2 gap-2 bg-[#2B2D33] p-3.5 rounded-2xl border border-white/5 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">DEPARTURE</span>
                  <div className="font-bold text-white text-sm mt-0.5">
                    {new Date(pickupDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[11px] text-white/60">
                    {new Date(pickupDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">RETURN</span>
                  <div className="font-bold text-white text-sm mt-0.5">
                    {new Date(returnDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[11px] text-white/60">
                    {new Date(returnDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="col-span-2 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/60">Duration:</span>
                  <span className="font-bold text-[#F5A623] bg-[#F5A623]/10 px-2.5 py-0.5 rounded-full border border-[#F5A623]/20">
                    {days > 0 ? `${days}d ` : ''}{remHours > 0 ? `${remHours}h` : ''} ({totalHours} hrs)
                  </span>
                </div>
              </div>

              {/* Optional Addons Toggles */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <span className="text-xs font-mono uppercase tracking-wider text-white/70 block font-semibold">Available Extras</span>
                <label className="flex items-center justify-between text-xs cursor-pointer py-1">
                  <span className="flex items-center gap-2 text-white/80">
                    <input
                      type="checkbox"
                      checked={!!selectedAddons.childSeat}
                      onChange={e => setSelectedAddons(p => ({ ...p, childSeat: e.target.checked }))}
                      className="rounded text-[#F5A623] focus:ring-[#F5A623] accent-[#F5A623] w-3.5 h-3.5"
                    />
                    Child Safety Isofix Seat
                  </span>
                  <span className="font-bold text-white">+₹399.00</span>
                </label>

                <label className="flex items-center justify-between text-xs cursor-pointer py-1">
                  <span className="flex items-center gap-2 text-white/80">
                    <input
                      type="checkbox"
                      checked={!!selectedAddons.extraDriver}
                      onChange={e => setSelectedAddons(p => ({ ...p, extraDriver: e.target.checked }))}
                      className="rounded text-[#F5A623] focus:ring-[#F5A623] accent-[#F5A623] w-3.5 h-3.5"
                    />
                    Additional Registered Driver
                  </span>
                  <span className="font-bold text-white">+₹599.00</span>
                </label>

                <label className="flex items-center justify-between text-xs cursor-pointer py-1">
                  <span className="flex items-center gap-2 text-white/80">
                    <input
                      type="checkbox"
                      checked={!!selectedAddons.prepaidFuel}
                      onChange={e => setSelectedAddons(p => ({ ...p, prepaidFuel: e.target.checked }))}
                      className="rounded text-[#F5A623] focus:ring-[#F5A623] accent-[#F5A623] w-3.5 h-3.5"
                    />
                    Prepaid Fuel Return Option
                  </span>
                  <span className="font-bold text-white">+₹1,499.00</span>
                </label>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2.5 border-t border-white/10 pt-3 text-xs">
                <div className="flex justify-between text-white/80">
                  <span>Rental base rate ({totalHours} hrs)</span>
                  <span className="font-semibold text-white">₹{Math.round(baseRate).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-white/80">
                  <span>Coverage ({protectionPlan === 'zero' ? 'Zero Deductible' : 'Standard'})</span>
                  <span className="font-semibold text-white">
                    {protectionCost === 0 ? 'Included' : `₹${Math.round(protectionCost).toLocaleString('en-IN')}`}
                  </span>
                </div>

                {addonsTotal > 0 && (
                  <div className="flex justify-between text-white/80">
                    <span>Selected add-ons</span>
                    <span className="font-semibold text-white">₹{Math.round(addonsTotal).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-white/80">
                  <span>GST &amp; Facility charge (18%)</span>
                  <span className="font-semibold text-white">₹{Math.round(tax).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-white/70 text-[11px] py-1.5 px-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-[#7DAACB]">info</span>
                    Refundable security hold
                  </span>
                  <span>₹{Math.round(securityHold).toLocaleString('en-IN')} (Auth Only)</span>
                </div>

                {/* Fuel Not Included Warning */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-[#E8DBB3]/25 text-[11px] text-[#E8DBB3] font-medium flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5 text-[#CE2626]">local_gas_station</span>
                  <span>Fuel Policy: Fuel is not provided by company. Customer adds own fuel.</span>
                </div>

                {/* Total Due Now */}
                <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-bold text-white block">Total Due Now</span>
                    <span className="text-[10px] font-mono text-white/50">
                      {paymentTab === 'cash' ? 'Payable at Hub Counter' : 'Billed securely now'}
                    </span>
                  </div>
                  <span className="text-3xl font-extrabold text-[#CE2626] font-heading">
                    ₹{Math.round(totalDueNow).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Button: High-Impact Racing Red */}
              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.error('Sign in is required to complete this booking.');
                    navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                  }}
                  className="w-full h-12 rounded-full bg-[#CE2626] hover:bg-[#b31d1d] text-white font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span>Sign In to Complete Booking</span>
                </button>
              ) : currentStep === 2 ? (
                <button
                  type="button"
                  id="right-summary-proceed-btn"
                  onClick={() => {
                    if (!driverName.trim()) {
                      toast.error('Please enter the primary driver name');
                      return;
                    }
                    setCurrentStep(3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full h-12 rounded-full bg-[#CE2626] hover:bg-[#b31d1d] text-white font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <span>Proceed to Step 3: Payment</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="right-summary-pay-btn"
                  onClick={handleConfirmReservation}
                  disabled={processing || !agreed}
                  className="w-full h-12 rounded-full bg-[#CE2626] hover:bg-[#b31d1d] text-white font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
                >
                  <span>
                    {processing
                      ? 'Processing Reservation & Payment...'
                      : paymentTab === 'cash'
                      ? `Hold Bay 14B • Pay ₹${Math.round(totalDueNow).toLocaleString('en-IN')} at Hub`
                      : `Pay ₹${Math.round(totalDueNow).toLocaleString('en-IN')} & Complete Booking`}
                  </span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              )}

              {/* Trust Guarantees */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center text-[11px] text-white/60">
                <p className="m-0 flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[#4ADE80]">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    Free cancellation up to 6h before pickup
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1 text-[#7DAACB]">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    Verified 6-Digit Code Handover
                  </span>
                </p>
              </div>

            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
