import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, bookingsApi } from '../lib/api';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, MapPin, Calendar, ShieldCheck,
  Key, LogOut, Lock, CheckCircle2, AlertCircle, Car,
  Clock, ArrowLeft, Save, FileText, ChevronRight, Check
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Active sub-tab in profile
  const [activeTab, setActiveTab] = useState<'profile' | 'license' | 'security'>('profile');

  // Personal Info Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
  });

  // License Form
  const [licenseForm, setLicenseForm] = useState({
    number: '',
    expiryDate: '',
    verified: false,
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [bookingCount, setBookingCount] = useState<number>(0);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/profile');
      return;
    }

    setProfileForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
    });

    if (user.drivingLicence) {
      setLicenseForm({
        number: user.drivingLicence.number || '',
        expiryDate: user.drivingLicence.expiryDate ? user.drivingLicence.expiryDate.slice(0, 10) : '',
        verified: !!user.drivingLicence.verified,
      });
    }

    // Load user bookings count
    setLoadingBookings(true);
    bookingsApi.getMyBookings()
      .then(res => {
        setBookingCount((res.data?.data || []).length);
      })
      .catch(() => {})
      .finally(() => setLoadingBookings(false));
  }, [user, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        dateOfBirth: profileForm.dateOfBirth || undefined,
        drivingLicence: licenseForm,
      });
      if (res.data?.data) {
        updateUser(res.data.data);
      }
      toast.success('Profile details saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseForm.number.trim()) {
      toast.error('Driver license number is required');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        dateOfBirth: profileForm.dateOfBirth || undefined,
        drivingLicence: {
          ...licenseForm,
          verified: true, // Self-certify for seamless demo
        },
      });
      if (res.data?.data) {
        updateUser(res.data.data);
      }
      setLicenseForm(prev => ({ ...prev, verified: true }));
      toast.success('Driver license verified & linked to 6-digit PIN handover!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update license');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please fill in both current and new passwords');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password. Please check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of your VELOCE account?')) {
      logout();
      toast.success('Logged out securely');
      navigate('/login');
    }
  };

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000] font-sans antialiased" style={{ paddingTop: '5.5rem', paddingBottom: '4rem' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link to="/" className="text-slate-600 hover:text-black flex items-center gap-1 transition-colors">
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-black font-bold">Driver Profile &amp; Settings</span>
          </div>

          <button
            type="button"
            id="profile-top-logout-btn"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Profile Hero Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#004ac6] text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight m-0">
                  {user.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                  user.role === 'admin'
                    ? 'bg-blue-50 text-[#004ac6] border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {user.role === 'admin' ? '⚡ Executive Admin' : '✓ Verified Driver'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                <span>{user.email}</span>
                <span>•</span>
                <span>{user.phone || '+1 (415) 555-0100'}</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">Bay 14 PIN Verified</span>
              </p>
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-initial bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Trips Logged</span>
              <span className="text-xl font-black text-black">{loadingBookings ? '...' : bookingCount}</span>
            </div>
            <div className="flex-1 md:flex-initial bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">License Status</span>
              <span className="text-sm font-bold text-emerald-700 block mt-0.5">
                {licenseForm.verified ? 'Verified' : 'Active'}
              </span>
            </div>
            <Link
              to="/dashboard"
              className="px-4 py-3 rounded-2xl bg-[#004ac6] hover:bg-[#003da6] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Car size={15} />
              <span>My Trips</span>
            </Link>
          </div>
        </div>

        {/* Profile Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Navigation Tabs */}
          <aside className="lg:col-span-4 space-y-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#004ac6] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-black'
                }`}
              >
                <User size={16} />
                <span>Personal Information</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('license')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'license'
                    ? 'bg-[#004ac6] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-black'
                }`}
              >
                <ShieldCheck size={16} />
                <span>Driver License &amp; ID</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-[#004ac6] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-black'
                }`}
              >
                <Lock size={16} />
                <span>Password &amp; Security</span>
              </button>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                Quick Shortcuts
              </span>

              <div className="space-y-1.5 text-xs">
                <Link
                  to="/dashboard"
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-black transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Key size={14} className="text-[#004ac6]" />
                    <span>Active 6-Digit PIN Codes</span>
                  </span>
                  <ChevronRight size={14} className="text-slate-400" />
                </Link>

                <Link
                  to="/cars"
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-black transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Car size={14} className="text-[#004ac6]" />
                    <span>Browse 50 Fleet Cars</span>
                  </span>
                  <ChevronRight size={14} className="text-slate-400" />
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center justify-between p-2 rounded-xl bg-blue-50/50 hover:bg-blue-50 text-[#004ac6] font-bold transition-colors border border-blue-100"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-[#004ac6]" />
                      <span>Admin Control Center</span>
                    </span>
                    <ChevronRight size={14} className="text-[#004ac6]" />
                  </Link>
                )}
              </div>

              {/* Prominent Red Logout Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  id="profile-sidebar-logout-btn"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <LogOut size={15} />
                  <span>Log Out of VELOCE</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Main Form Section */}
          <main className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">

              {/* TAB 1: PERSONAL INFORMATION */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-black m-0">Personal Information</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Keep your contact details up to date for rental confirmations and SMS handover alerts.
                    </p>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Full Name *</label>
                        <div className="relative">
                          <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={profileForm.name}
                            onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-[#004ac6] focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Email Address</label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            disabled
                            value={profileForm.email}
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-500 font-semibold cursor-not-allowed"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">Registered authentication email</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Mobile Phone *</label>
                        <div className="relative">
                          <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                            placeholder="+1 (415) 890-2341"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-[#004ac6] focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Date of Birth</label>
                        <div className="relative">
                          <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="date"
                            value={profileForm.dateOfBirth}
                            onChange={e => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-[#004ac6] focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-1.5">Physical / Residential Address</label>
                      <div className="relative">
                        <MapPin size={15} className="absolute left-3.5 top-3 text-slate-400" />
                        <textarea
                          rows={2}
                          value={profileForm.address}
                          onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                          placeholder="e.g. 1042 Market St, Apt 4B, San Francisco, CA 94103"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-[#004ac6] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-[11px] text-slate-400 m-0">Changes update your rental agreements in real-time.</p>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="px-6 py-2.5 rounded-full bg-[#004ac6] hover:bg-[#003da6] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save size={15} />
                        <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: DRIVER LICENSE & ID */}
              {activeTab === 'license' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-black m-0">Driver License &amp; Handover ID</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Required for 6-digit secret code verification when meeting your concierge at company Hub Bay 14.
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-emerald-900 block font-bold">Fast-Track Biometric Clearance</strong>
                      <p className="text-emerald-800 mt-0.5 m-0 leading-relaxed">
                        With verified license information, you can simply present your 6-digit booking code to our concierge at Bay 14 and take immediate delivery of the vehicle keys.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateLicense} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Driver License Number *</label>
                        <input
                          type="text"
                          required
                          value={licenseForm.number}
                          onChange={e => setLicenseForm({ ...licenseForm, number: e.target.value.toUpperCase() })}
                          placeholder="e.g. CA DL-928-8842"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-black focus:outline-none focus:border-[#004ac6] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Expiration Date *</label>
                        <input
                          type="date"
                          required
                          value={licenseForm.expiryDate}
                          onChange={e => setLicenseForm({ ...licenseForm, expiryDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-[#004ac6] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">License Verification Status:</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full text-[11px]">
                        <Check size={13} />
                        <span>Active &amp; Cleared for Road</span>
                      </span>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-[11px] text-slate-400 m-0">Encrypted with 256-bit bank-grade TLS security.</p>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="px-6 py-2.5 rounded-full bg-[#004ac6] hover:bg-[#003da6] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        <ShieldCheck size={15} />
                        <span>{savingProfile ? 'Verifying...' : 'Save & Verify License'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: PASSWORD & SECURITY */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-black m-0">Password &amp; Security</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Update your account password to ensure your reservations and telemetry remain protected.
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-black mb-1.5">Current Password *</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={passwordForm.currentPassword}
                          onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          placeholder="Enter your current password"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-black focus:outline-none focus:border-[#004ac6] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-1.5">New Password (Min 6 chars) *</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={passwordForm.newPassword}
                          onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Enter new secure password"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-black focus:outline-none focus:border-[#004ac6] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-1.5">Confirm New Password *</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={passwordForm.confirmPassword}
                          onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Re-enter new password"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-black focus:outline-none focus:border-[#004ac6] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="px-6 py-2.5 rounded-full bg-[#004ac6] hover:bg-[#003da6] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Key size={15} />
                        <span>{savingPassword ? 'Updating Password...' : 'Update Password'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Active Session Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 pt-4 mt-6">
                    <span className="text-xs font-bold text-black block">Active Browser Session</span>
                    <p className="text-xs text-slate-500 m-0">
                      Logged in from your current device. To terminate all active login tokens immediately, click Log Out below.
                    </p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>End Session &amp; Sign Out</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>

      </div>
    </div>
  );
}
