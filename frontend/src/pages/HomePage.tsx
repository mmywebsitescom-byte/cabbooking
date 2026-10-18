import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Shield, Clock, MapPin, Star, ChevronRight, CheckCircle, Zap, Users, Award } from 'lucide-react';
import { carsApi } from '../lib/api';
import { Car as CarType } from '../types';
import CarCard from '../components/CarCard';
import { Spinner } from '../components/UI';

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredCars, setFeaturedCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  useEffect(() => {
    carsApi.getAll().then(res => setFeaturedCars(res.data.data.slice(0, 6))).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickupDate) params.set('pickupDateTime', pickupDate);
    if (returnDate) params.set('returnDateTime', returnDate);
    navigate(`/cars?${params}`);
  };

  const features = [
    { icon: Shield, title: 'Verified Fleet', desc: 'All cars inspected and insured' },
    { icon: Clock, title: '24/7 Support', desc: 'Round the clock customer service' },
    { icon: MapPin, title: 'Easy Pickup', desc: 'Single convenient pickup location' },
    { icon: Zap, title: 'Instant Booking', desc: 'Book and confirm in minutes' },
  ];

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <div style={{ paddingTop: 72 }}>
      {/* Hero */}
      <section className="hero" style={{ minHeight: 'calc(100vh - 72px)', paddingTop: '4rem' }}>
        <div className="hero-bg" />
        <div className="container hero-content">
          <div className="hero-tag">
            <Award size={14} /> Premium Self-Drive Car Rentals
          </div>
          <h1>
            Drive on Your<br />
            <span className="gold-gradient">Own Terms</span>
          </h1>
          <p className="hero-sub">
            Choose from our premium fleet. Set your schedule. No drivers, no hassle — just you, the keys, and the open road.
          </p>

          {/* Quick Search */}
          <form onSubmit={handleSearch} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', maxWidth: 700, margin: '0 auto 2.5rem', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label">Pickup Date & Time</label>
                <input type="datetime-local" className="form-control" min={minDate}
                  value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Return Date & Time</label>
                <input type="datetime-local" className="form-control" min={pickupDate || minDate}
                  value={returnDate} onChange={e => setReturnDate(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg">
                <Car size={18} /> Search Cars
              </button>
            </div>
          </form>

          <div className="hero-ctas">
            <Link to="/cars" className="btn btn-primary btn-lg">
              Browse All Cars <ChevronRight size={18} />
            </Link>
            <Link to="/policies" className="btn btn-outline btn-lg">
              How It Works
            </Link>
          </div>

          <div className="hero-stats">
            {[
              { val: '50+', label: 'Cars in Fleet' },
              { val: '4.9★', label: 'Customer Rating' },
              { val: '2000+', label: 'Happy Renters' },
              { val: '24/7', label: 'Support' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div className="hero-stat-val gold-gradient">{s.val}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ background: 'var(--bg-800)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="gold-line" style={{ margin: '0 auto 1rem' }} />
            <h2 className="section-title">Why Choose <span className="gold-gradient">DriveEase?</span></h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>Everything you need for a seamless self-drive experience.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {features.map(f => (
              <div key={f.title} className="card card-gold card-body" style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <f.icon size={22} style={{ color: 'var(--gold)' }} />
                </div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="gold-line" />
              <h2 className="section-title">Our <span className="gold-gradient">Fleet</span></h2>
              <p className="section-subtitle">Handpicked cars for every occasion and budget.</p>
            </div>
            <Link to="/cars" className="btn btn-outline">
              View All Cars <ChevronRight size={16} />
            </Link>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}><Spinner /></div>
          ) : (
            <div className="grid-cars">
              {featuredCars.map(car => <CarCard key={car._id} car={car} />)}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="section" style={{ background: 'var(--bg-800)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="gold-line" style={{ margin: '0 auto 1rem' }} />
            <h2 className="section-title">How It <span className="gold-gradient">Works</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            {[
              { step: '01', title: 'Browse & Select', desc: 'Filter by category, dates, and budget. Choose your perfect car.' },
              { step: '02', title: 'Book & Pay', desc: 'Enter your details, choose payment method and confirm your booking.' },
              { step: '03', title: 'Pickup the Car', desc: 'Visit our location with your driving licence. Collect your car and go!' },
              { step: '04', title: 'Return & Review', desc: 'Return the car at the agreed time. We handle the rest.' },
            ].map((s, i) => (
              <div key={s.step} style={{ position: 'relative', textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'Playfair Display,serif', color: 'rgba(201,168,76,0.08)', lineHeight: 1, marginBottom: '1rem' }}>{s.step}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'Inter,sans-serif' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{s.desc}</p>
                {i < 3 && (
                  <ChevronRight size={24} style={{ position: 'absolute', top: '50%', right: -12, color: 'var(--border)', display: 'block' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '5rem 0', background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, var(--bg-900) 100%)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Ready to Hit the Road?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '2rem' }}>
            No driver required. Your adventure, your way.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/cars" className="btn btn-primary btn-lg">
              <Car size={18} /> Browse Cars Now
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg">
              Create Free Account
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '2.5rem', flexWrap: 'wrap' }}>
            {['No driver needed', 'Transparent pricing', 'Flexible duration', 'Easy cancellation'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                <CheckCircle size={15} style={{ color: 'var(--success)' }} /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
