import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();

  // Do not render public consumer footer on administrative pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer style={{ backgroundColor: 'var(--surface-container-lowest)', borderTop: '1px solid rgba(195, 198, 215, 0.4)', marginTop: '4rem' }}>
      <div style={{ maxWidth: '96rem', margin: '0 auto', padding: '3.5rem 1.25rem 2rem' }}>
        {/* Top Grid: Brand & Link Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', paddingBottom: '2.5rem' }}>
          
          {/* Brand Info Column */}
          <div style={{ gridColumn: 'span 2' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{
                width: '2rem', height: '2rem', borderRadius: '0.5rem',
                backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#ffffff'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>electric_bolt</span>
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                VELOCE
              </span>
            </Link>

            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.88rem', marginTop: '0.85rem', maxWidth: '24rem', lineHeight: 1.6 }}>
              Precision performance, absolute freedom. 50+ vehicles available for your exact time period. Direct hub delivery with 6-digit secret code. Customer refuels.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
              <a href="#" style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', backgroundColor: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--outline)', textDecoration: 'none', transition: 'color 0.15s' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>share</span>
              </a>
              <a href="mailto:support@veloce.io" style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', backgroundColor: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--outline)', textDecoration: 'none', transition: 'color 0.15s' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>mail</span>
              </a>
            </div>
          </div>

          {/* Col 1: Fleet & Services */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface)', marginBottom: '0.5rem' }}>
              Fleet &amp; Services
            </h4>
            <Link to="/cars" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', fontSize: '0.88rem' }}>Explore Fleet</Link>
            <a href="#" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.88rem' }}>Airport Fast Pickup</a>
            <a href="#" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.88rem' }}>Electric Fleet (EV)</a>
            <a href="#" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.88rem' }}>Long Term Leases</a>
            <a href="#" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.88rem' }}>Corporate Mobility</a>
          </div>

          {/* Col 2: Legal & Coverage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface)', marginBottom: '0.5rem' }}>
              Legal &amp; Coverage
            </h4>
            <Link to="/policies#self-drive" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.88rem' }}>Rental Agreement</Link>
            <Link to="/policies#insurance" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.88rem' }}>Insurance &amp; Coverage</Link>
            <Link to="/policies#deposit" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.88rem' }}>Security Deposit Policy</Link>
            <Link to="/policies#privacy" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.88rem' }}>Privacy Notice</Link>
            <Link to="/policies#terms" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.88rem' }}>Terms of Service</Link>
          </div>

          {/* Col 3: Support & Tech */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface)', marginBottom: '0.5rem' }}>
              Assistance
            </h4>
            <Link to="/policies" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.88rem' }}>Help Center</Link>
            <Link to="/policies#faq" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.88rem' }}>Fleet Telemetry FAQ</Link>
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(195, 198, 215, 0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.88rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>phone_in_talk</span>
              <a href="tel:+18008356231" style={{ color: 'inherit', textDecoration: 'none' }}>+1 (800) 835-6231</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright and Tagline */}
        <div style={{
          paddingTop: '1.5rem', borderTop: '1px solid rgba(195, 198, 215, 0.3)',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', fontSize: '0.82rem', color: 'var(--on-surface-variant)'
        }}>
          <p>© 2025 VELOCE Car Rental Inc. All rights reserved. Precision performance, absolute freedom.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--outline)' }}>
            <span>Encrypted 256-Bit SSL</span>
            <span>•</span>
            <span>6-Digit Secret Code Handover</span>
            <span>•</span>
            <span>Customer Refuels</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
