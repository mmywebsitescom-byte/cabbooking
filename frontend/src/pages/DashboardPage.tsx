import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingsApi } from '../lib/api';
import type { Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingPage, formatCurrency } from '../components/UI';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      toast.success('Logged in as Alex Morgan!');
    } catch {
      toast.error('Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.getMyBookings();
      setBookings(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Cancel this self-drive reservation? Immediate refund policy applies.')) return;
    setCancellingId(bookingId);
    try {
      await bookingsApi.cancel(bookingId, { reason: 'Customer requested cancellation via portal' });
      toast.success('Reservation cancelled');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading && !bookings.length && user) return <LoadingPage />;

  if (!user) {
    return (
      <div className="bg-surface text-on-surface min-h-[75vh] flex items-center justify-center py-12 px-gutter selection:bg-primary selection:text-on-primary font-body-md">
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/50 p-8 md:p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-surface-container text-primary mx-auto flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[32px]">badge</span>
          </div>

          <h2 className="font-headline-sm text-headline-sm text-on-surface">Driver Authentication Required</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 mb-6">
            Sign in to access your active NFC key passes, upcoming reservation schedules, and telematics telemetry.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleQuickLogin('alex.morgan@veloce.io', 'Demo@123')}
              disabled={loading}
              className="w-full py-3 rounded-full bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
              <span>{loading ? 'Authenticating...' : '1-Click Sign In as Alex Morgan'}</span>
            </button>

            <Link
              to="/login?redirect=/dashboard"
              className="w-full py-3 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container font-label-lg text-label-lg flex items-center justify-center gap-2 transition-colors block"
            >
              <span>Custom Driver Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return b.status === 'confirmed' || b.status === 'active' || b.status === 'pending';
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <div className="bg-surface text-on-surface min-h-screen py-10 selection:bg-primary selection:text-on-primary font-body-md" style={{ paddingTop: '6rem' }}>
      <div className="max-w-7xl mx-auto px-gutter-lg">
        
        {/* User Telematics Header */}
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-6 md:p-8 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-headline-md text-2xl font-bold ring-4 ring-surface-container shadow-sm">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold">{user?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-label-sm font-label-sm font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Verified Driver ID
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {user?.email} • {user?.phone || '+1 (415) 890-2341'} • NFC Digital Key Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={fetchBookings}
              type="button"
              className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Sync Fleet</span>
            </button>
            <Link
              to="/cars"
              className="px-5 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md text-label-md flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Reserve New Car</span>
            </Link>
          </div>
        </div>

        {/* Reservations Navigation & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">My Fleet Reservations</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Live keyless NFC passes and upcoming scheduled trips.</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center p-1 bg-surface-container-high rounded-full overflow-x-auto">
            {[
              { id: 'all', label: `All (${bookings.length})` },
              { id: 'active', label: 'Active & Upcoming' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1.5 px-4 rounded-full font-label-md text-label-md transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-surface-container text-outline mx-auto flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[36px]">directions_car</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">No reservations found</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto mt-1 mb-6">
              {activeTab === 'all'
                ? "You haven't reserved any vehicles yet. Explore 60+ track-calibrated self-drive cars."
                : `No ${activeTab} reservations on record.`}
            </p>
            <Link
              to="/cars"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-all shadow-sm"
            >
              <span>Browse Fleet Catalog</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(b => {
              const car = b.car;
              const canCancel = b.status === 'pending' || b.status === 'confirmed';

              return (
                <div
                  key={b._id}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-5 md:p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                    
                    {/* Car Thumbnail & Model (5 cols) */}
                    <div className="lg:col-span-5 flex items-center gap-4">
                      <div className="w-24 h-20 rounded-xl bg-surface-container-low border border-outline-variant/20 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {car?.images?.[0] ? (
                          <img src={car.images[0]} alt={car.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="material-symbols-outlined text-outline text-[32px]">directions_car</span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-primary">#{b.bookingId}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            b.status === 'confirmed' || b.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.status.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface text-base">{car?.name || 'Self-Drive Vehicle'}</h3>
                        <p className="font-body-sm text-xs text-outline mt-0.5">
                          Main Downtown Hub • Bay 14 • In-Person Driver Handover
                        </p>
                        
                        {/* 6-Digit Secret Handover Code Pill */}
                        <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900">
                          <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
                          <span>Secret Code:</span>
                          <span className="font-mono text-primary font-extrabold text-sm tracking-wider">{b.secretCode || '482916'}</span>
                          <span className="text-[10px] text-outline">• Show to Driver</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule (4 cols) */}
                    <div className="lg:col-span-4 space-y-1 text-body-sm border-t lg:border-t-0 pt-3 lg:pt-0 border-outline-variant/20">
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                        <span className="material-symbols-outlined text-primary text-[16px]">calendar_today</span>
                        <span>
                          <strong>Pickup:</strong> {new Date(b.pickupDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                        <span className="material-symbols-outlined text-primary text-[16px]">event_repeat</span>
                        <span>
                          <strong>Return:</strong> {new Date(b.returnDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-outline pt-0.5">
                        Duration: {b.rentalDuration?.totalHours || 48} hrs total • ⛽ Customer Refuels
                      </p>
                    </div>

                    {/* Price & Action (3 cols) */}
                    <div className="lg:col-span-3 flex lg:flex-col items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-outline-variant/20">
                      <div className="text-left lg:text-right">
                        <span className="text-headline-sm font-headline-sm font-extrabold text-primary">
                          {formatCurrency(b.pricing?.totalAmount || 0)}
                        </span>
                        <span className="block text-[11px] text-outline font-semibold">
                          {b.payment?.method === 'cash' ? 'Payable at Counter' : 'Paid & Confirmed'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/booking-confirmation/${b._id}`}
                          className="px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-white font-label-sm text-label-sm font-bold transition-all shadow-xs"
                        >
                          Handover Code
                        </Link>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(b._id)}
                            disabled={cancellingId === b._id}
                            className="px-3 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 font-label-sm text-label-sm transition-colors"
                          >
                            {cancellingId === b._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
