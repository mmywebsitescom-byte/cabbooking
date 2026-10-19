import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingsApi } from '../lib/api';
import type { Booking } from '../types';
import { LoadingPage, formatCurrency } from '../components/UI';
import toast from 'react-hot-toast';

export default function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Driver verification simulation state
  const [driverInputCode, setDriverInputCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!id) return;
    bookingsApi.getById(id)
      .then(res => setBooking(res.data.data))
      .catch(err => {
        toast.error(err.response?.data?.error || 'Failed to load booking details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const copyBookingId = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.bookingId);
    setCopiedId(true);
    toast.success('Booking ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copySecretCode = () => {
    if (!booking?.secretCode) return;
    navigator.clipboard.writeText(booking.secretCode);
    setCopiedCode(true);
    toast.success('6-Digit Secret Handover Code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleVerifyCodeByDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    if (!driverInputCode.trim()) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setVerifying(true);
    try {
      const res = await bookingsApi.verifyCode(booking._id, driverInputCode.trim());
      setBooking(res.data.data);
      toast.success('🎉 6-Digit Code Verified! Driver has delivered the vehicle.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Code verification failed. Please check code.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingPage />;
  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto px-gutter-lg py-24 text-center">
        <h2 className="text-headline-lg font-headline-lg text-on-surface">Reservation Not Found</h2>
        <p className="text-body-md text-on-surface-variant my-4">We could not find the reservation details requested.</p>
        <Link to="/cars" className="inline-flex px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg">
          Explore Available Fleet
        </Link>
      </div>
    );
  }

  const car = booking.car;
  const isCash = booking.payment.method === 'cash';
  const secretCode = booking.secretCode || '482916';
  const isDelivered = booking.handoverStatus === 'code_verified_delivered' || booking.status === 'active';

  return (
    <div className="bg-surface text-on-surface min-h-screen py-10 selection:bg-primary selection:text-on-primary" style={{ paddingTop: '6rem', paddingBottom: '8rem' }}>
      <div className="max-w-4xl mx-auto px-gutter-lg">
        
        {/* ================= SUCCESS CELEBRATION HEADER ================= */}
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/50 p-8 md:p-10 text-center shadow-lg mb-8 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[38px]">check_circle</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-label-sm font-label-sm border border-emerald-200 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Booking Confirmed Successfully</span>
          </div>

          <h1 className="text-headline-lg md:text-headline-xl font-headline-xl text-on-surface font-extrabold tracking-tight">
            {isCash ? 'Reservation Held for Pickup!' : 'Payment Complete • Reservation Confirmed!'}
          </h1>

          <p className="text-body-md font-body-md text-on-surface-variant max-w-xl mx-auto mt-2 mb-6">
            Your vehicle is prepared at our company hub/office. Visit our hub where our company driver will verify your 6-digit Secret Code before handing over the keys.
          </p>

          {/* Booking ID Pill */}
          <div className="inline-flex items-center gap-3 bg-surface-container-low px-5 py-2.5 rounded-full border border-outline-variant/40 shadow-xs">
            <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider font-semibold">Booking ID:</span>
            <span className="font-mono text-headline-sm text-sm text-primary font-bold">{booking.bookingId}</span>
            <button
              onClick={copyBookingId}
              type="button"
              className="p-1 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
              title="Copy ID"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copiedId ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* ================= 6-DIGIT SECRET HANDOVER CODE HERO BOX ================= */}
        <div style={{
          background: isDelivered ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'linear-gradient(135deg, #0b1c30 0%, #00224d 100%)',
          borderRadius: '1.5rem', padding: '2rem', marginBottom: '2rem',
          color: isDelivered ? '#065f46' : '#ffffff',
          boxShadow: '0 16px 36px rgba(11,28,48,0.18)',
          border: isDelivered ? '2px solid #10b981' : '2px solid #3b82f6',
          textAlign: 'center'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: '9999px', backgroundColor: isDelivered ? '#a7f3d0' : 'rgba(255,255,255,0.12)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: isDelivered ? '#047857' : '#60a5fa' }}>lock</span>
            <span>{isDelivered ? 'Vehicle Delivered & Handed Over' : 'Secret Verification Code (Show to Driver)'}</span>
          </div>

          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem', opacity: 0.9 }}>
            Your 6-Digit Handover Secret Code
          </h2>
          <p style={{ fontSize: '0.88rem', margin: '0 0 1.5rem', opacity: 0.8, maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto' }}>
            Go to the company car hub or office. When the driver arrives with your car, provide this 6-digit code. The driver verifies the code and delivers the car to you.
          </p>

          {/* 6-DIGIT CODE DISPLAY */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            padding: '1rem 2rem', borderRadius: '1rem',
            backgroundColor: isDelivered ? '#ffffff' : 'rgba(255,255,255,0.08)',
            border: isDelivered ? '2px solid #059669' : '2px solid rgba(255,255,255,0.25)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            marginBottom: '1.25rem'
          }}>
            {secretCode.split('').map((char, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '2.8rem', height: '3.6rem',
                  borderRadius: '0.6rem',
                  backgroundColor: isDelivered ? '#d1fae5' : 'rgba(255,255,255,0.18)',
                  color: isDelivered ? '#065f46' : '#ffffff',
                  fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                {char}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={copySecretCode}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1.25rem', borderRadius: '9999px',
                backgroundColor: isDelivered ? '#059669' : '#ffffff',
                color: isDelivered ? '#ffffff' : '#0b1c30',
                border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                {copiedCode ? 'check' : 'content_copy'}
              </span>
              <span>{copiedCode ? 'Code Copied!' : 'Copy 6-Digit Code'}</span>
            </button>

            {isDelivered && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem', color: '#047857' }}>
                <span className="material-symbols-outlined">verified</span>
                Verified by {booking.deliveredBy || 'Hub Driver'} on {new Date(booking.deliveredAt || Date.now()).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* ================= STEP-BY-STEP HANDOVER GUIDE ================= */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 md:p-8 shadow-sm mb-8">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-extrabold flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[26px]">directions_car</span>
            How to Receive Your Car at Hub / Office
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs mb-3">1</span>
                <h3 className="font-headline-sm text-sm font-bold text-on-surface mb-1">Go to Car Hub / Office</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Head to our Main Downtown Car Hub or Company Office at your scheduled start time.
                </p>
              </div>
              <span className="text-[11px] text-primary font-semibold mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                Bay 14 Staging
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs mb-3">2</span>
                <h3 className="font-headline-sm text-sm font-bold text-on-surface mb-1">Driver Brings Car</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Our company driver arrives with your reserved {car?.name || 'vehicle'} in clean, inspected condition.
                </p>
              </div>
              <span className="text-[11px] text-primary font-semibold mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">person</span>
                Company Driver
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs mb-3">3</span>
                <h3 className="font-headline-sm text-sm font-bold text-on-surface mb-1">Driver Asks for Code</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  The driver asks for your 6-digit Secret Code. Give code <strong className="font-mono text-primary">{secretCode}</strong> to the driver.
                </p>
              </div>
              <span className="text-[11px] text-primary font-semibold mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Code Verification
              </span>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-3">4</span>
                <h3 className="font-headline-sm text-sm font-bold text-on-surface mb-1">Car Delivered!</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Driver delivers the car keys and documents. Customer adds own fuel as needed and continues the journey!
                </p>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">key</span>
                Keys Handed Over
              </span>
            </div>
          </div>

          {/* Interactive Driver Code Verification Simulation Box */}
          <div className="mt-6 pt-5 border-t border-outline-variant/30">
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                  Driver / Hub Handover Terminal
                </span>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isDelivered
                    ? 'Vehicle handover completed! Car delivered to customer.'
                    : 'Driver enters customer\'s 6-digit Secret Code to verify and complete delivery.'}
                </p>
              </div>

              {!isDelivered ? (
                <form onSubmit={handleVerifyCodeByDriver} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    maxLength={6}
                    value={driverInputCode}
                    onChange={e => setDriverInputCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="px-3 py-2 rounded-lg bg-white border border-outline-variant/60 text-sm font-mono font-bold tracking-widest text-center w-40 focus:border-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={verifying}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white font-semibold text-xs whitespace-nowrap shadow-sm disabled:opacity-50"
                  >
                    {verifying ? 'Verifying...' : 'Verify Code & Deliver Car'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDriverInputCode(secretCode)}
                    className="px-2.5 py-2 rounded-lg bg-surface-container-high text-[11px] text-outline font-semibold whitespace-nowrap hover:text-on-surface"
                    title="Auto-fill code for testing"
                  >
                    Auto-fill
                  </button>
                </form>
              ) : (
                <span className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Car Successfully Delivered &amp; Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ================= 2-COLUMN INFO BENTO GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Card 1: Reserved Vehicle */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
                <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">directions_car</span>
                  Allocated Vehicle
                </span>
                <span className="px-2.5 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm uppercase font-semibold">
                  Bay 14B Staging
                </span>
              </div>

              {car && (
                <div>
                  <div className="w-full h-44 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/20 mb-3 flex items-center justify-center">
                    <img
                      src={car.images?.[0] || car.thumbnail}
                      alt={car.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <h3 className="text-headline-sm font-headline-sm text-on-surface">{car.name}</h3>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
                    {car.transmission} • {car.fuelType} • {car.seatingCapacity} Seats • Plate: {car.plateNumber || 'CA-VELO-24'}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-outline-variant/20 space-y-2 text-body-sm mt-4">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
                <div>
                  <span className="text-label-sm text-outline block">Pickup Start Date &amp; Time</span>
                  <span className="font-semibold text-on-surface">
                    {new Date(booking.pickupDateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px]">event_repeat</span>
                <div>
                  <span className="text-label-sm text-outline block">Scheduled Return Date &amp; Time</span>
                  <span className="font-semibold text-on-surface">
                    {new Date(booking.returnDateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                <div>
                  <span className="text-label-sm text-outline block">Pickup Hub / Office Location</span>
                  <span className="font-semibold text-on-surface">{booking.car?.hubLocation || 'Main Downtown Car Hub (Bay 14)'}</span>
                </div>
              </div>

              {/* Fuel reminder badge */}
              <div style={{
                marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                backgroundColor: '#fef3c7', border: '1px solid #fde68a',
                fontSize: '0.75rem', color: '#92400e', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#b45309' }}>local_gas_station</span>
                <span>Fuel Policy: Fuel not provided by company. Customer adds fuel for their time period.</span>
              </div>
            </div>
          </div>

          {/* Card 2: Billing & Driver Details */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
                <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">receipt_long</span>
                  Billing &amp; Payment Summary
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-emerald-100 text-emerald-800 font-bold">
                  {isCash ? 'Held for Cash' : 'Paid in Full'}
                </span>
              </div>

              <div className="space-y-2 text-body-sm font-body-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Rental base rate ({booking.rentalDuration?.totalHours || 48} hrs)</span>
                  <span className="font-semibold text-on-surface">{formatCurrency(booking.pricing.rentalCharges)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Concession Tax &amp; Surcharges (6.6%)</span>
                  <span className="font-semibold text-on-surface">{formatCurrency(booking.pricing.taxes)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Refundable Security Deposit</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(booking.pricing.securityDeposit)} (Auth)</span>
                </div>
                <div className="pt-2 border-t border-outline-variant/30 flex justify-between items-baseline">
                  <span className="font-label-lg text-label-lg text-on-surface font-extrabold">Total Amount</span>
                  <span className="text-headline-md font-headline-md font-extrabold text-primary">
                    {formatCurrency(booking.pricing.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                <div>
                  <span className="text-label-sm text-outline uppercase block">Payment Method</span>
                  <span className="font-semibold text-on-surface text-sm">
                    {isCash ? '💵 Cash at Hub Counter' : '💳 Online Card / Direct'}
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-surface-container text-primary font-semibold">
                  {booking.payment.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/20 text-body-sm mt-4">
              <span className="text-label-sm text-outline uppercase tracking-wider block mb-1">Registered Driver</span>
              <p className="font-semibold text-on-surface">{booking.customerDetails.name}</p>
              <p className="text-on-surface-variant text-xs">{booking.customerDetails.email} • {booking.customerDetails.phone}</p>
              {booking.customerDetails.drivingLicenceNumber && (
                <p className="text-xs text-primary font-mono mt-0.5">License: {booking.customerDetails.drivingLicenceNumber}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors shadow-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
            <span>Print Invoice &amp; Handover Code</span>
          </button>

          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors shadow-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">badge</span>
            <span>View My Bookings</span>
          </Link>

          <Link
            to="/cars"
            className="px-7 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors shadow-md flex items-center gap-2"
          >
            <span>Explore 50 Cars Fleet</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
