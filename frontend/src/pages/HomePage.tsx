import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { carsApi, publicApi } from '../lib/api';
import type { Car as CarType } from '../types';
import ScrollVelocity from '../components/ScrollVelocity';
import ScrollExpand from '../components/ScrollExpand';

const DEFAULT_HERO_BG = '/images/hero-bg.jpg';

const DEFAULT_REVIEWS = [
  {
    id: 'r1',
    author: 'Marcus Vance',
    role: 'Verified Driver • 18 Trips Logged',
    initials: 'MV',
    vehicle: 'BMW M3 Competition',
    quote: '"Arriving at the Main Downtown Hub, meeting the company driver at Bay 14, and having them verify my 6-digit code in 30 seconds before handing me the keys to an immaculate BMW M3 was pure perfection."'
  },
  {
    id: 'r2',
    author: 'Elena Rostova',
    role: 'Verified Driver • 7 Trips Logged',
    initials: 'ER',
    vehicle: 'Porsche 911 Carrera',
    quote: '"Booking online was so simple. Selected my pickup and return times, signed in, got my 6-digit secret code. Driver arrived promptly, verified the code, and I was cruising Big Sur. Fueling up myself was very convenient."'
  },
  {
    id: 'r3',
    author: 'David Thorne',
    role: 'Verified Driver • 24 Trips Logged',
    initials: 'DT',
    vehicle: 'Mercedes-AMG GT',
    quote: '"The car condition is showroom pristine. 50 vehicles to pick from, verified driver handover with the secret code, no long waiting lines or counter bureaucracy. Outstanding experience."'
  },
  {
    id: 'r4',
    author: 'Sarah Jenkins',
    role: 'Verified Driver • 12 Trips Logged',
    initials: 'SJ',
    vehicle: 'Audi RS6 Avant',
    quote: '"The in-person hub handover with the 6-digit PIN eliminates all fraudulent app unlock glitches. Company driver was waiting on the dot. Premium concierge service at reasonable rates."'
  },
  {
    id: 'r5',
    author: 'Liam Patel',
    role: 'Verified Driver • 9 Trips Logged',
    initials: 'LP',
    vehicle: 'Tesla Model S Plaid',
    quote: '"Transparent exact-time billing without hidden airport concessions or surprise deposits. The car had 98% charge and pristine interior. Will definitely book again."'
  },
  {
    id: 'r6',
    author: 'Carlos Mendez',
    role: 'Verified Driver • 15 Trips Logged',
    initials: 'CM',
    vehicle: 'Ford Mustang Dark Horse',
    quote: '"Zero deductible protection gave complete peace of mind on the coastal drive. Swift handoff with secret code verification took under a minute. Absolutely elite."'
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredCars, setFeaturedCars] = useState<CarType[]>([]);
  const [headlineMain, setHeadlineMain] = useState('Your Drive. Your Time.');
  const [headlineHighlight, setHeadlineHighlight] = useState('Your Freedom.');
  const [reviews, setReviews] = useState<any[]>(DEFAULT_REVIEWS);
  const [heroBg, setHeroBg] = useState<string>(() => {
    return localStorage.getItem('veloce_hero_bg') || DEFAULT_HERO_BG;
  });
  const [pickupLocation, setPickupLocation] = useState('DWTN-HUB');
  const [locations, setLocations] = useState<any[]>([]);

  // Helper to format local ISO datetime for min input (prevents past dates)
  const getTodayMinDateTime = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const [departureTime, setDepartureTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const [returnTime, setReturnTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(d.getHours() + 2, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const [carClass, setCarClass] = useState('All');
  const [activeFilter, setActiveFilter] = useState('All');
  const [scrollPercent, setScrollPercent] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Dynamic Scroll Progress and Floating Hero Shortcut Tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = totalH > 0 ? Math.min(100, Math.max(0, (scrollY / totalH) * 100)) : 0;
      setScrollPercent(pct);
      setShowScrollTop(scrollY > 420);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load dynamic pickup locations from backend (admin manageable)
  useEffect(() => {
    publicApi.getLocations()
      .then(res => {
        if (res.data?.data && res.data.data.length > 0) {
          setLocations(res.data.data);
          if (!pickupLocation || pickupLocation === 'DWTN-HUB') {
            setPickupLocation(res.data.data[0].code);
          }
        }
      })
      .catch(() => { });
  }, []);

  // Listen for admin changes to hero background image
  useEffect(() => {
    const handleBgChange = () => {
      const stored = localStorage.getItem('veloce_hero_bg');
      if (stored) setHeroBg(stored);
    };
    window.addEventListener('hero-bg-updated', handleBgChange);
    window.addEventListener('storage', handleBgChange);
    return () => {
      window.removeEventListener('hero-bg-updated', handleBgChange);
      window.removeEventListener('storage', handleBgChange);
    };
  }, []);

  // Fetch CMS and Reviews
  useEffect(() => {
    publicApi.getCms()
      .then(res => {
        if (res.data?.data?.hero) {
          if (res.data.data.hero.headlineMain) setHeadlineMain(res.data.data.hero.headlineMain);
          if (res.data.data.hero.headlineHighlight) setHeadlineHighlight(res.data.data.hero.headlineHighlight);
          if (res.data.data.hero.bgImage) setHeroBg(res.data.data.hero.bgImage);
        }
      })
      .catch(() => { });

    publicApi.getReviews()
      .then(res => {
        if (res.data?.data && res.data.data.length > 0) {
          setReviews(res.data.data);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    carsApi.getAll()
      .then(res => setFeaturedCars(res.data.data || []))
      .catch(() => { });
  }, []);

  // Scrolling animation observer for dynamic reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-scale');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [featuredCars, activeFilter]);

  // Validation: Disallow previous days (only today and coming days)
  const handleDepartureChange = (value: string) => {
    if (!value) return;
    const selected = new Date(value);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (selected < todayStart) {
      toast.error('You cannot book for a previous day. Only bookings for today and future days are permitted.');
      return;
    }

    setDepartureTime(value);

    // Auto-adjust return time if it falls before or equal to departure
    if (new Date(returnTime) <= selected) {
      const nextDay = new Date(selected.getTime() + 24 * 60 * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      setReturnTime(`${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}T${pad(nextDay.getHours())}:${pad(nextDay.getMinutes())}`);
    }
  };

  const handleReturnChange = (value: string) => {
    if (!value) return;
    const ret = new Date(value);
    const dep = new Date(departureTime);

    if (ret <= dep) {
      toast.error('Return time must be after the pickup time.');
      return;
    }
    setReturnTime(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const depDate = new Date(departureTime);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (depDate < todayStart) {
      toast.error('Pickup date cannot be in the past. Only bookings for today and upcoming days are allowed.');
      return;
    }

    if (new Date(returnTime) <= depDate) {
      toast.error('Return time must be after pickup time.');
      return;
    }

    const params = new URLSearchParams();
    if (carClass !== 'All') params.set('category', carClass.toLowerCase());
    if (departureTime) params.set('pickupDateTime', departureTime);
    if (returnTime) params.set('returnDateTime', returnTime);
    if (pickupLocation) params.set('location', pickupLocation);
    navigate(`/cars?${params.toString()}`);
  };

  const categories = [
    {
      id: 'hatchback',
      title: 'Hatchback & Compact',
      price: 'From ₹1,200/hr',
      icon: 'directions_car',
      desc: 'Effortless city parking, rapid agility, and optimal fuel economy for tight urban centers.',
      models: 'Mini Cooper S, Golf GTI',
    },
    {
      id: 'sedan',
      title: 'Performance Sedan',
      price: 'From ₹2,200/hr',
      icon: 'speed',
      desc: 'Executive comfort balanced with blistering horsepower and razor-sharp highway poise.',
      models: 'BMW M340i, Audi S5',
    },
    {
      id: 'suv',
      title: 'Luxury SUV',
      price: 'From ₹2,800/hr',
      icon: 'terrain',
      desc: 'Commanding presence, all-weather AWD stability, and spacious luggage room for coastal tours.',
      models: 'Porsche Macan, Range Rover Velar',
    },
    {
      id: 'electric',
      title: 'Electric & Hybrid',
      price: 'From ₹1,900/hr',
      icon: 'bolt',
      desc: 'Instantaneous torque, automated driver assist, and zero emissions across all major routes.',
      models: 'Tesla Model Y, Polestar 2',
    },
  ];

  const filteredFleet = featuredCars.filter(car => {
    if (activeFilter === 'Pure EV') return car.fuelType === 'electric';
    if (activeFilter === 'High Output (400hp+)') return car.pricing.hourlyRate >= 30;
    if (activeFilter === 'Zero Deposit') return car.pricing.securityDeposit <= 200;
    return true;
  });

  return (
    <div style={{ backgroundColor: 'var(--surface)', position: 'relative' }}>

      {/* ================= HERO SECTION WITH SCROLLEXPAND ANIMATION ================= */}
      <section className="relative w-full bg-[#14161a]" style={{ overflow: 'visible' }}>
        <ScrollExpand
          src={heroBg}
          mediaType="image"
          alt="VELOCE Luxury Fleet"
          title="PURE MOTORING FREEDOM"
          scrollHint="Scroll to expand fleet search"
          startWidth={54}
          startHeight={64}
          startRadius={28}
          endRadius={0}
          mediaZoom={1.25}
          scrollDistance={1.4}
          holdDistance={0.8}
          smoothing={0.06}
          overlayScrim={0.62}
          useWindowScroll={true}
          className="w-full bg-[#14161a]"
        >
          <div className="w-full max-w-[96rem] mx-auto px-3 sm:px-6 md:px-10 flex flex-col items-center justify-center my-auto pt-16 sm:pt-20">
            {/* Centered Hero Header Content */}
            <div style={{ maxWidth: '58rem', margin: '0 auto 2.2rem', textAlign: 'center' }}>
              <h1 style={{
                fontFamily: "'Plus Jakarta Sans', var(--font-heading), sans-serif",
                fontSize: 'clamp(2.4rem, 5.2vw, 4.2rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: '-0.035em',
                color: '#ffffff',
                margin: 0,
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.75)'
              }}>
                {headlineMain} <br />
                <span style={{
                  background: 'linear-gradient(90deg, #CE2626 0%, #E8DBB3 55%, #7DAACB 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>
                  {headlineHighlight}
                </span>
              </h1>
            </div>

            {/* ULTRA-WIDE HIGH-PRESENCE SEARCH BAR */}
            <div className="hero-search-container-box">
              <div className="hero-search-inner-card">

                {/* Single-Row Form Grid with Button Anchored to the Right of Return Time */}
                <form onSubmit={handleSearch} className="hero-search-form-grid">

                  {/* 1. Pick-up Location */}
                  <div style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '12px',
                    backgroundColor: '#FFFDEB',
                    border: '1.5px solid #E8DBB3',
                    transition: 'border-color 0.15s ease'
                  }}>
                    <label
                      htmlFor="hero-pickup-location"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.64rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: '#6B6560',
                        fontWeight: 800,
                        marginBottom: '0.12rem'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: '#CE2626' }}>location_on</span>
                      Pick-up Location
                    </label>
                    <select
                      id="hero-pickup-location"
                      value={pickupLocation}
                      onChange={e => setPickupLocation(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: '#18191B',
                        cursor: 'pointer',
                        padding: '0.1rem 0'
                      }}
                    >
                      {locations.length > 0 ? (
                        locations.map((loc) => (
                          <option key={loc._id || loc.code} value={loc.code}>
                            {loc.name} · {loc.city} ({loc.hubPin || 'Bay 14'})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="DWTN-HUB">Main Downtown Car Hub - 4th St</option>
                          <option value="CENTRAL-OFFICE">Central Company Office Lot</option>
                          <option value="AIRPORT-EXPRESS">Airport Express Hub - Bay 14</option>
                          <option value="MUM-BKC">Mumbai BKC Hub - Bay 1</option>
                          <option value="BLR-KRM">Bengaluru Koramangala Hub</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* 2. Pickup Date & Time (Restricted: Today and upcoming days only) */}
                  <div style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '12px',
                    backgroundColor: '#FFFDEB',
                    border: '1.5px solid #E8DBB3',
                    transition: 'border-color 0.15s ease'
                  }}>
                    <label
                      htmlFor="hero-departure-time"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.64rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: '#6B6560',
                        fontWeight: 800,
                        marginBottom: '0.12rem'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: '#7DAACB' }}>calendar_today</span>
                      Pick-up Time &amp; Date
                    </label>
                    <input
                      id="hero-departure-time"
                      type="datetime-local"
                      min={getTodayMinDateTime()}
                      value={departureTime}
                      onChange={e => handleDepartureChange(e.target.value)}
                      className="jetbrains-mono-600"
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.84rem',
                        color: '#18191B',
                        cursor: 'pointer',
                        padding: '0.1rem 0'
                      }}
                    />
                  </div>

                  {/* 3. Return Date & Time */}
                  <div style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '12px',
                    backgroundColor: '#FFFDEB',
                    border: '1.5px solid #E8DBB3',
                    transition: 'border-color 0.15s ease'
                  }}>
                    <label
                      htmlFor="hero-return-time"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.64rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: '#6B6560',
                        fontWeight: 800,
                        marginBottom: '0.12rem'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: '#CE2626' }}>event_repeat</span>
                      Return Time &amp; Date
                    </label>
                    <input
                      id="hero-return-time"
                      type="datetime-local"
                      min={departureTime || getTodayMinDateTime()}
                      value={returnTime}
                      onChange={e => handleReturnChange(e.target.value)}
                      className="jetbrains-mono-600"
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.84rem',
                        color: '#18191B',
                        cursor: 'pointer',
                        padding: '0.1rem 0'
                      }}
                    />
                  </div>

                  {/* 4. Find Your Car Button (Right side of Return Trip box, heavy weight & high impact) */}
                  <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <button
                      type="submit"
                      id="hero-find-car-btn"
                      style={{
                        width: '100%',
                        minWidth: '185px',
                        height: '3.1rem',
                        padding: '0 2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#CE2626',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        whiteSpace: 'nowrap',
                        fontSize: '0.94rem',
                        fontWeight: 900,
                        letterSpacing: '0.015em',
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(206, 38, 38, 0.45)',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#b31d1d';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 24px rgba(206, 38, 38, 0.55)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#CE2626';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(206, 38, 38, 0.45)';
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', fontWeight: 900 }}>search</span>
                      <span>Find Your Car</span>
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </ScrollExpand>
      </section>

      {/* ================= OFFERS & BROADCASTS VELOCITY TICKER ================= */}
      <section style={{ backgroundColor: '#18191B', borderBottom: '1px solid rgba(232, 219, 179, 0.2)', padding: '1.4rem 0' }}>
        <div style={{ maxWidth: '96rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', padding: '0 0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: 800, color: '#E8DBB3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#CE2626', animation: 'pulseGlow 2s infinite ease-in-out' }}></span>
              Live Fleet Announcements &amp; Limited Offers
            </span>
            <Link
              to="/offers"
              style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CE2626', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>View All Offers &amp; Promo Codes</span>
              <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>arrow_forward</span>
            </Link>
          </div>
          <ScrollVelocity
            texts={[
              "⚡ 20% OFF WEEKEND TOURING (CODE: WEEKEND20) • 50 VERIFIED VEHICLES IN INVENTORY • IN-PERSON HUB DRIVER HANDOVER • CUSTOMER REFUELED • ",
              "🔥 15% FIRST DRIVE (CODE: FIRSTDRIVE) • 10% DAY TRIPS (CODE: VELOCE10) • 25% TRACK DAY TOURING (CODE: TRACKDAY) • 6-DIGIT SECRET PIN HANDOVER • "
            ]}
            velocity={70}
            gap={40}
            fontSize="clamp(1.25rem, 2.6vw, 2rem)"
            fontWeight={900}
            color="#ffffff"
            fadeEdges={true}
            pauseOnHover={true}
            draggable={true}
            className="text-white drop-shadow-sm font-sans uppercase tracking-tight"
          />
        </div>
      </section>

      {/* ================= POPULAR VEHICLE CATEGORIES ================= */}
      <section style={{ padding: '5rem 0 3.5rem', backgroundColor: 'var(--surface)' }}>
        <div style={{ maxWidth: '96rem', margin: '0 auto', padding: '0 clamp(2rem, 5.5vw, 4.5rem)' }}>
          <div className="scroll-reveal" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', fontWeight: 700 }}>
                Engineered For Every Mission
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.35rem' }}>
                Popular Vehicle Categories
              </h2>
            </div>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.92rem', maxWidth: '28rem', margin: 0 }}>
              Choose from agile city compacts to high-output track-bred machines. In-person driver handover at hub with 6-digit secret code. Customer refuels.
            </p>
          </div>

          {/* 4 Cards Grid - Exactly 4 in One Line on Desktop, Responsive on Phone */}
          <div className="grid-4-desktop">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                onClick={() => navigate(`/cars?category=${cat.id}`)}
                className={`card-veloce scroll-reveal delay-${(idx + 1) * 100}`}
                style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{
                      width: '2.5rem', height: '2.5rem', borderRadius: '0.65rem',
                      backgroundColor: 'var(--surface-container)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'var(--primary)'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                    </span>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)', backgroundColor: 'var(--surface-container-low)',
                      color: 'var(--primary)', border: '1px solid rgba(195,198,215,0.4)'
                    }}>
                      {cat.price}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>{cat.title}</h3>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                    {cat.desc}
                  </p>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(195, 198, 215, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--on-surface-variant)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>{cat.models}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURED FLEET GRID SECTION (4 Cars in One Line, Decreased Card Size) ================= */}
      <section id="fleet" style={{ padding: '4rem 0 4.5rem', backgroundColor: 'var(--surface-container-low)', borderTop: '1px solid rgba(195, 198, 215, 0.4)', borderBottom: '1px solid rgba(195, 198, 215, 0.4)' }}>
        <div style={{ maxWidth: '96rem', margin: '0 auto', padding: '0 clamp(2rem, 5.5vw, 4.5rem)' }}>

          {/* Header & Filter Chips */}
          <div className="scroll-reveal" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', fontWeight: 700 }}>
                Direct Hub Inventory (50 Vehicles)
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.35rem' }}>
                Featured Available Vehicles
              </h2>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['All Cars', 'High Output (400hp+)', 'Pure EV', 'Zero Deposit'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter === 'All Cars' ? 'All' : filter)}
                  style={{
                    padding: '0.45rem 1rem', borderRadius: 'var(--radius-full)', border: 'none',
                    backgroundColor: (activeFilter === filter || (filter === 'All Cars' && activeFilter === 'All')) ? 'var(--on-surface)' : 'var(--surface-container-lowest)',
                    color: (activeFilter === filter || (filter === 'All Cars' && activeFilter === 'All')) ? '#ffffff' : 'var(--on-surface-variant)',
                    fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.15s ease'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* 4-CAR LINE GRID - Exactly 4 in One Line on Desktop, Responsive on Phone */}
          <div className="grid-4-desktop">
            {filteredFleet.slice(0, 8).map(car => (
              <div
                key={car._id}
                className="card-veloce scroll-reveal-scale"
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem' }}
              >
                <div>
                  {/* Compact Image Container (Height reduced to 9.5rem) */}
                  <div style={{ position: 'relative', width: '100%', height: '9.5rem', overflow: 'hidden', backgroundColor: 'var(--surface-container-low)' }}>
                    <img
                      src={car.images && car.images[0]}
                      alt={car.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)', backgroundColor: '#dcfce7', color: '#15803d',
                        fontWeight: 700, fontSize: '0.68rem'
                      }}>
                        <span style={{ width: '0.35rem', height: '0.35rem', borderRadius: '50%', backgroundColor: '#15803d' }}></span>
                        6-Digit Handover
                      </span>
                    </div>
                  </div>

                  {/* Compact Body Specs (Padding reduced to 0.85rem) */}
                  <div style={{ padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--outline)', fontWeight: 700 }}>
                        {car.category}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'var(--surface-container)', color: 'var(--primary)' }}>
                        Hub Ready
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.15rem 0 0.5rem', color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {car.name}
                    </h3>

                    {/* 3 Spec Bento Items */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', marginBottom: '0.5rem' }}>
                      <div style={{ padding: '0.35rem 0.2rem', background: 'var(--surface-container-low)', borderRadius: '0.4rem', textAlign: 'center', border: '1px solid #E8DBB3' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: '#7DAACB' }}>airline_seat_recline_normal</span>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, marginTop: '0.1rem' }}>{car.seatingCapacity} Seats</div>
                      </div>

                      <div style={{ padding: '0.35rem 0.2rem', background: 'var(--surface-container-low)', borderRadius: '0.4rem', textAlign: 'center', border: '1px solid #E8DBB3' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: '#7DAACB' }}>settings</span>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, marginTop: '0.1rem' }}>{car.transmission === 'automatic' ? 'Auto' : 'Manual'}</div>
                      </div>

                      <div style={{ padding: '0.35rem 0.2rem', background: 'var(--surface-container-low)', borderRadius: '0.4rem', textAlign: 'center', border: '1px solid #E8DBB3' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: '#7DAACB' }}>
                          {car.fuelType === 'electric' ? 'electric_bolt' : 'local_gas_station'}
                        </span>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, marginTop: '0.1rem' }}>{car.fuelType === 'electric' ? 'EV' : 'Gas'}</div>
                      </div>
                    </div>

                    {/* Fuel Notice Tag */}
                    <div style={{
                      padding: '0.25rem 0.45rem', borderRadius: '0.4rem',
                      backgroundColor: '#FAF7E8', border: '1px solid #E8DBB3',
                      fontSize: '0.68rem', color: '#5A4C1C', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '0.25rem'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem', color: '#CE2626' }}>local_gas_station</span>
                      <span>Customer Refuels • Fuel Not Provided</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action Footer */}
                <div style={{
                  padding: '0.75rem 0.85rem 0.85rem', borderTop: '1px solid rgba(195, 198, 215, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
                        ₹{car.pricing.hourlyRate.toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>/hr</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>
                      ₹{car.pricing.dailyRate.toLocaleString('en-IN')} / day
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Link to={`/cars/${car._id}`} className="btn-secondary" style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}>
                      Specs
                    </Link>
                    <Link to={`/book/${car._id}`} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}>
                      Book
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Fleet Button */}
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link
              to="/cars"
              className="btn-secondary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                borderWidth: '2px', borderColor: 'var(--on-surface)', color: 'var(--on-surface)',
                padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: 700
              }}
            >
              <span>Explore All 50 Fleet Vehicles</span>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_forward</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ================= HOW VELOCE WORKS IN 3 STEPS ================= */}
      <section id="how-it-works" style={{ padding: '5.5rem 0', backgroundColor: 'var(--surface)' }}>
        <div style={{ maxWidth: '96rem', margin: '0 auto', padding: '0 clamp(2rem, 5.5vw, 4.5rem)' }}>
          <div className="scroll-reveal" style={{ textAlign: 'center', maxWidth: '44rem', margin: '0 auto 3.5rem' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', fontWeight: 700 }}>
              Direct Hub Delivery Protocol
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.35rem' }}>
              How VELOCE Works In 3 Steps
            </h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
              No rental counters, no slow queues, no physical paperwork. Transparent hourly and daily car rental with secure in-person driver handover.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Step 1 */}
            <div className="card-veloce scroll-reveal delay-100" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-0.5rem', bottom: '-1rem', fontSize: '6rem', fontWeight: 900, color: 'rgba(232, 219, 179, 0.45)', userSelect: 'none' }}>
                01
              </div>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: 'rgba(206, 38, 38, 0.1)', color: '#CE2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>calendar_month</span>
              </div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#CE2626', fontWeight: 700 }}>
                Step 1 • Choose Schedule
              </span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0.3rem 0 0.75rem' }}>Pick Car &amp; Time Period</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Select from our 50-car fleet and set your start and return date/time. Sign in to your account and complete booking to generate your 6-digit Secret Code.
              </p>
              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E8DBB3', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontSize: '0.82rem', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>check_circle</span>
                Instant Booking Confirmation
              </div>
            </div>

            {/* Step 2 */}
            <div className="card-veloce scroll-reveal delay-200" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-0.5rem', bottom: '-1rem', fontSize: '6rem', fontWeight: 900, color: 'rgba(232, 219, 179, 0.45)', userSelect: 'none' }}>
                02
              </div>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: 'rgba(125, 170, 203, 0.18)', color: '#7DAACB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>pin</span>
              </div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7DAACB', fontWeight: 700 }}>
                Step 2 • In-Person Handover
              </span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0.3rem 0 0.75rem' }}>Meet Driver &amp; Show Code</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Go to the company car hub or office. The company driver arrives with your vehicle, asks for your 6-digit code, verifies it on the spot, and delivers the keys.
              </p>
              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E8DBB3', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontSize: '0.82rem', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>check_circle</span>
                Verified Driver Key Delivery
              </div>
            </div>

            {/* Step 3 */}
            <div className="card-veloce scroll-reveal delay-300" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-0.5rem', bottom: '-1rem', fontSize: '6rem', fontWeight: 900, color: 'rgba(232, 219, 179, 0.45)', userSelect: 'none' }}>
                03
              </div>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: 'rgba(232, 219, 179, 0.4)', color: '#CE2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>local_gas_station</span>
              </div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#CE2626', fontWeight: 700 }}>
                Step 3 • Depart &amp; Refuel
              </span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0.3rem 0 0.75rem' }}>Drive &amp; Customer Refuels</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Enjoy complete driving freedom for your booked time period. Customer refuels the vehicle as required during their journey, returning it to the hub when done.
              </p>
              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E8DBB3', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontSize: '0.82rem', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>check_circle</span>
                100% Flexible Return
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= THE VELOCE STANDARD ================= */}
      <section style={{ padding: '4.5rem 0', backgroundColor: 'var(--surface-container-low)', borderTop: '1px solid rgba(195, 198, 215, 0.4)' }}>
        <div style={{ maxWidth: '96rem', margin: '0 auto', padding: '0 clamp(2rem, 5.5vw, 4.5rem)' }}>
          <div className="scroll-reveal" style={{ maxWidth: '38rem', marginBottom: '2.5rem' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', fontWeight: 700 }}>
              Integrity By Design
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.35rem' }}>
              The VELOCE Standard
            </h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.92rem', marginTop: '0.5rem', margin: 0 }}>
              Engineered around driver peace of mind. Transparent time-period rates, direct in-person driver handover, and zero hidden penalties.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="card-veloce scroll-reveal delay-100" style={{ padding: '1.5rem' }}>
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', backgroundColor: 'var(--surface-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>pin</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>6-Digit Handover</h4>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                Our driver verifies your unique 6-digit code in person at the hub before handing you the keys. Fast, verified, and secure.
              </p>
            </div>

            <div className="card-veloce scroll-reveal delay-200" style={{ padding: '1.5rem' }}>
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', backgroundColor: 'var(--surface-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>local_gas_station</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>Customer Refuels</h4>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                We provide the vehicle for your booked period. You refuel according to your exact journey needs with total control.
              </p>
            </div>

            <div className="card-veloce scroll-reveal delay-300" style={{ padding: '1.5rem' }}>
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', backgroundColor: 'var(--surface-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>sanitizer</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>10-Point Sanitize Guarantee</h4>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                Every vehicle cockpit undergoes thorough sanitization and multi-point mechanical inspection before driver delivery.
              </p>
            </div>

            <div className="card-veloce scroll-reveal delay-100" style={{ padding: '1.5rem' }}>
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', backgroundColor: 'var(--surface-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>schedule</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>Exact Time Period Rates</h4>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                Rent by the hour or day with complete transparency. No hidden surge multipliers or unannounced checkout charges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS (MOVING RIGHT TO LEFT) ================= */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--surface)', overflow: 'hidden' }}>
        <div style={{ maxWidth: '96rem', margin: '0 auto', padding: '0 clamp(2rem, 5.5vw, 4.5rem)', marginBottom: '2rem' }}>
          <div className="scroll-reveal" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', fontWeight: 700 }}>
                Verified Experience
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.35rem' }}>
                Real Drivers. Real Precision.
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '1.1rem' }}>
              {'★★★★★'}
              <span style={{ color: 'var(--on-surface)', fontWeight: 700, fontSize: '0.95rem', marginLeft: '0.5rem' }}>4.92 / 5</span>
              <span style={{ color: 'var(--outline)', fontSize: '0.82rem' }}>(14,200+ Self-Drive Trips)</span>
            </div>
          </div>
        </div>

        {/* Continuous Right to Left Moving Track */}
        <div className="reviews-marquee-container" style={{ padding: '0.5rem 0 1.5rem 0' }}>
          <div className="reviews-marquee-track">
            {[...reviews, ...reviews.map((r, i) => ({ ...r, id: (r.id || i) + '-dup' }))].map((review) => (
              <div
                key={review.id}
                className="card-veloce review-card-fixed"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--surface-container-low)',
                  border: '1px solid rgba(195,198,215,0.25)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div style={{ color: '#f59e0b', fontSize: '0.95rem', letterSpacing: '2px' }}>
                      {'★★★★★'}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(235,115,48,0.1)' }}>
                      {review.vehicle}
                    </span>
                  </div>
                  <p style={{ fontStyle: 'italic', color: 'var(--on-surface)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                    {review.quote}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(195,198,215,0.2)' }}>
                  <div style={{ width: '2.4rem', height: '2.4rem', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                    {review.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--on-surface)' }}>{review.author}</div>
                    <div style={{ color: 'var(--outline)', fontSize: '0.74rem' }}>{review.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Quick Return to Hero Shortcut */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
          className="floating-hero-pill animate-fade-in-up"
          aria-label="Back to Hero Section"
        >
          <div style={{ position: 'relative', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '22px', height: '22px', transform: 'rotate(-90deg)' }} viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="#E8DBB3"
                strokeWidth="2.5"
                fill="none"
                opacity="0.3"
              />
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="#CE2626"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray={56.5}
                strokeDashoffset={56.5 - (56.5 * scrollPercent) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />
            </svg>
            <span className="material-symbols-outlined" style={{ fontSize: '13px', position: 'absolute', color: '#FFFFFF', fontWeight: 900 }}>
              arrow_upward
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFFFFF' }}>
            Hero
          </span>
        </button>
      )}

    </div>
  );
}
