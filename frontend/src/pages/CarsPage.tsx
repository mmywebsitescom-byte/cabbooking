import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { carsApi } from '../lib/api';
import type { Car } from '../types';

import { FALLBACK_CARS } from '../data/fallbackCars';

export default function CarsPage() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';

  const [cars, setCars] = useState<Car[]>(FALLBACK_CARS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tariff, setTariff] = useState<'hourly' | 'daily'>('hourly');
  const [maxPrice, setMaxPrice] = useState(6000);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(categoryParam ? [categoryParam] : []);
  const [selectedTransmission, setSelectedTransmission] = useState<string>('all');
  const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Time Period Availability Check State
  const getTodayMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const rawInitialPickup = searchParams.get('pickupDateTime') || '';
  const initialPickup = rawInitialPickup && rawInitialPickup < getTodayMinDateTime() ? '' : rawInitialPickup;
  const initialReturn = searchParams.get('returnDateTime') || '';
  const [pickupDateTime, setPickupDateTime] = useState(initialPickup);
  const [returnDateTime, setReturnDateTime] = useState(initialReturn);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const fetchCars = async (pDT?: string, rDT?: string) => {
    setCheckingAvailability(true);
    try {
      const params: any = {};
      if (pDT && rDT) {
        params.pickupDateTime = pDT;
        params.returnDateTime = rDT;
      }
      const res = await carsApi.getAll(params);
      setCars(res.data.data || []);
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    fetchCars(pickupDateTime, returnDateTime);
  }, [pickupDateTime, returnDateTime]);

  const categoryCounts = cars.reduce((acc: Record<string, number>, car) => {
    acc[car.category] = (acc[car.category] || 0) + 1;
    return acc;
  }, {});

  const fuelCounts = cars.reduce((acc: Record<string, number>, car) => {
    acc[car.fuelType] = (acc[car.fuelType] || 0) + 1;
    return acc;
  }, {});

  const handleClassToggle = (cls: string) => {
    setSelectedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const handleFuelToggle = (fuel: string) => {
    setSelectedFuels(prev =>
      prev.includes(fuel) ? prev.filter(f => f !== fuel) : [...prev, fuel]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setMaxPrice(6000);
    setSelectedClasses([]);
    setSelectedTransmission('all');
    setSelectedFuels([]);
  };

  const filteredCars = cars.filter(car => {
    if (searchTerm && !car.name.toLowerCase().includes(searchTerm.toLowerCase()) && !car.brand.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (tariff === 'hourly' && car.pricing.hourlyRate > maxPrice) return false;
    if (tariff === 'daily' && car.pricing.dailyRate > maxPrice * 8) return false;
    if (selectedClasses.length > 0 && !selectedClasses.includes(car.category.toLowerCase())) return false;
    if (selectedTransmission !== 'all' && car.transmission.toLowerCase() !== selectedTransmission.toLowerCase()) return false;
    if (selectedFuels.length > 0 && !selectedFuels.includes(car.fuelType.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.pricing.hourlyRate - b.pricing.hourlyRate;
    if (sortBy === 'price-high') return b.pricing.hourlyRate - a.pricing.hourlyRate;
    if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
    return (b.reviewCount || 0) - (a.reviewCount || 0);
  });

  const activeFilterCount =
    selectedClasses.length +
    (selectedTransmission !== 'all' ? 1 : 0) +
    selectedFuels.length +
    (searchTerm.trim() ? 1 : 0) +
    (tariff !== 'hourly' ? 1 : 0) +
    (maxPrice < 6000 ? 1 : 0);

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', paddingTop: '5.75rem', width: '100%', overflowX: 'hidden' }}>
      {/* ================= SUB-HEADER BREADCRUMB / FLEET INFO ================= */}
      <section style={{ backgroundColor: 'var(--surface-container-low)', borderBottom: '1px solid rgba(195, 198, 215, 0.4)', padding: '0.65rem 0' }}>
        <div style={{ maxWidth: '96rem', margin: '0 auto', padding: '0 1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', color: 'var(--on-surface-variant)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: 700 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>directions_car</span>
              50 Vehicles in Active Fleet
            </span>
            <span style={{ color: 'var(--outline-variant)' }} className="hidden md:inline">•</span>
            <span style={{ color: 'var(--on-surface)' }} className="hidden md:inline">Rent for Your Exact Time Period</span>
            <span style={{ color: 'var(--outline-variant)' }}>•</span>
            <span style={{ color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>local_gas_station</span>
              Customer Refuels (Fuel Not Included)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', color: 'var(--on-surface-variant)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#15803d', fontWeight: 600 }}>
              <span style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', backgroundColor: '#15803d' }} className="pulse-green"></span>
              Live Available Now
            </span>
            <span style={{ color: 'var(--outline-variant)' }}>|</span>
            <Link to="/policies" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>verified_user</span>
              Mandatory Sign-In Policy
            </Link>
          </div>
        </div>
      </section>

      {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
      <main style={{ maxWidth: '96rem', margin: '0 auto', padding: '1.25rem 1rem 8rem', minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
        <div
          className="cars-layout-responsive"
          style={{
            gridTemplateColumns: showFilters ? undefined : '1fr',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            minWidth: 0,
            width: '100%'
          }}
        >
          
          {/* ================= LEFT SIDEBAR (FILTER PANEL) ================= */}
          {showFilters && (
            <aside className="cars-aside-responsive">
              <div className="card-veloce" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(195,198,215,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>tune</span>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Filter Fleet</h2>
                    {activeFilterCount > 0 && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'var(--primary)', color: '#ffffff', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)' }}>
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={resetFilters}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>restart_alt</span>
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      title="Minimize Filter Sidebar"
                      aria-label="Minimize Filter Sidebar"
                      style={{
                        background: 'var(--surface-container-high)', border: 'none', borderRadius: '0.5rem',
                        width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--on-surface-variant)', transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-container-highest)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--surface-container-high)'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>first_page</span>
                    </button>
                  </div>
                </div>

              {/* Model Search */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.4rem' }}>
                  Model or Manufacturer
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="e.g. Porsche, Tesla, M340i..."
                    style={{
                      width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '0.75rem',
                      border: '1px solid rgba(195,198,215,0.6)', backgroundColor: 'var(--surface-container-low)',
                      fontSize: '0.85rem', color: 'var(--on-surface)', outline: 'none'
                    }}
                  />
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.1rem' }}>
                    search
                  </span>
                </div>
              </div>

              {/* Rental Tariff Toggle */}
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.4rem' }}>
                  Rental Tariff
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--surface-container-high)', padding: '0.2rem', borderRadius: 'var(--radius-full)' }}>
                  <button
                    type="button"
                    onClick={() => setTariff('hourly')}
                    style={{
                      padding: '0.4rem', borderRadius: 'var(--radius-full)', border: 'none',
                      backgroundColor: tariff === 'hourly' ? 'var(--surface-container-lowest)' : 'transparent',
                      color: tariff === 'hourly' ? 'var(--primary)' : 'var(--on-surface-variant)',
                      fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', boxShadow: tariff === 'hourly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Hourly
                  </button>
                  <button
                    type="button"
                    onClick={() => setTariff('daily')}
                    style={{
                      padding: '0.4rem', borderRadius: 'var(--radius-full)', border: 'none',
                      backgroundColor: tariff === 'daily' ? 'var(--surface-container-lowest)' : 'transparent',
                      color: tariff === 'daily' ? 'var(--primary)' : 'var(--on-surface-variant)',
                      fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', boxShadow: tariff === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Daily
                  </button>
                </div>
              </div>

              {/* Price Range Slider */}
              <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(195,198,215,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>Max Rate</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#CE2626', background: '#FFF8ED', border: '1px solid #FDE68A', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    ₹{maxPrice.toLocaleString('en-IN')}/hr
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="6000"
                  step="200"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#CE2626', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--outline)', marginTop: '0.2rem' }}>
                  <span>₹1,000/hr</span>
                  <span>₹3,500/hr</span>
                  <span>₹6,000/hr</span>
                </div>
              </div>

              {/* Vehicle Class Checkboxes */}
              <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(195,198,215,0.3)' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>
                  Vehicle Class
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  {[
                    { id: 'suv', label: 'Sports SUV', count: categoryCounts['suv'] || 0 },
                    { id: 'sedan', label: 'Executive Sedan', count: categoryCounts['sedan'] || 0 },
                    { id: 'electric', label: 'Electric Performance', count: categoryCounts['electric'] || 0 },
                    { id: 'hatchback', label: 'Sport Hatchback', count: categoryCounts['hatchback'] || 0 },
                    { id: 'luxury', label: 'Grand Tourer', count: categoryCounts['luxury'] || 0 },
                  ].map(item => (
                    <label key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(item.id)}
                          onChange={() => handleClassToggle(item.id)}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        {item.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 600 }}>{item.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Transmission */}
              <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(195,198,215,0.3)' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>
                  Transmission
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {['all', 'automatic', 'manual'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTransmission(t)}
                      style={{
                        padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-full)',
                        border: selectedTransmission === t ? 'none' : '1px solid var(--outline-variant)',
                        backgroundColor: selectedTransmission === t ? 'var(--on-surface)' : 'var(--surface)',
                        color: selectedTransmission === t ? '#ffffff' : 'var(--on-surface-variant)',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Power & Fuel */}
              <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(195,198,215,0.3)' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>
                  Power &amp; Fuel
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  {[
                    { id: 'petrol', label: 'Gasoline / Petrol', count: fuelCounts['petrol'] || 0 },
                    { id: 'electric', label: 'Pure Electric (EV)', count: fuelCounts['electric'] || 0 },
                    { id: 'hybrid', label: 'Hybrid Electric', count: fuelCounts['hybrid'] || 0 },
                    { id: 'diesel', label: 'Diesel Turbo', count: fuelCounts['diesel'] || 0 },
                  ].map(f => (
                    <label key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedFuels.includes(f.id)}
                          onChange={() => handleFuelToggle(f.id)}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        {f.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 600 }}>{f.count}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Hub Handover Information Card */}
            <div style={{
              background: 'rgba(220, 233, 255, 0.6)', borderRadius: '1rem',
              padding: '1rem', border: '1px solid rgba(195, 198, 215, 0.4)',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>vpn_key</span>
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>Driver Handover at Hub</p>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.78rem', margin: 0 }}>Driver verifies your 6-digit secret code at our hub &amp; hands over keys.</p>
              </div>
            </div>
          </aside>
        )}

          {/* ================= RIGHT COLUMN (TOOLBAR + CATALOG GRID) ================= */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0, width: '100%' }}>
            
            {/* Real-Time Rental Timing & Booking Conflict Checker Bar */}
            <div className="card-veloce" style={{
              padding: '1.25rem 1.5rem',
              background: pickupDateTime && returnDateTime ? 'rgba(238, 242, 255, 0.85)' : 'var(--surface-container-low)',
              border: pickupDateTime && returnDateTime ? '1.5px solid var(--primary)' : '1px solid rgba(195,198,215,0.4)',
              borderRadius: '1.25rem'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>calendar_clock</span>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Select Rental Timing to Check Live Availability</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', margin: '0.1rem 0 0' }}>
                      Choose your rental start &amp; return times. We will instantly check if other bookings exist and show which cars are free.
                    </p>
                  </div>
                </div>

                {pickupDateTime && returnDateTime && (
                  <button
                    type="button"
                    onClick={() => { setPickupDateTime(''); setReturnDateTime(''); }}
                    style={{
                      background: 'none', border: 'none', color: '#ef4444',
                      fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>close</span>
                    Clear Timing
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--outline)', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Pickup Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={pickupDateTime}
                    min={getTodayMinDateTime()}
                    onChange={e => {
                      const val = e.target.value;
                      if (val && val < getTodayMinDateTime()) {
                        setPickupDateTime(getTodayMinDateTime());
                        return;
                      }
                      setPickupDateTime(val);
                    }}
                    style={{
                      width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.65rem',
                      border: '1px solid rgba(195,198,215,0.6)', backgroundColor: '#ffffff',
                      fontSize: '0.85rem', color: 'var(--on-surface)', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--outline)', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Return Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={returnDateTime}
                    min={pickupDateTime || getTodayMinDateTime()}
                    onChange={e => setReturnDateTime(e.target.value)}
                    style={{
                      width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.65rem',
                      border: '1px solid rgba(195,198,215,0.6)', backgroundColor: '#ffffff',
                      fontSize: '0.85rem', color: 'var(--on-surface)', outline: 'none'
                    }}
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--outline)', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Quick Timing Presets
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const p = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                        const r = new Date(p.getTime() + 8 * 60 * 60 * 1000);
                        setPickupDateTime(p.toISOString().slice(0, 16));
                        setReturnDateTime(r.toISOString().slice(0, 16));
                      }}
                      style={{ padding: '0.35rem 0.65rem', borderRadius: '0.45rem', border: '1px solid rgba(195,198,215,0.6)', background: '#ffffff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Today 8h
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0);
                        const returnDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 0);
                        setPickupDateTime(tomorrow.toISOString().slice(0, 16));
                        setReturnDateTime(returnDay.toISOString().slice(0, 16));
                      }}
                      style={{ padding: '0.35rem 0.65rem', borderRadius: '0.45rem', border: '1px solid rgba(195,198,215,0.6)', background: '#ffffff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Tomorrow 24h
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const weekendStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()), 9, 0);
                        const weekendEnd = new Date(weekendStart.getTime() + 48 * 60 * 60 * 1000);
                        setPickupDateTime(weekendStart.toISOString().slice(0, 16));
                        setReturnDateTime(weekendEnd.toISOString().slice(0, 16));
                      }}
                      style={{ padding: '0.35rem 0.65rem', borderRadius: '0.45rem', border: '1px solid rgba(195,198,215,0.6)', background: '#ffffff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Weekend
                    </button>
                  </div>
                </div>
              </div>

              {pickupDateTime && returnDateTime && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(195,198,215,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>event_available</span>
                    Checking booking overlap for selected dates. Cars with zero available units will show as Unavailable.
                  </span>
                  {checkingAvailability && (
                    <span style={{ color: 'var(--outline)', fontSize: '0.78rem' }}>Updating availability...</span>
                  )}
                </div>
              )}
            </div>

            {/* Top Control Bar */}
            <div className="card-veloce" style={{ padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Available Fleet</h1>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)',
                    backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.72rem'
                  }}>
                    <span style={{ width: '0.4rem', height: '0.4rem', borderRadius: '50%', backgroundColor: '#15803d' }}></span>
                    Live Inventory
                  </span>
                </div>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                  Showing {filteredCars.length} of {cars.length} Fleet Vehicles • Rent by Hour or Day • ⛽ Customer Refuels (Fuel Not Included)
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* One button to Open and Close the Left Side Filter Box */}
                <button
                  type="button"
                  id="toggle-filter-box-btn"
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.65rem',
                    border: showFilters ? '1.5px solid rgba(195, 198, 215, 0.7)' : '1.5px solid var(--primary)',
                    backgroundColor: showFilters ? 'var(--surface-container-low)' : 'var(--primary)',
                    color: showFilters ? 'var(--on-surface)' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: showFilters ? '0 2px 6px rgba(11,28,48,0.06)' : '0 4px 14px rgba(0, 74, 198, 0.3)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  title={showFilters ? 'Minimize Left Filter Box' : 'Open Left Filter Box'}
                  aria-label={showFilters ? 'Minimize Left Filter Box' : 'Open Left Filter Box'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                    {showFilters ? 'first_page' : 'tune'}
                  </span>
                  <span>{showFilters ? 'Minimize Filters' : 'Open Filters'}</span>
                  {activeFilterCount > 0 && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      backgroundColor: showFilters ? 'var(--primary)' : '#ffffff',
                      color: showFilters ? '#ffffff' : 'var(--primary)',
                      padding: '0.1rem 0.5rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort by */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label htmlFor="fleet-sort-select" style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Sort by:</label>
                  <select
                    id="fleet-sort-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{
                      backgroundColor: 'var(--surface-container-low)', color: 'var(--on-surface)',
                      fontWeight: 600, fontSize: '0.85rem', padding: '0.45rem 0.8rem',
                      borderRadius: '0.5rem', border: '1px solid rgba(195,198,215,0.6)', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="popular">Most Popular</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Filter Strip when Sidebar is Minimized */}
            {!showFilters && (
              <div
                style={{
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  overflowX: 'auto',
                  border: '1px solid #E8DBB3',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '1rem',
                  maxWidth: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: '#CE2626', fontSize: '1.15rem' }}>filter_list</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#18191B' }}>Quick Filter:</span>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'nowrap', overflowX: 'auto', padding: '0.15rem 0', WebkitOverflowScrolling: 'touch' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedClasses([])}
                    style={{
                      padding: '0.3rem 0.8rem',
                      borderRadius: '9999px',
                      border: '1.5px solid',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      borderColor: selectedClasses.length === 0 ? '#CE2626' : '#E8DBB3',
                      backgroundColor: selectedClasses.length === 0 ? '#CE2626' : '#FFFDEB',
                      color: selectedClasses.length === 0 ? '#FFFFFF' : '#18191B',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    All Fleet ({cars.length})
                  </button>
                  {[
                    { id: 'suv', label: 'SUV' },
                    { id: 'sedan', label: 'Sedan' },
                    { id: 'electric', label: 'EV' },
                    { id: 'luxury', label: 'Luxury' },
                    { id: 'hatchback', label: 'Hatchback' }
                  ].map(cls => {
                    const isSelected = selectedClasses.includes(cls.id);
                    const count = categoryCounts[cls.id] || 0;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleClassToggle(cls.id)}
                        style={{
                          padding: '0.3rem 0.8rem',
                          borderRadius: '9999px',
                          border: '1.5px solid',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          borderColor: isSelected ? '#CE2626' : '#E8DBB3',
                          backgroundColor: isSelected ? '#CE2626' : '#FFFDEB',
                          color: isSelected ? '#FFFFFF' : '#18191B',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cls.label} {count > 0 && `(${count})`}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#CE2626',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>tune</span>
                  More Filters
                </button>
              </div>
            )}

            {/* Fleet Grid */}
            {filteredCars.length === 0 ? (
              <div className="card-veloce" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--outline)', marginBottom: '1rem' }}>no_crash</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No matching vehicles found</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Try clearing some of your filters to view more fleet vehicles.</p>
                <button onClick={resetFilters} className="btn-primary">Reset All Filters</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.25rem' }}>
                {filteredCars.map(car => {
                  const isConflict = pickupDateTime && returnDateTime && car.isAvailableForPeriod === false;
                  const availableUnits = car.availableUnits !== undefined ? car.availableUnits : car.totalQuantity || 1;
                  const totalUnits = car.totalQuantity || 1;

                  return (
                    <article
                      key={car._id}
                      className="card-veloce"
                      style={{
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderRadius: '1rem',
                        opacity: isConflict ? 0.72 : 1,
                        border: isConflict ? '1.5px solid #ef4444' : undefined,
                        boxShadow: isConflict ? 'none' : undefined
                      }}
                    >
                      <div>
                        {/* Visual Header */}
                        <div style={{ position: 'relative', height: '9.5rem', backgroundColor: 'var(--surface-container-low)', overflow: 'hidden' }}>
                          {/* Availability Badge */}
                          {isConflict ? (
                            <span style={{
                              position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 10,
                              padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)',
                              backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 800, fontSize: '0.68rem',
                              display: 'flex', alignItems: 'center', gap: '0.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                              <span style={{ width: '0.4rem', height: '0.4rem', borderRadius: '50%', backgroundColor: '#b91c1c' }}></span>
                              Fully Booked for this Time
                            </span>
                          ) : (
                            <span style={{
                              position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 10,
                              padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)',
                              backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.68rem',
                              display: 'flex', alignItems: 'center', gap: '0.25rem'
                            }}>
                              <span style={{ width: '0.35rem', height: '0.35rem', borderRadius: '50%', backgroundColor: '#15803d' }}></span>
                              {pickupDateTime && returnDateTime
                                ? `${availableUnits} of ${totalUnits} Free`
                                : `${totalUnits} Units in Fleet`}
                            </span>
                          )}

                          <img
                            src={car.images && car.images[0]}
                            alt={car.name}
                            style={{
                              width: '100%', height: '100%', objectFit: 'cover',
                              transition: 'transform 0.4s ease',
                              filter: isConflict ? 'grayscale(40%)' : 'none'
                            }}
                            onMouseEnter={e => !isConflict && (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={e => !isConflict && (e.currentTarget.style.transform = 'scale(1)')}
                          />

                          <div style={{
                            position: 'absolute', bottom: '0.4rem', left: '0.5rem',
                            backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
                            padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--on-surface)'
                          }}>
                            <span style={{ color: '#f59e0b' }}>★</span> {car.rating || 4.95} ({car.reviewCount || 40})
                          </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
                            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', fontWeight: 700 }}>
                              {car.category}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--outline)', fontWeight: 600 }}>
                              📦 {totalUnits} in Fleet
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.1rem 0 0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {car.name}
                          </h3>

                          {/* Hub Location */}
                          <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>location_on</span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {car.hubLocation || 'Main Downtown Car Hub'}
                            </span>
                          </div>

                          {/* 3 Spec items */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem', marginBottom: '0.4rem' }}>
                            <div style={{ background: 'var(--surface-container-low)', padding: '0.3rem 0.2rem', borderRadius: '0.4rem', textAlign: 'center', border: '1px solid rgba(195,198,215,0.3)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--outline)' }}>speed</span>
                              <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, marginTop: '0.05rem' }}>{car.transmission}</span>
                            </div>
                            <div style={{ background: 'var(--surface-container-low)', padding: '0.3rem 0.2rem', borderRadius: '0.4rem', textAlign: 'center', border: '1px solid rgba(195,198,215,0.3)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--outline)' }}>airline_seat_recline_normal</span>
                              <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, marginTop: '0.05rem' }}>{car.seatingCapacity} Seats</span>
                            </div>
                            <div style={{ background: 'var(--surface-container-low)', padding: '0.3rem 0.2rem', borderRadius: '0.4rem', textAlign: 'center', border: '1px solid rgba(195,198,215,0.3)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--outline)' }}>
                                {car.fuelType === 'electric' ? 'electric_bolt' : 'local_gas_station'}
                              </span>
                              <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, marginTop: '0.05rem' }}>
                                {car.fuelType === 'electric' ? 'EV' : 'Gas'}
                              </span>
                            </div>
                          </div>

                          {/* Customer Refuels Notice */}
                          <div style={{
                            padding: '0.25rem 0.45rem', marginTop: '0.35rem',
                            borderRadius: '0.4rem', backgroundColor: '#fef3c7',
                            border: '1px solid #fde68a', fontSize: '0.68rem',
                            color: '#92400e', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '0.25rem'
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>local_gas_station</span>
                            <span>Fuel Not Included • Customer Refuels</span>
                          </div>
                        </div>
                      </div>

                      {/* Price & Action Footer */}
                      <div style={{ padding: '0.75rem 0.85rem 0.85rem', borderTop: '1px solid rgba(195,198,215,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--on-surface)' }}>
                              ₹{car.pricing?.hourlyRate?.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>/hr</span>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--outline)' }}>
                            ₹{car.pricing?.dailyRate?.toLocaleString('en-IN')} / day
                          </span>
                        </div>

                        {isConflict ? (
                          <button
                            type="button"
                            disabled
                            style={{
                              padding: '0.45rem 0.75rem', fontSize: '0.75rem',
                              backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5',
                              borderRadius: '0.5rem', fontWeight: 700, cursor: 'not-allowed'
                            }}
                          >
                            Unavailable
                          </button>
                        ) : (
                          <Link
                            to={`/cars/${car._id}${pickupDateTime && returnDateTime ? `?pickupDateTime=${encodeURIComponent(pickupDateTime)}&returnDateTime=${encodeURIComponent(returnDateTime)}` : ''}`}
                            className="btn-primary"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', gap: '0.25rem' }}
                          >
                            <span>Details &amp; Book</span>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>arrow_forward</span>
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* ================= COMPANY CAR HUB & DRIVER HANDOVER NETWORK BANNER ================= */}
            <div style={{
              backgroundColor: 'var(--surface-container-low)', border: '1px solid rgba(195,198,215,0.4)',
              borderRadius: '1.25rem', padding: '1.75rem', position: 'relative', overflow: 'hidden',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', zIndex: 10, maxWidth: '40rem' }}>
                <div style={{
                  width: '3.2rem', height: '3.2rem', borderRadius: '1rem',
                  backgroundColor: 'var(--primary)', color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>car_repair</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--secondary-fixed)', color: 'var(--on-secondary-fixed)', fontSize: '0.72rem', fontWeight: 700 }}>
                      Company Car Hub Handover
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>In-Person Driver Handover</span>
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.35rem' }}>
                    Main Downtown Car Hub &amp; Express Offices
                  </h4>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                    Visit our company car hub or central office at your reserved time. Meet the company driver, present your 6-digit secret booking code, and receive your vehicle keys in under 30 seconds. Customer provides fuel for their rental.
                  </p>
                </div>
              </div>

              <div style={{ zIndex: 10 }}>
                <Link
                  to="/policies"
                  className="btn-secondary"
                  style={{
                    backgroundColor: 'var(--on-surface)', color: '#ffffff',
                    border: 'none', padding: '0.75rem 1.4rem', fontWeight: 700, fontSize: '0.9rem',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>policy</span>
                  <span>View Handover Policy</span>
                </Link>
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
