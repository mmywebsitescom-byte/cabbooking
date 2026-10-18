import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { carsApi } from '../lib/api';
import { Car, CarFilters, CarCategory } from '../types';
import CarCard from '../components/CarCard';
import { Spinner, EmptyState } from '../components/UI';

const categories: { value: CarCategory | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'mpv', label: 'MPV' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'electric', label: 'Electric' },
];

export default function CarsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CarFilters>({
    category: (searchParams.get('category') as CarCategory) || '',
    transmission: '',
    fuelType: '',
    search: searchParams.get('search') || '',
    pickupDateTime: searchParams.get('pickupDateTime') || '',
    returnDateTime: searchParams.get('returnDateTime') || '',
  });

  const fetchCars = async (f: CarFilters) => {
    setLoading(true);
    try {
      const params: any = {};
      if (f.category) params.category = f.category;
      if (f.transmission) params.transmission = f.transmission;
      if (f.fuelType) params.fuelType = f.fuelType;
      if (f.search) params.search = f.search;
      if (f.pickupDateTime) params.pickupDateTime = f.pickupDateTime;
      if (f.returnDateTime) params.returnDateTime = f.returnDateTime;
      const res = await carsApi.getAll(params);
      setCars(res.data.data);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCars(filters); }, []);

  const applyFilters = () => {
    fetchCars(filters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const cleared: CarFilters = { category: '', transmission: '', fuelType: '', search: '' };
    setFilters(cleared);
    fetchCars(cleared);
  };

  const minDate = new Date().toISOString().slice(0, 16);
  const hasFilters = filters.category || filters.transmission || filters.fuelType || filters.search || filters.pickupDateTime;

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh' }}>
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', marginBottom: '0.35rem' }}>Browse Our <span className="gold-gradient">Fleet</span></h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {loading ? 'Loading...' : `${cars.length} car${cars.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={15} /> Clear Filters
              </button>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={15} /> Filters
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="filter-bar" style={{ marginBottom: '2rem' }}>
            <div className="filter-grid">
              {/* Search */}
              <div>
                <label className="form-label">Search</label>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-control" style={{ paddingLeft: '2.4rem' }} placeholder="Brand, model..." value={filters.search || ''}
                    onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="form-label">Car Type</label>
                <select className="form-control" value={filters.category || ''} onChange={e => setFilters(p => ({ ...p, category: e.target.value as CarCategory | '' }))}>
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Transmission */}
              <div>
                <label className="form-label">Transmission</label>
                <select className="form-control" value={filters.transmission || ''} onChange={e => setFilters(p => ({ ...p, transmission: e.target.value as any }))}>
                  <option value="">Any</option>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>

              {/* Fuel */}
              <div>
                <label className="form-label">Fuel Type</label>
                <select className="form-control" value={filters.fuelType || ''} onChange={e => setFilters(p => ({ ...p, fuelType: e.target.value as any }))}>
                  <option value="">Any</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="cng">CNG</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Pickup Date */}
              <div>
                <label className="form-label">Pickup Date & Time</label>
                <input type="datetime-local" className="form-control" min={minDate} value={filters.pickupDateTime || ''}
                  onChange={e => setFilters(p => ({ ...p, pickupDateTime: e.target.value }))} />
              </div>

              {/* Return Date */}
              <div>
                <label className="form-label">Return Date & Time</label>
                <input type="datetime-local" className="form-control" min={filters.pickupDateTime || minDate} value={filters.returnDateTime || ''}
                  onChange={e => setFilters(p => ({ ...p, returnDateTime: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={applyFilters}>Apply Filters</button>
            </div>
          </div>
        )}

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {categories.map(c => (
            <button key={c.value} onClick={() => { const f = { ...filters, category: c.value }; setFilters(f); fetchCars(f); }}
              className={`btn btn-sm ${filters.category === c.value ? 'btn-primary' : 'btn-ghost'}`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}><Spinner size={48} /></div>
        ) : cars.length === 0 ? (
          <EmptyState icon="🚗" title="No cars found" description="Try adjusting your filters or dates." action={<button className="btn btn-outline" onClick={clearFilters}>Clear Filters</button>} />
        ) : (
          <div className="grid-cars">
            {cars.map(car => <CarCard key={car._id} car={car} />)}
          </div>
        )}
      </div>
    </div>
  );
}
