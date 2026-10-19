import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { carsApi } from '../lib/api';
import type { Car } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Dynamic booking state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(18, 0, 0, 0);

  const formatDateInput = (d: Date) => d.toISOString().slice(0, 16);

  const getTodayMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const initialPickup = searchParams.get('pickupDateTime') || formatDateInput(tomorrow);
  const safePickup = initialPickup < getTodayMinDateTime() ? formatDateInput(tomorrow) : initialPickup;

  const [pickupDateTime, setPickupDateTime] = useState(safePickup);
  const [returnDateTime, setReturnDateTime] = useState(searchParams.get('returnDateTime') || formatDateInput(dayAfter));
  const [protectionPlan, setProtectionPlan] = useState<'zero' | 'standard'>('zero');
  const [pickupOption, setPickupOption] = useState<'hub' | 'delivery'>('hub');
  const [addons, setAddons] = useState({
    childSeat: false,
    additionalDriver: false,
    prepaidFuel: false,
  });

  const handlePickupChange = (val: string) => {
    const minTime = getTodayMinDateTime();
    if (val < minTime) {
      toast.error('Booking cannot be made for past dates or times. Please select today or coming days.');
      setPickupDateTime(minTime);
      return;
    }
    setPickupDateTime(val);
    if (returnDateTime <= val) {
      const nextDay = new Date(val);
      nextDay.setDate(nextDay.getDate() + 1);
      setReturnDateTime(formatDateInput(nextDay));
    }
  };

  const handleReturnChange = (val: string) => {
    if (val <= pickupDateTime) {
      toast.error('Return date must be strictly after pickup date');
      return;
    }
    setReturnDateTime(val);
  };

  const [availability, setAvailability] = useState<{ available: boolean; availableUnits?: number; totalQuantity?: number; bookedUnits?: number }>({ available: true });

  useEffect(() => {
    if (!id) return;
    carsApi.getById(id)
      .then(res => setCar(res.data.data))
      .catch(() => {
        toast.error('Vehicle not found');
        navigate('/cars');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !pickupDateTime || !returnDateTime) return;
    carsApi.checkAvailability(id, { pickupDateTime, returnDateTime })
      .then(res => setAvailability(res.data.data))
      .catch(() => {});
  }, [id, pickupDateTime, returnDateTime]);

  // Fare calculation in INR (₹)
  const calculatePricing = () => {
    if (!car) return { base: 2800, protection: 999, addonsTotal: 0, tax: 683, total: 4482, durationStr: '2 Days, 8 Hours (56h)' };

    const pickup = new Date(pickupDateTime).getTime();
    const ret = new Date(returnDateTime).getTime();
    const ms = Math.max(ret - pickup, 3600000 * 2); // min 2 hrs
    const totalHours = Math.round(ms / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;

    let base = 0;
    if (days > 0) {
      base = days * (car.pricing?.dailyRate || 2100);
      if (remHours > 0) {
        base += remHours > 12 ? (car.pricing?.dailyRate || 2100) : remHours * (car.pricing?.hourlyRate || 299);
      }
    } else {
      base = totalHours * (car.pricing?.hourlyRate || 299);
    }

    const protection = protectionPlan === 'zero' ? 999 * Math.max(days, 1) : 0;
    let addonsTotal = 0;
    if (addons.childSeat) addonsTotal += 399;
    if (addons.additionalDriver) addonsTotal += 599;
    if (addons.prepaidFuel) addonsTotal += 1499;
    if (pickupOption === 'delivery') addonsTotal += 799;

    const tax = Math.round(((base + protection + addonsTotal) * 0.18) * 100) / 100;
    const total = Math.round((base + protection + addonsTotal + tax) * 100) / 100;
    const durationStr = `${days > 0 ? `${days} Day${days > 1 ? 's' : ''}, ` : ''}${remHours} Hour${remHours > 1 ? 's' : ''} (${totalHours}h)`;

    return { base, protection, addonsTotal, tax, total, durationStr };
  };

  const fare = calculatePricing();

  const handleProceedToCheckout = () => {
    if (!car) return;
    const params = new URLSearchParams({
      pickupDateTime,
      returnDateTime,
      protectionPlan,
      pickupOption,
      addons: JSON.stringify(addons),
    });

    const bookingUrl = `/book/${car._id}?${params.toString()}`;
    if (!user) {
      toast('Please review details. Sign-in is mandatory before booking confirmation.', { icon: 'ℹ️' });
    }
    navigate(bookingUrl);
  };

  if (loading || !car) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--outline)' }}>Loading vehicle specifications...</p>
      </div>
    );
  }

  const galleryImages = car.images && car.images.length > 0 ? car.images : [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBDWj3N4FtPkdGmmRuhfYr7s_5lPLkeEiQTcmRa_5hyQqEJl4RzUna6Pd1LYoncVOYWuaMIVBZwpgdLHCoL4jLnrQwIQmnbndqdzC-MJrZq2vM8MKP651kLfcKTXhQ8t7XMrWizWsUjrdW_duFeL2ItT6sv4YswVWyzgjnUs97bB8y6XhORTaKD5HxT6cF_cYYmNY-VwHFb4u9lhvuJW-Akvmtuz-B9JtbLaMyS8Z1tBF1LGGbGmDCoxQ'
  ];

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', paddingTop: '5.25rem', paddingBottom: '8rem' }}>
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1.5rem 3rem' }}>
        
        {/* ================= BREADCRUMB NAVIGATION ================= */}
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--outline)' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>home</span>
            <span>Home</span>
          </Link>
          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>chevron_right</span>
          <Link to="/cars" style={{ color: 'inherit', textDecoration: 'none' }}>Explore Fleet</Link>
          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>chevron_right</span>
          <span style={{ textTransform: 'capitalize' }}>{car.category}</span>
          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>chevron_right</span>
          <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{car.name}</span>
        </nav>

        {/* ================= VEHICLE TITLE & STATUS RIBBON ================= */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
          paddingBottom: '1.5rem', borderBottom: '1px solid rgba(195, 198, 215, 0.4)', gap: '1rem', marginBottom: '2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)', backgroundColor: '#dcfce7', color: '#15803d',
                fontWeight: 700, fontSize: '0.78rem'
              }}>
                <span style={{ width: '0.4rem', height: '0.4rem', borderRadius: '50%', backgroundColor: availability.available ? '#15803d' : '#ef4444' }}></span>
                {availability.available
                  ? `Available at ${car.hubLocation || 'Main Car Hub'} (${availability.availableUnits !== undefined ? availability.availableUnits : car.totalQuantity || 1} Free)`
                  : 'Fully Booked for Selected Time'}
              </span>
              <span style={{
                padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--surface-container)', color: 'var(--tertiary)', fontSize: '0.78rem', fontWeight: 600
              }}>
                Chassis {car.year} · 📦 {car.totalQuantity || 1} Cars in Fleet
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, color: 'var(--on-surface)', margin: '0 0 0.25rem' }}>
              {car.name}
            </h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', margin: 0 }}>
              {car.description}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied to clipboard!'); }}
              className="btn-secondary"
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>share</span>
              Share
            </button>
            <button
              type="button"
              onClick={() => toast.success('Vehicle saved to favorites!')}
              className="btn-secondary"
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>favorite</span>
              Save
            </button>
          </div>
        </div>

        {/* ================= 2-COLUMN SPLIT DESKTOP GRID ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(340px, 1fr)', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* ================= LEFT COLUMN (60% - SPECS & DETAILS) ================= */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Interactive Photo Gallery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                position: 'relative', width: '100%', height: '420px', borderRadius: '1.25rem',
                overflow: 'hidden', border: '1px solid rgba(195,198,215,0.4)', backgroundColor: 'var(--surface-container-low)'
              }}>
                <img
                  src={galleryImages[activeImageIndex] || galleryImages[0]}
                  alt={car.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <span style={{
                    backgroundColor: 'rgba(11,28,48,0.8)', backdropFilter: 'blur(8px)',
                    color: '#ffffff', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>photo_camera</span>
                    Verified Vehicle Photos
                  </span>
                </div>

                <div style={{
                  position: 'absolute', bottom: '1rem', right: '1rem',
                  backgroundColor: 'rgba(11, 28, 48, 0.92)', backdropFilter: 'blur(8px)', color: '#ffffff',
                  padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#10b981' }}>vpn_key</span>
                  In-Person 6-Digit Code Handover
                </div>
              </div>

              {/* Thumbnails */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      height: '5.5rem', borderRadius: '0.75rem', overflow: 'hidden', padding: 0,
                      border: activeImageIndex === idx ? '2px solid var(--primary)' : '1px solid rgba(195,198,215,0.4)',
                      outline: 'none', cursor: 'pointer', position: 'relative'
                    }}
                  >
                    <img src={img} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', bottom: '0.25rem', right: '0.25rem', backgroundColor: 'rgba(0,0,0,0.65)', color: '#ffffff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {['Front', 'Cockpit', 'Rear', 'Profile'][idx] || `View ${idx + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Readout (6 Bento Metric Cards) */}
            <div className="card-veloce" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>speed</span>
                  Performance Readout
                </h2>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--outline)', fontWeight: 700 }}>
                  Telemetric Certified
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '0.9rem', borderRadius: '0.75rem', border: '1px solid rgba(195,198,215,0.3)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--primary)' }}>bolt</span>
                    Max Output
                  </span>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--on-surface)', marginTop: '0.25rem' }}>
                    434 <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>HP</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>406 lb-ft torque</span>
                </div>

                <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '0.9rem', borderRadius: '0.75rem', border: '1px solid rgba(195,198,215,0.3)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--primary)' }}>timer</span>
                    0-60 MPH
                  </span>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--on-surface)', marginTop: '0.25rem' }}>
                    4.1 <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>sec</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>w/ Sport Chrono</span>
                </div>

                <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '0.9rem', borderRadius: '0.75rem', border: '1px solid rgba(195,198,215,0.3)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--primary)' }}>air</span>
                    Top Speed
                  </span>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--on-surface)', marginTop: '0.25rem' }}>
                    169 <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>mph</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>Track calibrated</span>
                </div>

                <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '0.9rem', borderRadius: '0.75rem', border: '1px solid rgba(195,198,215,0.3)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--primary)' }}>alt_route</span>
                    Drivetrain
                  </span>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--on-surface)', marginTop: '0.25rem' }}>
                    AWD
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>Active Coupling</span>
                </div>

                <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '0.9rem', borderRadius: '0.75rem', border: '1px solid rgba(195,198,215,0.3)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--primary)' }}>settings_suggest</span>
                    Engine
                  </span>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--on-surface)', marginTop: '0.25rem' }}>
                    {car.fuelType === 'electric' ? 'Dual Motor' : '2.9L'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>{car.fuelType === 'electric' ? 'EV Battery' : 'Twin-Turbo V6'}</span>
                </div>

                <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '0.9rem', borderRadius: '0.75rem', border: '1px solid rgba(195,198,215,0.3)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--primary)' }}>local_gas_station</span>
                    Fuel Policy
                  </span>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--on-surface)', marginTop: '0.25rem' }}>
                    93 Oct
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>Full-to-Full</span>
                </div>
              </div>
            </div>

            {/* Included Cockpit & Cabin Features */}
            <div className="card-veloce" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>verified</span>
                Included Cockpit &amp; Cabin Features
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {[
                  { icon: 'pin', title: '6-Digit Secret Code Handover', desc: 'Driver meets you with keys upon verifying your 6-digit code.' },
                  { icon: 'speaker', title: 'Bose® Surround Audio', desc: '14-speaker 710-watt high-fidelity acoustic sound staging.' },
                  { icon: 'airline_seat_recline_extra', title: 'Heated Sport Seats', desc: '18-way adaptive memory sport seats with ventilation.' },
                  { icon: 'radar', title: 'Adaptive Cruise Control', desc: 'Lane keep assist and radar speed pacing for effortless highway trips.' },
                  { icon: 'phonelink', title: 'Wireless CarPlay & Android Auto', desc: 'Seamless screen mirror and fast Qi inductive phone charging pad.' },
                  { icon: 'view_in_ar', title: '360° Surround View', desc: 'High-def bird\'s eye camera array with ultrasonic parking guidance.' },
                ].map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', padding: '0.85rem', borderRadius: '0.75rem', backgroundColor: 'var(--surface-container-low)', border: '1px solid rgba(195,198,215,0.3)' }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'var(--surface-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>{feat.icon}</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.15rem' }}>{feat.title}</p>
                      <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pickup Location & Handover */}
            <div className="card-veloce" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>location_on</span>
                Pickup Location &amp; Handover Process
              </h2>

              <div style={{
                padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(0,74,198,0.2)',
                backgroundColor: 'rgba(239, 244, 255, 0.8)', display: 'flex', flexWrap: 'wrap',
                justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{car.hubLocation || 'Main Downtown Car Hub'}</span>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700 }}>
                      Bay 14
                    </span>
                  </div>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                    Driver meets you at Bay 14 with vehicle keys upon verifying your 6-digit booking code. Customer provides fuel for journey.
                  </p>
                </div>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem',
                  fontWeight: 700, color: 'var(--primary)', background: '#ffffff', padding: '0.4rem 0.8rem',
                  borderRadius: '0.5rem', border: '1px solid rgba(195,198,215,0.4)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>key</span>
                  In-Person Handover
                </span>
              </div>

              {/* Pickup Radio Options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <label style={{
                  border: pickupOption === 'hub' ? '2px solid var(--primary)' : '1px solid rgba(195,198,215,0.5)',
                  backgroundColor: pickupOption === 'hub' ? 'rgba(0,74,198,0.04)' : 'var(--surface-container-lowest)',
                  borderRadius: '0.75rem', padding: '1rem', display: 'flex', gap: '0.75rem', cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="pickupOption"
                    checked={pickupOption === 'hub'}
                    onChange={() => setPickupOption('hub')}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
                  />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Company Hub Handover (Free)</p>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                      Meet driver at company hub. 6-digit secret code verification with zero counter queues.
                    </p>
                  </div>
                </label>

                <label style={{
                  border: pickupOption === 'delivery' ? '2px solid var(--primary)' : '1px solid rgba(195,198,215,0.5)',
                  backgroundColor: pickupOption === 'delivery' ? 'rgba(0,74,198,0.04)' : 'var(--surface-container-lowest)',
                  borderRadius: '0.75rem', padding: '1rem', display: 'flex', gap: '0.75rem', cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="pickupOption"
                    checked={pickupOption === 'delivery'}
                    onChange={() => setPickupOption('delivery')}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Concierge Delivery</p>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--secondary)' }}>+₹799</span>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                      White-glove handover at your hotel, home, or office within 25 miles.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Rental Policies Standards */}
            <div className="card-veloce" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>policy</span>
                Rental Policies &amp; Fleet Standards
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'var(--surface-container-low)', border: '1px solid rgba(195,198,215,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', marginBottom: '0.4rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>pin_drop</span>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--on-surface)' }}>Mileage Allowance</span>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.82rem', margin: 0 }}>300 free miles per 24-hr cycle included.</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(195,198,215,0.3)' }}>
                    $0.35/extra mi afterwards
                  </span>
                </div>

                <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#fef3c7', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', marginBottom: '0.4rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>local_gas_station</span>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e' }}>Fuel Not Included</span>
                    </div>
                    <p style={{ color: '#78350f', fontSize: '0.82rem', margin: 0 }}>Company provides vehicle only for booked time period. Customer adds own fuel.</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #fde68a', fontWeight: 600 }}>
                    Customer Refuels Tank
                  </span>
                </div>

                <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'var(--surface-container-low)', border: '1px solid rgba(195,198,215,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', marginBottom: '0.4rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>credit_card</span>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--on-surface)' }}>Security Hold</span>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.82rem', margin: 0 }}>$200 refundable authorization hold upon start.</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(195,198,215,0.3)' }}>
                    Auto-released within 2 hours
                  </span>
                </div>
              </div>
            </div>

          </section>

          {/* ================= RIGHT COLUMN (40% - STICKY BOOKING CALCULATOR) ================= */}
          <aside style={{ position: 'sticky', top: '6rem' }}>
            <div className="card-veloce" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 12px 30px rgba(11,28,48,0.1)' }}>
              
              {/* Pricing Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: '1rem', borderBottom: '1px solid rgba(195,198,215,0.4)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>Self-Drive Day Rate</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', marginTop: '0.1rem' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.85rem', color: 'var(--on-surface)' }}>
                      ₹{car.pricing?.dailyRate?.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>/ day</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--outline)', fontWeight: 700 }}>
                    Hourly Flex
                  </span>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)', margin: '0.1rem 0 0' }}>
                    ₹{car.pricing?.hourlyRate?.toLocaleString('en-IN')} / hour
                  </p>
                </div>
              </div>

              {/* Trip Date & Time Selector */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Select Trip Duration
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(0,74,198,0.08)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
                    {fare.durationStr}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', background: 'var(--surface-container-low)', padding: '0.6rem', borderRadius: '0.75rem' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid rgba(195,198,215,0.3)' }}>
                    <label style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--outline)', fontWeight: 700, display: 'block' }}>Pick-up</label>
                    <input
                      type="datetime-local"
                      value={pickupDateTime}
                      min={getTodayMinDateTime()}
                      onChange={e => handlePickupChange(e.target.value)}
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface)', marginTop: '0.2rem' }}
                    />
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid rgba(195,198,215,0.3)' }}>
                    <label style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--outline)', fontWeight: 700, display: 'block' }}>Return</label>
                    <input
                      type="datetime-local"
                      value={returnDateTime}
                      min={pickupDateTime || getTodayMinDateTime()}
                      onChange={e => handleReturnChange(e.target.value)}
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface)', marginTop: '0.2rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Protection & Coverage */}
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
                  Protection &amp; Coverage
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{
                    border: protectionPlan === 'zero' ? '2px solid var(--primary)' : '1px solid rgba(195,198,215,0.5)',
                    backgroundColor: protectionPlan === 'zero' ? 'rgba(0,74,198,0.04)' : '#ffffff',
                    borderRadius: '0.75rem', padding: '0.85rem', display: 'flex', gap: '0.6rem', cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="protectionPlan"
                      checked={protectionPlan === 'zero'}
                      onChange={() => setProtectionPlan('zero')}
                      style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Premium Zero-Deductible</span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>+₹999.00/d</span>
                      </div>
                      <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>
                        ₹0 damage responsibility, tire/wheel protection, and 24/7 prioritized roadside dispatch.
                      </p>
                    </div>
                  </label>

                  <label style={{
                    border: protectionPlan === 'standard' ? '2px solid var(--primary)' : '1px solid rgba(195,198,215,0.5)',
                    backgroundColor: protectionPlan === 'standard' ? 'rgba(0,74,198,0.04)' : '#ffffff',
                    borderRadius: '0.75rem', padding: '0.85rem', display: 'flex', gap: '0.6rem', cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="protectionPlan"
                      checked={protectionPlan === 'standard'}
                      onChange={() => setProtectionPlan('standard')}
                      style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Standard Basic</span>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--outline)' }}>Included</span>
                      </div>
                      <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>
                        Complimentary state minimum coverage with ₹15,000 damage responsibility.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Trip Add-ons */}
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                  Trip Add-ons
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(195,198,215,0.3)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={addons.childSeat}
                        onChange={e => setAddons({ ...addons, childSeat: e.target.checked })}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>Child Safety Isofix Seat</span>
                    </div>
                    <span style={{ color: 'var(--on-surface-variant)', fontWeight: 600 }}>+₹399.00</span>
                  </label>

                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(195,198,215,0.3)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={addons.additionalDriver}
                        onChange={e => setAddons({ ...addons, additionalDriver: e.target.checked })}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>Additional Registered Driver</span>
                    </div>
                    <span style={{ color: 'var(--on-surface-variant)', fontWeight: 600 }}>+₹599.00</span>
                  </label>

                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(195,198,215,0.3)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={addons.prepaidFuel}
                        onChange={e => setAddons({ ...addons, prepaidFuel: e.target.checked })}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>Prepaid Fuel (Return at any level)</span>
                    </div>
                    <span style={{ color: 'var(--on-surface-variant)', fontWeight: 600 }}>+₹1,499.00</span>
                  </label>
                </div>
              </div>

              {/* Price Summary Breakdown */}
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(195,198,215,0.4)', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)' }}>
                  <span>Rental base rate</span>
                  <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>₹{Math.round(fare.base).toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)' }}>
                  <span>Protection &amp; Cover plan</span>
                  <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>
                    {fare.protection === 0 ? 'Included' : `₹${Math.round(fare.protection).toLocaleString('en-IN')}`}
                  </span>
                </div>

                {fare.addonsTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)' }}>
                    <span>Selected add-ons &amp; delivery</span>
                    <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>₹{Math.round(fare.addonsTotal).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)' }}>
                  <span>GST &amp; facility charge (18%)</span>
                  <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>₹{Math.round(fare.tax).toLocaleString('en-IN')}</span>
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem',
                  padding: '0.4rem 0.6rem', borderRadius: '4px', background: 'var(--surface-container-low)',
                  border: '1px solid rgba(195,198,215,0.3)', color: 'var(--outline)', margin: '0.2rem 0'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>info</span>
                    Refundable security hold
                  </span>
                  <span>₹{(car.pricing?.securityDeposit || 5000).toLocaleString('en-IN')} (Auth Only)</span>
                </div>

                {/* Total Due Now */}
                <div style={{ paddingTop: '0.6rem', borderTop: '1px solid rgba(195,198,215,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.95rem', display: 'block' }}>Total Due Now</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>All hub fees &amp; taxes included</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)' }}>
                    ₹{Math.round(fare.total).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {!availability.available && (
                <div style={{
                  padding: '0.75rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5',
                  borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>warning</span>
                  <span>All {car.totalQuantity || 1} units of this car are booked for your selected timing. Please change pickup/return times.</span>
                </div>
              )}

              {/* Primary CTA */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={!availability.available}
                className="btn-primary"
                style={{
                  width: '100%', height: '3.2rem', fontSize: '1rem', marginTop: '0.5rem',
                  opacity: availability.available ? 1 : 0.6,
                  cursor: availability.available ? 'pointer' : 'not-allowed'
                }}
              >
                <span>{availability.available ? 'Proceed to Checkout' : 'Unavailable for Selected Dates'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_forward</span>
              </button>

              {/* Trust Guarantees */}
              <div style={{ padding: '0.75rem', background: 'var(--surface-container-low)', borderRadius: '0.75rem', border: '1px solid rgba(195,198,215,0.3)', textAlign: 'center', fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>
                <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Free cancellation up to 6h before pickup</span>
                <span style={{ margin: '0 0.4rem', color: 'var(--outline)' }}>•</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>100% In-Person Driver Handover</span>
              </div>

            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
