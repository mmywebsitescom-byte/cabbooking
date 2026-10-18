import { Car } from '../types';
import { Users, Fuel, Settings, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  car: Car;
}

const categoryColors: Record<string, string> = {
  hatchback: '#6366f1', sedan: '#3b82f6', suv: '#f59e0b',
  luxury: '#c9a84c', mpv: '#10b981', electric: '#22c55e',
};

export default function CarCard({ car }: Props) {
  const thumbnail = car.images?.[0] || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80';

  return (
    <Link to={`/cars/${car._id}`}>
      <div className="card car-card">
        <div className="car-card-img">
          <img src={thumbnail} alt={car.name} loading="lazy"
            onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80'; }} />
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
            <span className="badge" style={{ background: `${categoryColors[car.category]}22`, color: categoryColors[car.category], border: `1px solid ${categoryColors[car.category]}44`, textTransform: 'capitalize' }}>
              {car.category}
            </span>
          </div>
          {!car.isAvailable && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="badge badge-danger">Not Available</span>
            </div>
          )}
        </div>
        <div className="car-card-body">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.2rem' }}>{car.brand}</p>
          <h3 className="car-card-name">{car.name}</h3>
          <div className="car-card-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={13} /> {car.seatingCapacity} seats
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'capitalize' }}>
              {car.fuelType === 'electric' ? <Zap size={13} /> : <Fuel size={13} />} {car.fuelType}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'capitalize' }}>
              <Settings size={13} /> {car.transmission}
            </span>
          </div>
          <div className="car-card-features">
            {car.features.slice(0, 3).map(f => (
              <span key={f} className="car-card-feature">{f}</span>
            ))}
            {car.features.length > 3 && (
              <span className="car-card-feature">+{car.features.length - 3} more</span>
            )}
          </div>
          <div className="car-card-pricing">
            <div>
              <p className="car-price-label">Starting from</p>
              <p className="car-price-val">₹{car.pricing.hourlyRate.toLocaleString('en-IN')}<span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 400, fontFamily: 'Inter,sans-serif' }}>/hr</span></p>
              <p className="car-price-sub">₹{car.pricing.dailyRate.toLocaleString('en-IN')}/day</p>
            </div>
            <div className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
              Book Now
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
