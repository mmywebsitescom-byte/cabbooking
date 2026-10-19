import { Link } from 'react-router-dom';

export default function PoliciesPage() {
  const sections = [
    {
      id: 'pricing',
      icon: 'receipt_long',
      title: 'Transparent Pricing & Tariff Protocol',
      tagline: 'Zero hidden fees. What you see is precisely what you pay.',
      points: [
        'Flexible Billing Options: Seamlessly toggle between hourly flex rates (₹1,200–₹3,500/hr) or 24-hour daily rates (₹7,500–₹25,000/day).',
        'Dynamic Automated Metering: Our engine automatically calculates the most cost-effective combination of daily and hourly rates.',
        'Airport & City Concession Fees: All local airport regulatory surcharges and sales taxes (6.6%) are itemized upfront.',
        'Included Mileage: Every 24-hour rental includes 300 complimentary clean miles. Additional distance is metered at ₹25/km afterwards.',
      ],
    },
    {
      id: 'self-drive',
      icon: 'badge',
      title: '100% Self-Drive Rental Standard',
      tagline: 'You take the wheel. VELOCE operates exclusively as a self-drive fleet.',
      points: [
        'Strictly Self-Drive: We do NOT provide driver booking, chauffeur services, or third-party operators. You drive the vehicle yourself.',
        'Age Requirement: Drivers must be at least 21 years of age with a valid government-issued driver license.',
        'Instant AI Verification: Complete biometric license approval right from your smartphone in under 45 seconds.',
        'Registered Additional Drivers: Up to 1 secondary driver can be authorized during checkout for insurance compliance.',
      ],
    },
    {
      id: 'handover',
      icon: 'lock',
      title: 'In-Person Hub Handover (6-Digit Secret Code Protocol)',
      tagline: 'Company driver brings your vehicle and verifies your 6-digit code before handing over keys.',
      points: [
        '6-Digit Secret Code: Generated automatically upon booking confirmation. Displayed on your confirmation receipt and dashboard.',
        'Car Hub / Office Pickup: Visit our car hub (Main Downtown Car Hub, Bay 14) or company office at your scheduled start time.',
        'Driver Code Verification: The company driver arrives with your prepared vehicle and asks for your 6-digit code.',
        'Immediate Delivery: Once verified, the driver delivers the vehicle keys and inspection checklist. Customer refuels and starts their trip.',
      ],
    },
    {
      id: 'insurance',
      icon: 'verified_user',
      title: 'Security Deposit & Protection Plans',
      tagline: 'Engineered driver peace of mind with zero card limit holds.',
      points: [
        'Zero Security Deposit Eligibility: Qualify with an instant digital ID check. Zero blocked funds or thousands held on your credit limit.',
        'Standard Basic Protection (Included ₹0): Complimentary state minimum third-party coverage with a ₹10,000 damage deductible.',
        'Premium Zero-Deductible (+₹2,500/day): ₹0 excess liability, complete windshield, tire/wheel, undercarriage shield, and priority concierge swap.',
        'Refundable Authorization Hold: A temporary ₹15,000 security hold is authorized at trip start and automatically released within 2 hours of safe return.',
      ],
    },
    {
      id: 'fuel',
      icon: 'local_gas_station',
      title: 'Fuel Policy: Fuel Not Included (Customer Refuels)',
      tagline: 'Company provides the vehicle only for the booked time period. Fuel is not provided by the company.',
      points: [
        'Customer Refuels: Fuel is excluded from the rental tariff. The renter pays for and fills their own fuel as required during the journey.',
        'Vehicle Handover: You receive the vehicle in clean, roadworthy condition for your exact booked time period.',
        'Electric Models (EV): Handed over with battery charge; customer charges at standard EV stations during their trip.',
        'Return Fuel Level: Return the car with the same fuel level as received when your time period ends.',
      ],
    },
    {
      id: 'cancellation',
      icon: 'event_repeat',
      title: 'Cancellation & Trip Flexibility',
      tagline: 'Plans change. We make adjustments frictionless.',
      points: [
        'Free Cancellation: Cancel up to 6 hours before your scheduled pickup departure for an immediate 100% full refund to original payment source.',
        'Late Cancellation: Cancellations made under 6 hours from trip departure incur a 1-hour nominal holding fee.',
        'Grace Period: A 30-minute complimentary grace period is provided for vehicle drop-off at all airport and metro hubs.',
        'Trip Extension: Extend your trip via smartphone app up to 2 hours before return, subject to vehicle scheduling availability.',
      ],
    },
    {
      id: 'mandatory-auth',
      icon: 'lock',
      title: 'Mandatory Sign-In & Verification Policy',
      tagline: 'Security first. No booking can be completed without verified sign-in.',
      points: [
        'Account Requirement: Every customer must sign in or register before confirming any booking or payment.',
        'Identity & License Match: Your verified user account matches your valid government driver license to ensure instant vehicle clearance.',
        'Digital Pass Delivery: Your digital Bluetooth & NFC keys are bound to your authenticated account for maximum vehicle security.',
        'Reservation Tracking: Access your real-time booking, telemetry status, and digital invoice anytime from your user dashboard.',
      ],
    },
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen py-10 selection:bg-primary selection:text-on-primary font-body-md" style={{ paddingTop: '6rem' }}>
      <div className="max-w-5xl mx-auto px-gutter-lg">
        
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 shadow-xs mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
              The VELOCE Standard
            </span>
          </div>

          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-extrabold max-w-3xl mx-auto">
            Rental Policies, Coverage &amp; Verification
          </h1>

          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto mt-3">
            Engineered around driver freedom and transparency. Zero hidden fees, in-person company driver handover with 6-digit secret code, and mandatory sign-in security.
          </p>

          {/* Quick Anchor Navigation Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <a href="#pricing" className="px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-primary text-xs font-semibold text-on-surface transition-colors">
              Pricing &amp; Tariffs
            </a>
            <a href="#self-drive" className="px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-primary text-xs font-semibold text-on-surface transition-colors">
              100% Self-Drive
            </a>
            <a href="#handover" className="px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-primary text-xs font-semibold text-on-surface transition-colors">
              6-Digit Handover Code
            </a>
            <a href="#insurance" className="px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-primary text-xs font-semibold text-on-surface transition-colors">
              Zero Deductible Cover
            </a>
            <a href="#fuel" className="px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-primary text-xs font-semibold text-on-surface transition-colors">
              Fuel &amp; EV Policy
            </a>
            <a href="#cancellation" className="px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-primary text-xs font-semibold text-on-surface transition-colors">
              Free Cancellation
            </a>
            <a href="#mandatory-auth" className="px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 hover:border-red-500 text-xs font-semibold text-red-700 transition-colors">
              🔒 Mandatory Sign-In
            </a>
          </div>
        </div>

        {/* Policy Section Cards */}
        <div className="space-y-6">
          {sections.map(section => (
            <div
              key={section.id}
              id={section.id}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[26px]">{section.icon}</span>
                </div>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">{section.title}</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{section.tagline}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4 border-t border-outline-variant/20">
                {section.points.map((pt, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">check_circle</span>
                    <span className="font-body-sm text-xs md:text-sm text-on-surface leading-relaxed">{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 24/7 Roadside Assistance Banner */}
        <div className="bg-surface-container-low rounded-3xl border border-primary/30 p-8 md:p-10 text-center mt-12 shadow-sm relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary mx-auto flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[32px]">support_agent</span>
          </div>

          <h3 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">
            Have Questions or Need Roadside Dispatch?
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto mt-2 mb-6">
            Our 24/7 technical telemetry team and rapid roadside dispatch are always on call for battery charging, mobile support, or vehicle swaps.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:+18008356231"
              className="px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">phone_in_talk</span>
              <span>Hotline: +1 (800) 835-6231</span>
            </a>
            <Link
              to="/cars"
              className="px-6 py-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors shadow-xs flex items-center gap-2"
            >
              <span>Explore Fleet Catalog</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
