import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    drivingLicenceNumber: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        drivingLicence: formData.drivingLicenceNumber ? { number: formData.drivingLicenceNumber } : undefined,
      });
      toast.success('🎉 Account created! Welcome to VELOCE.');
      navigate(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5EFEB',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '6.75rem',
      paddingBottom: '3.5rem',
      paddingLeft: '1.25rem',
      paddingRight: '1.25rem',
      boxSizing: 'border-box',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '820px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 24px 60px -12px rgba(24, 25, 27, 0.12), 0 0 0 1px rgba(226, 221, 213, 0.75)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
      }}>
        
        {/* Left Column: Form Details */}
        <div style={{
          padding: '2.25rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}>
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <span style={{
                  width: '2.2rem', height: '2.2rem', borderRadius: '0.5rem',
                  backgroundColor: '#F5A623', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#18191B', boxShadow: '0 3px 8px rgba(245, 166, 35, 0.35)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', fontWeight: 900 }}>electric_bolt</span>
                </span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.35rem', color: '#18191B', letterSpacing: '-0.02em' }}>
                  VELOCE<span style={{ color: '#F5A623' }}>.</span>
                </span>
              </Link>

              <h1 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '2rem',
                fontWeight: 800,
                color: '#18191B',
                letterSpacing: '-0.02em',
                margin: '0 0 0.35rem'
              }}>
                CREATE ACCOUNT
              </h1>
              <p style={{ color: '#78716C', fontSize: '0.92rem', margin: 0 }}>
                Start your instant self-drive journey across 15+ hubs.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Alex Morgan"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '12px',
                    padding: '0.65rem 0.9rem',
                    fontSize: '0.88rem',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="alex@domain.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '0.65rem 0.9rem',
                      fontSize: '0.88rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (415) 555-0199"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '0.65rem 0.9rem',
                      fontSize: '0.88rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                  Driver License Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="CA DL-948-8842"
                  value={formData.drivingLicenceNumber}
                  onChange={e => setFormData({ ...formData, drivingLicenceNumber: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '12px',
                    padding: '0.65rem 0.9rem',
                    fontSize: '0.88rem',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '0.65rem 0.9rem',
                      fontSize: '0.88rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '0.65rem 0.9rem',
                      fontSize: '0.88rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.78rem',
                  backgroundColor: '#F5A623',
                  color: '#18191B',
                  fontWeight: 800,
                  fontSize: '0.94rem',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 166, 35, 0.35)',
                  marginTop: '0.35rem',
                  transition: 'all 0.15s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#e69818';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#F5A623';
                }}
              >
                {loading ? 'Creating Account...' : 'Sign up for free!'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#78716C', marginTop: '1.5rem', paddingTop: '0.85rem', borderTop: '1px solid #F0EAE1' }}>
            Already have an account?{' '}
            <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} style={{ color: '#D98200', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Right Column: Dynamic Graphic Illustration */}
        <div style={{
          position: 'relative',
          backgroundColor: '#f1f3f6',
          minHeight: '480px',
          overflow: 'hidden'
        }}>
          <img
            src="/images/login-hero.jpg"
            alt="High-Performance VELOCE Car"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '1.25rem',
            left: '1.25rem',
            right: '1.25rem',
            padding: '0.85rem 1.15rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem'
          }}>
            <div>
              <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem', color: '#6b7280', display: 'block' }}>
                Instant Global Driver Approval
              </span>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0b1c30' }}>
                100% Self-Drive · Keyless BLE
              </span>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: '#d1fae5',
              color: '#065f46',
              fontWeight: 700,
              fontSize: '0.72rem'
            }}>
              <span style={{ width: '0.4rem', height: '0.4rem', borderRadius: '50%', backgroundColor: '#059669' }}></span>
              Fast-Lane
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
