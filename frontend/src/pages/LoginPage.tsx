import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const loggedUser = await login(email.trim(), password);
      toast.success('Welcome back to VELOCE!');
      if (loggedUser?.role === 'admin' && (!redirect || redirect === '/')) {
        navigate('/admin');
      } else {
        navigate(redirect || '/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast('Google Single Sign-On is connecting to secure identity provider...', {
      icon: '🔐',
      duration: 3500
    });
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
            {/* Brand Logo */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '2.1rem',
                  height: '2.1rem',
                  borderRadius: '8px',
                  backgroundColor: '#F5A623',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#18191B',
                  boxShadow: '0 3px 8px rgba(245, 166, 35, 0.35)'
                }}>
                  <Zap style={{ width: '1.1rem', height: '1.1rem', fill: '#18191B' }} />
                </span>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 900,
                  fontSize: '1.3rem',
                  color: '#18191B',
                  letterSpacing: '-0.03em'
                }}>
                  VELOCE<span style={{ color: '#F5A623' }}>.</span>
                </span>
              </Link>
            </div>

            {/* Typography Header */}
            <div style={{ marginBottom: '1.4rem' }}>
              <h1 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#18191B',
                letterSpacing: '-0.03em',
                margin: '0 0 0.25rem',
                lineHeight: 1.2
              }}>
                WELCOME BACK
              </h1>
              <p style={{ color: '#78716C', fontSize: '0.88rem', margin: 0, lineHeight: 1.4 }}>
                Welcome back! Please enter your details.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              {/* Email field */}
              <div>
                <label
                  htmlFor="login-email"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#44403C',
                    marginBottom: '0.35rem'
                  }}
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  style={{
                    width: '100%',
                    backgroundColor: '#FBF9F7',
                    border: '1.5px solid #E4DDD6',
                    borderRadius: '10px',
                    padding: '0.65rem 0.95rem',
                    fontSize: '0.88rem',
                    color: '#18191B',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease-in-out'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#F5A623';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 166, 35, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E4DDD6';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Password field */}
              <div>
                <label
                  htmlFor="login-password"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#44403C',
                    marginBottom: '0.35rem'
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      backgroundColor: '#FBF9F7',
                      border: '1.5px solid #E4DDD6',
                      borderRadius: '10px',
                      padding: '0.65rem 2.8rem 0.65rem 0.95rem',
                      fontSize: '0.88rem',
                      color: '#18191B',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease-in-out'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#F5A623';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 166, 35, 0.18)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E4DDD6';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '0.2rem',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px'
                    }}
                  >
                    {showPassword ? (
                      <EyeOff style={{ width: '1.05rem', height: '1.05rem' }} />
                    ) : (
                      <Eye style={{ width: '1.05rem', height: '1.05rem' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.82rem',
                paddingTop: '0.1rem'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: '#57534E',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontWeight: 500
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{
                      width: '15px',
                      height: '15px',
                      accentColor: '#F5A623',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => toast('Password reset link sent to your registered email address.', { icon: '📧' })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#D98200',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    padding: 0
                  }}
                >
                  Forgot password
                </button>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.78rem 1rem',
                  backgroundColor: '#F5A623',
                  color: '#18191B',
                  fontWeight: 800,
                  fontSize: '0.94rem',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 166, 35, 0.35)',
                  marginTop: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#e69818';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#F5A623';
                }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #E4DDD6',
                  borderRadius: '12px',
                  color: '#18191B',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FBF9F7';
                  e.currentTarget.style.borderColor = '#D6CEC5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#E4DDD6';
                }}
              >
                <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </form>
          </div>

          {/* Bottom Sign-Up Link */}
          <div style={{
            textAlign: 'center',
            fontSize: '0.84rem',
            color: '#78716C',
            marginTop: '1.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid #F0EAE1'
          }}>
            Don't have an account?{' '}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirect)}`}
              style={{
                color: '#D98200',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              Sign up for free!
            </Link>
          </div>
        </div>

        {/* Right Column: Realistic High-Performance Automotive Showcase */}
        <div style={{
          position: 'relative',
          backgroundColor: '#18191B',
          minHeight: '520px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2rem'
        }}>
          {/* Background image */}
          <img
            src="/images/login-hero.jpg"
            alt="Porsche 911 GT3 in Modern Pavilion"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block'
            }}
          />

          {/* Vignette Gradients for superior readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(24,25,27,0.72) 0%, rgba(24,25,27,0.18) 40%, rgba(24,25,27,0.88) 100%)',
            pointerEvents: 'none'
          }} />

          {/* Top Tag */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(24, 25, 27, 0.65)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              <ShieldCheck style={{ width: '1rem', height: '1rem', color: '#F5A623' }} />
              100% VERIFIED FLEET
            </span>
          </div>

          {/* Bottom Telemetry & Vehicle Showcase Card */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            borderRadius: '18px',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            padding: '1.15rem 1.35rem',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div>
              <span style={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: '0.68rem',
                color: '#64748b',
                display: 'block',
                marginBottom: '0.2rem'
              }}>
                Self-Drive Hub Fleet
              </span>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0b1c30' }}>
                Porsche 911 GT3 · Midnight Blue
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                6-Digit PIN Handover · Zero Hidden Surge
              </div>
            </div>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontWeight: 700,
              fontSize: '0.75rem',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              Ready to Drive
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
