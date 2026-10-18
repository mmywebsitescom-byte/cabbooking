import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Fuel, Settings, ChevronLeft, Shield, CheckCircle, AlertCircle, Zap, Calendar } from 'lucide-react';
import { carsApi } from '../lib/api';
import { Car } from '../types';
import { LoadingPage, formatCurrency } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [availResult, setAvailResult] = useState<null | boolean>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!id) return;
    carsApi.getById(id).then(res => setCar(res.data.data)).catch(() => navigate('/cars')).finally(() => setLoading(false));
  }, [id]);

  const minDate = new Date().toISOString().slice(0, 16);

  const calcDuration = () => {
    if (!pickupDate || !returnDate) return null;
    const ms = new Date(returnDate).getTime() - new Date(pickupDate).getTime();
    if (ms <= 0) return null;
    const hours = ms / (1000 * 60 * 60);
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return { hours, days, remHours };
  };

  const calcFare = () => {
    if (!car || !pickupDate || !returnDate) return null;
    const dur = calcDuration();
    if (!dur) return null;
    let rental = 0;
    if (dur.days > 0) {
      rental = dur.days * car.pricing.dailyRate;
      if (dur.remHours > 0) rental += dur.remHours > 12 ? car.pricing.dailyRate : dur.remHours * car.pricing.hourlyRate;
    } else {
      rental = dur.hours * car.pricing.hourlyRate;
    }
    const taxes = Math.round(rental * 0.18);
    const total = Math.round(rental + taxes + car.pricing.securityDeposit);
    return { rental: Math.round(rental), taxes, total, deposit: car.pricing.securityDeposit };
  };

  const checkAvail = async () => {
    if (!id || !pickupDate || !returnDate) return;
    setChecking(true);
    try {
      const res = await carsApi.checkAvailability(id, { pickupDateTime: pickupDate, returnDateTime: returnDate });
      setAvailResult(res.data.data.available);
    } catch { setAvailResult(false); }
    finally { setChecking(false); }
  };

  const handleBook = () => {
    if (!user) return navigate('/login', { state: { from: `/cars/${id}` } });
    if (!pickupDate || !returnDate) return;
    navigate(`/book/${id}?pickupDateTime=${encodeURIComponent(pickupDate)}&returnDateTime=${encodeURIComponent(returnDate)}`);
  };

  const fare = calcFare();
  const dur = calcDuration();

  if (loading) return <LoadingPage />;
  if (!car) return <div className="container" style={{ paddingTop: 120 }}><p>Car not found.</p></div>;

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh' }}>
      <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
        {/* Back */}
        <Link to="/cars" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ChevronLeft size={16} /> Back to Fleet
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: '2.5rem', alignItems: 'start' }}>
          {/* Left: Car Info */}
          <div>
            {/* Images */}
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1rem', background: 'var(--bg-700)', height: 340, position: 'relative' }}>
              <img src={car.images[activeImg] || car.images[0]} alt={car.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80'; }} />
            </div>
            {car.images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {car.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} style={{ width: 80, height: 56, borderRadius: 8, overflow: 'hidden', border: `2px solid ${i === activeImg ? 'var(--gold)' : 'var(--border-subtle)'}`, cursor: 'pointer', background: 'none', padding: 0, transition: 'border-color 0.2s' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Details */}
            <div className="card card-body" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span className="badge badge-gold" style={{ textTransform: 'capitalize' }}>{car.category}</span>
                <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{car.transmission}</span>
                <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{car.fuelType}</span>
                {car.year && <span className="badge badge-muted">{car.year}</span>}
              </div>
              <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>{car.name}</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{car.brand} {car.model}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { icon: Users, label: 'Seats', val: `${car.seatingCapacity}` },
                  { icon: car.fuelType === 'electric' ? Zap : Fuel, label: 'Fuel', val: car.fuelType.charAt(0).toUpperCase() + car.fuelType.slice(1) },
                  { icon: Settings, label: 'Gearbox', val: car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1) },
                ].map(m => (
                  <div key={m.label} style={{ background: 'var(--bg-600)', borderRadius: 10, padding: '0.9rem', textAlign: 'center' }}>
                    <m.icon size={18} style={{ color: 'var(--gold)', marginBottom: '0.4rem', display: 'block', margin: '0 auto 0.4rem' }} />
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{m.label}</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{m.val}</p>
                  </div>
                ))}
              </div>

              {car.description && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.93rem' }}>{car.description}</p>}

              <h4 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Features</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {car.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-600)', padding: '0.35rem 0.75rem', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={12} style={{ color: 'var(--success)' }} /> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Booking Widget */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="card card-gold card-body">
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.2rem' }}>Starting from</p>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span className="car-price-val" style={{ fontSize: '1.6rem' }}>₹{car.pricing.hourlyRate}<span style={{ fontSize: '0.9rem', fontFamily: 'Inter,sans-serif', fontWeight: 400, color: 'var(--text-secondary)' }}>/hr</span></span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>₹{car.pricing.dailyRate}/day</span>
                </div>
              </div>

              <div className="divider" />

              <div className="form-group">
                <label className="form-label"><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Pickup Date & Time</label>
                <input type="datetime-local" className="form-control" min={minDate} value={pickupDate} onChange={e => { setPickupDate(e.target.value); setAvailResult(null); }} />
              </div>
              <div className="form-group">
                <label className="form-label"><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Return Date & Time</label>
                <input type="datetime-local" className="form-control" min={pickupDate || minDate} value={returnDate} onChange={e => { setReturnDate(e.target.value); setAvailResult(null); }} />
              </div>

              {/* Duration */}
              {dur && (
                <div style={{ background: 'var(--bg-600)', borderRadius: 10, padding: '0.9rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Duration</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {dur.days > 0 ? `${dur.days}d ` : ''}{dur.remHours > 0 ? `${dur.remHours.toFixed(1)}h` : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Fare */}
              {fare && (
                <div style={{ background: 'var(--bg-600)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
                  <div className="price-row" style={{ padding: '0.4rem 0' }}>
                    <span className="price-row-label">Rental charges</span>
                    <span className="price-row-val">{formatCurrency(fare.rental)}</span>
                  </div>
                  <div className="price-row" style={{ padding: '0.4rem 0' }}>
                    <span className="price-row-label">GST (18%)</span>
                    <span className="price-row-val">{formatCurrency(fare.taxes)}</span>
                  </div>
                  <div className="price-row" style={{ padding: '0.4rem 0' }}>
                    <span className="price-row-label">Security deposit <span style={{ fontSize: '0.75rem' }}>(refundable)</span></span>
                    <span className="price-row-val">{formatCurrency(fare.deposit)}</span>
                  </div>
                  <div className="divider" />
                  <div className="price-row total">
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <span className="price-total-val">{formatCurrency(fare.total)}</span>
                  </div>
                </div>
              )}

              {/* Availability */}
              {availResult !== null && (
                <div className={`alert ${availResult ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
                  {availResult ? '✅ Car is available for selected dates!' : '❌ Car is not available for selected dates.'}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                {pickupDate && returnDate && availResult === null && (
                  <button className="btn btn-ghost" onClick={checkAvail} disabled={checking}>
                    {checking ? 'Checking...' : <><Shield size={15} /> Check Availability</>}
                  </button>
                )}
                <button className="btn btn-primary btn-lg" onClick={handleBook}
                  disabled={!pickupDate || !returnDate || availResult === false}>
                  {!user ? 'Sign In to Book' : 'Book This Car'}
                </button>
              </div>

              <div className="divider" style={{ margin: '1.25rem 0 0.75rem' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  `Min. age: ${car.minAgeRequired}+ years`,
                  'Valid driving licence required',
                  `Fuel policy: ${car.fuelPolicy?.replace(/-/g, ' ')}`,
                  `Security deposit: ${formatCurrency(car.pricing.securityDeposit)} (refundable)`,
                ].map(note => (
                  <div key={note} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <AlertCircle size={12} style={{ color: 'var(--gold)', flexShrink: 0 }} /> {note}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .car-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
