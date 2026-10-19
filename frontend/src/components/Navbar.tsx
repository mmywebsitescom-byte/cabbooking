import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CardNav, { type CardNavItem } from './CardNav';
import toast from 'react-hot-toast';

// Router-aware link adapter for CardNav
const RouterLink = ({ href, children, ...props }: any) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (href === '#logout') {
    return (
      <button
        type="button"
        id="navbar-logout-btn"
        onClick={(e) => {
          e.preventDefault();
          logout();
          toast.success('Logged out successfully');
          navigate('/login');
        }}
        className="w-full text-left bg-transparent border-none cursor-pointer p-0 font-inherit flex items-center justify-between text-rose-400 hover:text-rose-300 transition-colors"
        {...props}
      >
        {children}
      </button>
    );
  }

  if (!href || href.startsWith('http') || href.startsWith('#')) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} {...props}>
      {children}
    </Link>
  );
};

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Auto-hide when scrolling down, bring back when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show at or near the very top of the page
      if (currentScrollY <= 25) {
        setVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // If user has the card navigation menu open, keep it visible
      if (isNavOpen) {
        setVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;
      // Scroll down threshold: hide header to maximize content visibility
      if (diff > 8) {
        setVisible(false);
      }
      // Scroll up threshold: user starts scrolling back, smoothly reveal header
      else if (diff < -8) {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isNavOpen]);

  // Always reveal header on route change
  useEffect(() => {
    setVisible(true);
  }, [location.pathname]);

  // Do not render public consumer navbar on administrative pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // VELOCE brand logo
  const VeloceLogo = (
    <div className="flex items-center gap-2 group cursor-pointer select-none">
      <span className="w-7 h-7 rounded-lg bg-[#F5A623] flex items-center justify-center text-[#BBC0CD] font-black text-sm shadow-sm shadow-amber-500/30 group-hover:scale-105 transition-transform">
        ⚡
      </span>
      <span className="font-extrabold text-[15px] tracking-tight text-white font-sans flex items-center gap-1">
        VELOCE
        <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]"></span>
      </span>
    </div>
  );

  // Dynamic Navigation Cards
  const navItems: CardNavItem[] = [
    {
      label: 'Home & Fleet',
      description: 'Quick return to main hub, 50-car fleet search, and verified terminals.',
      links: [
        { label: '← Back to Home', href: '/' },
        { label: 'Explore All 50 Cars', href: '/cars' },
        { label: 'Special Offers & Perks', href: '/offers' },
        { label: 'Downtown Hub Bay 14', href: '/#how-it-works' }
      ]
    },
    {
      label: 'Fleet & Categories',
      description: 'Precision performance, track-spec luxury, and electric vehicles.',
      links: [
        { label: 'High-Output Luxury & Track', href: '/cars?category=luxury' },
        { label: 'Pure Electric Fleet (EV)', href: '/cars?category=electric' },
        { label: 'Executive Sport SUVs', href: '/cars?category=suv' },
        { label: 'Daily Grand Tourers', href: '/cars?category=sedan' }
      ]
    },
    {
      label: 'Hub Handover',
      description: 'Meet company driver at Bay 14 with your 6-digit secret PIN.',
      links: [
        { label: '6-Digit PIN Verification', href: '/policies' },
        { label: 'Customer Refuels Policy', href: '/policies' },
        { label: 'Downtown Hub Bay 14', href: '/#how-it-works' },
        { label: 'Zero-Deductible Protection', href: '/policies' }
      ]
    },
    {
      label: 'Offers & Perks',
      description: 'Limited-time voucher codes, seasonal multi-day perks, and live alerts.',
      bgColor: 'linear-gradient(180deg, #262420 0%, #171614 100%)',
      textColor: '#ffffff',
      links: [
        { label: 'View All Offers & Messages', href: '/offers' },
        { label: 'Weekend 20% Off (WEEKEND20)', href: '/offers' },
        { label: 'First Drive 15% Off (FIRSTDRIVE)', href: '/offers' },
        { label: '10% Day Touring (VELOCE10)', href: '/offers' }
      ]
    },
    {
      label: user ? (user.name || 'Account') : 'Driver Portal',
      description: user
        ? `Authorized Driver • ${user.email}`
        : 'Sign in to access your 6-digit pickup code and manage reservations.',
      links: user
        ? [
          { label: '← Back to Home', href: '/' },
          { label: '👤 Driver Profile & License', href: '/profile' },
          { label: '🔑 My Trips & 6-Digit PINs', href: '/dashboard' },
          ...(user.role === 'admin' ? [{ label: '⚡ Admin Control Center', href: '/admin' }] : []),
          { label: '📋 Rental Policies & Terms', href: '/policies' },
          { label: '🚪 Log Out of Account', href: '#logout' }
        ]
        : [
          { label: '← Back to Home', href: '/' },
          { label: 'Sign In to Portal', href: '/login' },
          { label: 'Create Driver Account', href: '/register' },
          { label: '⚡ Admin Control Center', href: '/admin' },
          { label: 'Rental Agreement & FAQs', href: '/policies' }
        ]
    }
  ];

  // CTA button configuration
  const cta = user
    ? user.role === 'admin'
      ? { label: 'Admin Center', href: '/admin' }
      : { label: 'My Profile', href: '/profile' }
    : { label: 'Sign In', href: '/login' };

  return (
    <header
      className={`fixed top-3 inset-x-0 z-[990] px-3 sm:px-6 pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${visible ? 'translate-y-0 opacity-100' : '-translate-y-28 opacity-0 pointer-events-none'
        }`}
      style={{
        transitionProperty: 'transform, opacity',
        transitionDuration: '320ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div className="pointer-events-auto max-w-[940px] mx-auto">
        <CardNav
          logo={VeloceLogo}
          logoHref="/"
          items={navItems}
          cta={cta}
          theme="dark"
          surface="glass"
          accentColor="#F5A623"
          linkComponent={RouterLink}
          maxWidth={940}
          cardHeight={195}
          openOn="click"
          cardEffect="rise"
          bounce={0.25}
          speed={1}
          onOpenChange={setIsNavOpen}
        />
      </div>
    </header>
  );
}
