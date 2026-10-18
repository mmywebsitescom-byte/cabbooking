import { Car, Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-800)', borderTop: '1px solid var(--border-subtle)', padding: '4rem 0 2rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
          {/* Brand */}
          <div>
            <div className="navbar-logo" style={{ marginBottom: '1rem' }}>
              <div className="navbar-logo-icon"><Car size={20} /></div>
              <span className="gold-gradient" style={{ fontSize: '1.3rem', fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>DriveEase</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              Premium self-drive car rentals. Choose your car, pick your dates, and drive away in style.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-600)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'Inter, sans-serif' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { to: '/cars', label: 'Browse Cars' },
                { to: '/policies', label: 'Rental Policies' },
                { to: '/policies#terms', label: 'Terms & Conditions' },
                { to: '/policies#privacy', label: 'Privacy Policy' },
                { to: '/policies#cancellation', label: 'Cancellation Policy' },
              ].map(l => (
                <Link key={l.to} to={l.to} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'Inter, sans-serif' }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <MapPin size={16} style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>123 Auto Plaza, MG Road, Bengaluru, Karnataka 560001</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Phone size={16} style={{ color: 'var(--gold)' }} />
                <a href="tel:+919876543210" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>+91 98765 43210</a>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Mail size={16} style={{ color: 'var(--gold)' }} />
                <a href="mailto:support@driveease.in" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>support@driveease.in</a>
              </div>
            </div>
          </div>
        </div>

        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            © {new Date().getFullYear()} DriveEase. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>🧪 Demo Mode</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No real transactions</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
