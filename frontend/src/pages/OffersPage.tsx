import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ScrollVelocity from '../components/ScrollVelocity';
import { adminApi } from '../lib/api';
import type { Coupon } from '../types';
import toast from 'react-hot-toast';
import { Tag, Sparkles, Check, Copy, ArrowRight, ShieldCheck, Zap, Bell, Car } from 'lucide-react';

const DEFAULT_OFFERS: Coupon[] = [
  {
    code: 'WEEKEND20',
    discountPercent: 20,
    minHours: 24,
    maxDiscount: 250,
    isActive: true,
    description: '20% off for 24+ hour weekend trips. Max discount ₹5,000 on all luxury and sports models.'
  },
  {
    code: 'FIRSTDRIVE',
    discountPercent: 15,
    minHours: 2,
    maxDiscount: 75,
    isActive: true,
    description: '15% welcome discount for new verified drivers. Valid on any fleet car at Downtown Hub.'
  },
  {
    code: 'VELOCE10',
    discountPercent: 10,
    minHours: 4,
    maxDiscount: 100,
    isActive: true,
    description: '10% off for any rental exceeding 4 hours. Perfect for day touring and scenic drives.'
  },
  {
    code: 'TRACKDAY',
    discountPercent: 25,
    minHours: 48,
    maxDiscount: 500,
    isActive: true,
    description: '25% premium multi-day touring discount for 48+ hours bookings on performance models.'
  }
];

export default function OffersPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(DEFAULT_OFFERS);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getCoupons()
      .then(res => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCoupons(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-20 selection:bg-blue-600 selection:text-white">
      
      {/* ================= HERO SCROLL VELOCITY BANNER ================= */}
      <div className="relative py-8 md:py-12 border-b border-white/10 bg-gradient-to-b from-blue-950/40 via-slate-950 to-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={13} />
            Official VELOCE Deals &amp; Broadcasts
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Exclusive Offers &amp; Driver Perks
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto mt-2">
            Unlock transparent rental rates, limited-time promo codes, and real-time fleet announcements. Apply any code at checkout.
          </p>
        </div>

        {/* Parallax Velocity Text Tickers */}
        <div className="py-2 opacity-90">
          <ScrollVelocity
            texts={[
              "⚡ 20% OFF WEEKEND TOURING • 50 FLEET CARS • 6-DIGIT SECRET PIN HANDOVER • CUSTOMER REFUELED • ",
              "🔥 PROMO: WEEKEND20 • PROMO: FIRSTDRIVE • PROMO: VELOCE10 • PROMO: TRACKDAY • ZERO HIDDEN FEES • "
            ]}
            velocity={75}
            gap={40}
            fontSize="clamp(1.6rem, 3.5vw, 2.75rem)"
            fontWeight={900}
            color="#ffffff"
            className="text-white drop-shadow-sm font-sans uppercase tracking-tight"
            fadeEdges={true}
            pauseOnHover={true}
            draggable={true}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-12 space-y-12">
        
        {/* ================= ACTIVE COUPON CODES GRID ================= */}
        <div>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
                <Tag size={20} className="text-blue-400" />
                Active Promotional Vouchers
              </h2>
              <p className="text-xs text-slate-400">Copy any promo code below and paste it in the reservation review step</p>
            </div>
            <Link
              to="/cars"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Explore 50 Fleet Cars</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {coupons.filter(c => c.isActive !== false).map((coupon, idx) => (
              <div
                key={idx}
                className="group relative bg-gradient-to-br from-slate-900/90 to-slate-900/40 rounded-2xl p-6 border border-white/10 hover:border-blue-500/40 shadow-xl backdrop-blur-md transition-all flex flex-col justify-between"
              >
                {/* Glow Accent */}
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-all"></div>

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {coupon.minHours ? `Min ${coupon.minHours} Hours` : 'Special Promo'}
                    </span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {coupon.discountPercent}% OFF
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
                    <span>Code:</span>
                    <span className="font-mono text-lg text-blue-400 tracking-wider font-extrabold">
                      {coupon.code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {coupon.description || `Enjoy ${coupon.discountPercent}% off rental fees with verified driver status.`}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-[11px] text-slate-400">
                    Max Discount: <strong className="text-slate-200 font-mono">₹{((coupon.maxDiscount || 150) * 50).toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(coupon.code)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        copiedCode === coupon.code
                          ? 'bg-emerald-500 text-slate-950 font-extrabold'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check size={14} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>

                    <Link
                      to={`/cars?coupon=${coupon.code}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <span>Apply to Fleet</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= LIVE FLEET ANNOUNCEMENTS & MESSAGES ================= */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
              <Bell size={20} className="text-amber-400" />
              Live Hub Announcements &amp; Driver Messages
            </h2>
            <p className="text-xs text-slate-400">Real-time operational dispatches from the Main Downtown Car Hub</p>
          </div>

          <div className="space-y-3">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-white">6-Digit Secret Handover Protocol Active</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                    Bay 14 Verified
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every reservation generates a unique 6-digit secret code upon sign-in. Our company concierge driver verifies this code in-person at the hub before handing over the keys. Average handoff time is under 45 seconds.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Zap size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-white">Transparent Fuel Policy Notice</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 font-bold">
                    Customer Refuels
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  All 50 vehicles in our fleet are delivered with verified fuel levels. Customers provide their own fuel during their rental duration, with zero hidden refueling penalties or inflated airport station markup fees.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Car size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-white">Spring Touring Multi-Day Perks</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold">
                    Complimentary Mileage
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Rentals spanning 48 hours or more automatically receive unlimited daily mileage and pre-authorized zero-deductible insurance protection on high-performance Porsche, BMW, and AMG models.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="rounded-3xl p-8 bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-slate-900 border border-blue-500/30 text-center space-y-4">
          <h3 className="text-2xl md:text-3xl font-black text-white">
            Ready to Experience Pure Automotive Freedom?
          </h3>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto">
            Select your exact hours, grab your 6-digit secret code, and meet your concierge driver at Bay 14.
          </p>
          <div className="pt-2">
            <Link
              to="/cars"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#004ac6] hover:bg-blue-600 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <span>Explore Fleet &amp; Book Now</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
