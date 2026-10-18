import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, CreditCard, Banknote, CheckCircle, ArrowRight } from 'lucide-react';
import { carsApi, bookingsApi } from '../lib/api';
import { Car } from '../types';
import { LoadingPage, formatCurrency, formatDateTime } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

type Step = 1 | 2 | 3;

export default function BookingPage() {
  const { carId } = useParams<{ carId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const pickupDateTime = searchParams.get('pickupDateTime') || '';
  const returnDateTime = searchParams.get('returnDateTime') || '';

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const [customerDetails, setCustomerDetails] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    drivingLicenceNumber: '',
  });
  const [booking, setBooking] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!carId || !pickupDateTime || !returnDateTime) { navigate('/cars'); return; }
    carsApi.getById(carId).then(r => {
      setCar(r.data.data);
      setCustomerDetails(p => ({ ...p, name: user.name, email: user.email, phone: user.phone }));
    }).catch(() => navigate('/cars')).finally(() => setLoading(false));
  }, [carId]);

  const calcFare = () => {
    if (!car) return null;
    const ms = new Date(returnDateTime).getTime() - new Date(pickupDateTime).getTime();
    if (ms <= 0) return null;
    const totalHours = ms / (1000 * 60 * 60);
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;
    let rental = 0;
    if (days > 0) {
      rental = days * car.pricing.dailyRate;
      if (remHours > 0) rental += remHours > 12 ? car.pricing.dailyRate : remHours * car.pricing.hourlyRate;
    } else {
      rental = totalHours * car.pricing.hourlyRate;
    }
    const taxes = Math.round(rental * 0.18);
    const total = Math.round(rental + taxes + car.pricing.securityDeposit);
    return { rental: Math.round(rental), taxes, total, deposit: car.pricing.securityDeposit, totalHours, days, remHours };
  };

  const fare = calcFare();

  const handleConfirmBooking = async () => {
    if (!agreed) { toast.error('Please agree to the terms and conditions'); return; }
    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      toast.error('Please fill in all required fields'); return;
    }
    setProcessing(true);
    try {
      const res = await bookingsApi.create({
        carId,
        pickupDateTime,
        returnDateTime,
        paymentMethod,
        customerDetails,
      });
      setBooking(res.data.data);
      if (paymentMethod === 'cash') {
        navigate(`/booking-confirmation/${res.data.data._id}?method=cash`);
      } else {
        setStep(3);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDemoPayment = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      await bookingsApi.createPaymentOrder(booking._id);
      await bookingsApi.verifyPayment(booking._id, {
        razorpayPaymentId: `pay_DEMO_${Date.now()}`,
        razorpayOrderId: `order_DEMO_${Date.now()}`,
        razorpaySignature: 'demo_signature',
      });
      toast.success('🎉 Payment successful! Booking confirmed.');
      navigate(`/booking-confirmation/${booking._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingPage />;
  if (!car || !fare) return null;

  const steps = [
    { num: 1, label: 'Details' },
    { num: 2, label: 'Review' },
    { num: 3, label: 'Payment' },
  ];

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh' }}>
      <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: 900 }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>Book <span className="gold-gradient">{car.name}</span></h1>

        {/* Steps */}
        <div className="steps">
          {steps.map((s, i) => (
            <div key={s.num} className="step">
              <div className={`step-circle ${step > s.num ? 'completed' : step === s.num ? 'active' : 'inactive'}`}>
                {step > s.num ? <CheckCircle size={16} /> : s.num}
              </div>
              <span className={`step-label ${step === s.num ? 'active' : ''}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`step-connector ${step > s.num ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(280px, 380px)', gap: '2rem', alignItems: 'start' }}>
          {/* Main */}
          <div>
            {/* Step 1: Customer Details */}
            {step === 1 && (
              <div className="card card-body">
                <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Your Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" value={customerDetails.name} onChange={e => setCustomerDetails(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input className="form-control" type="tel" value={customerDetails.phone} onChange={e => setCustomerDetails(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Email Address *</label>
                    <input className="form-control" type="email" value={customerDetails.email} onChange={e => setCustomerDetails(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Driving Licence Number</label>
                    <input className="form-control" placeholder="e.g. KA0120200001234" value={customerDetails.drivingLicenceNumber} onChange={e => setCustomerDetails(p => ({ ...p, drivingLicenceNumber: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Address</label>
                    <input className="form-control" placeholder="Your current address" value={customerDetails.address} onChange={e => setCustomerDetails(p => ({ ...p, address: e.target.value }))} />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>Payment Method</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {([
                      { val: 'online', icon: CreditCard, label: 'Online Payment', sub: 'Pay now via Razorpay (Demo)' },
                      { val: 'cash', icon: Banknote, label: 'Cash on Pickup', sub: 'Pay when you collect the car' },
                    ] as const).map(opt => (
                      <button key={opt.val} onClick={() => setPaymentMethod(opt.val)}
                        style={{ padding: '1rem', border: `1.5px solid ${paymentMethod === opt.val ? 'var(--gold)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius)', background: paymentMethod === opt.val ? 'rgba(201,168,76,0.06)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <opt.icon size={20} style={{ color: paymentMethod === opt.val ? 'var(--gold)' : 'var(--text-secondary)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.93rem', color: paymentMethod === opt.val ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{opt.label}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => setStep(2)}>
                  Continue to Review <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="card card-body">
                <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Review Your Booking</h3>

                <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {[
                    ['Car', `${car.name} (${car.year})`],
                    ['Pickup', formatDateTime(pickupDateTime)],
                    ['Return', formatDateTime(returnDateTime)],
                    ['Duration', `${fare.days > 0 ? `${fare.days}d ` : ''}${fare.remHours > 0 ? `${fare.remHours.toFixed(1)}h` : ''}`],
                    ['Name', customerDetails.name],
                    ['Email', customerDetails.email],
                    ['Phone', customerDetails.phone],
                    ['Payment', paymentMethod === 'online' ? 'Online (Demo)' : 'Cash on Pickup'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{label}</span>
                      <span style={{ fontWeight: 500, fontSize: '0.88rem', textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                    </div>
                  ))}
                </div>

                <div className="alert alert-gold">
                  🚗 <strong>Self-Drive Reminder:</strong> You will be driving the car yourself. A valid driving licence is required at pickup.
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', margin: '1.25rem 0', padding: '1rem', background: 'var(--bg-600)', borderRadius: 'var(--radius)' }}>
                  <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    style={{ accentColor: 'var(--gold)', width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
                  <label htmlFor="terms" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.6 }}>
                    I agree to the <a href="/policies#terms" target="_blank" style={{ color: 'var(--gold)' }}>Terms & Conditions</a>, <a href="/policies#cancellation" target="_blank" style={{ color: 'var(--gold)' }}>Cancellation Policy</a>, and confirm I hold a valid driving licence.
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirmBooking} disabled={processing || !agreed}>
                    {processing ? 'Processing...' : paymentMethod === 'cash' ? 'Confirm Cash Booking' : 'Proceed to Payment'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Demo Payment */}
            {step === 3 && booking && (
              <div className="card card-body" style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <CreditCard size={28} style={{ color: 'var(--gold)' }} />
                </div>
                <h3 style={{ fontFamily: 'Inter,sans-serif', fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Complete Payment</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Amount: <strong style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>{formatCurrency(fare.total)}</strong>
                </p>
                <div className="alert alert-warning" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  🧪 <strong>Demo Mode:</strong> This is a simulated payment. No real money is charged.
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleDemoPayment} disabled={processing}>
                  {processing ? 'Processing Payment...' : `Pay ${formatCurrency(fare.total)} (Demo)`}
                </button>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.75rem' }}>Powered by Razorpay (Demo Mode)</p>
              </div>
            )}
          </div>

          {/* Sidebar: Price Summary */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="card card-gold card-body">
              <img src={car.images[0]} alt={car.name} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{car.brand}</p>
              <h3 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem' }}>{car.name}</h3>
              <div className="divider" />
              <div className="price-row"><span className="price-row-label">Rental charges</span><span className="price-row-val">{formatCurrency(fare.rental)}</span></div>
              <div className="price-row"><span className="price-row-label">GST (18%)</span><span className="price-row-val">{formatCurrency(fare.taxes)}</span></div>
              <div className="price-row"><span className="price-row-label">Security deposit <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(refundable)</span></span><span className="price-row-val">{formatCurrency(fare.deposit)}</span></div>
              <div className="price-row total">
                <span style={{ fontWeight: 700 }}>Total</span>
                <span className="price-total-val">{formatCurrency(fare.total)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <Shield size={12} style={{ color: 'var(--success)' }} /> Secure booking
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
