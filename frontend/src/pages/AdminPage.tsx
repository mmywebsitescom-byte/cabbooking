import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car as CarIcon, CalendarCheck, Settings,
  DollarSign, CheckCircle2, XCircle, Search, RefreshCw, AlertTriangle,
  Eye, Check, Users, ArrowUpRight, Plus, Trash2, Edit3, X, MapPin,
  Image as ImageIcon, Sparkles, RotateCcw, CreditCard, Tag,
  BarChart3, Bell, Shield, Download, Filter, Clock, Printer, FileText,
  ChevronRight, Menu, HelpCircle, Send, Key, Receipt, TrendingUp,
  LogOut, Percent, ShieldAlert, Award, AlertCircle, Phone, Mail,
  Database, Star, MessageSquareQuote
} from 'lucide-react';
import { adminApi, carsApi, bookingsApi } from '../lib/api';
import type { Booking, Car, BookingStatus, AuditLog, Coupon } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingPage, formatCurrency, formatDateTime } from '../components/UI';
import toast from 'react-hot-toast';

const DEFAULT_HERO_BG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCjxKZSyiVyihw5s27tMuO8nwB9pSchhwd1JqHjYC9CBP12Vbt5NHNv8Au8n95BYwIxj7pbc1pMsnJsIIMO4Hvr8QBT4AJfbPJw1fcP8mnCFgMBM9nxOMOPX6vwVOGXTqfXtSS8tk4gZ4NtVIJcOBltivuAH7g0YqCZcroSYYGfuwdF-X2b37iZBk2F1S8KclwTOHsBlgpgtdL1d50-gLgNltYL0WWoz3uSwerMvpCM8N3LT25vx-sJA';

const HERO_BG_PRESETS = [
  {
    name: 'Porsche Taycan Studio (Default)',
    desc: 'Original sleek studio shot',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCjxKZSyiVyihw5s27tMuO8nwB9pSchhwd1JqHjYC9CBP12Vbt5NHNv8Au8n95BYwIxj7pbc1pMsnJsIIMO4Hvr8QBT4AJfbPJw1fcP8mnCFgMBM9nxOMOPX6vwVOGXTqfXtSS8tk4gZ4NtVIJcOBltivuAH7g0YqCZcroSYYGfuwdF-X2b37iZBk2F1S8KclwTOHsBlgpgtdL1d50-gLgNltYL0WWoz3uSwerMvpCM8N3LT25vx-sJA',
  },
  {
    name: 'Porsche 911 Highway Sunset',
    desc: 'Golden hour open road cruising',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Mercedes-AMG GT Neon Midnight',
    desc: 'Dark urban racetrack aesthetic',
    url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Audi RS6 Mountain Vista',
    desc: 'Scenic alpine winding route',
    url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1600&auto=format&fit=crop&q=80',
  },
  {
    name: 'BMW M Performance Hub',
    desc: 'High-contrast precision track bay',
    url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1600&auto=format&fit=crop&q=80',
  },
];

type AdminTab =
  | 'dashboard'
  | 'bookings'
  | 'fleet'
  | 'locations'
  | 'customers'
  | 'payments'
  | 'pricing'
  | 'cms'
  | 'reviews'
  | 'backup'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'security';

export default function AdminPage() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const navigate = useNavigate();

  // Admin In-Page Authentication State
  const [adminEmail, setAdminEmail] = useState('admin@veloce.io');
  const [adminPassword, setAdminPassword] = useState('Admin@123');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Database Data States
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search & Filter States
  const [globalSearch, setGlobalSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [bookingPaymentFilter, setBookingPaymentFilter] = useState<string>('all');

  const [carSearch, setCarSearch] = useState('');
  const [carCategoryFilter, setCarCategoryFilter] = useState<string>('all');
  const [carStatusFilter, setCarStatusFilter] = useState<string>('all');

  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  // Modals & Detailed Views
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusModalBooking, setStatusModalBooking] = useState<Booking | null>(null);
  const [newStatusValue, setNewStatusValue] = useState<BookingStatus>('confirmed');
  const [adminNoteInput, setAdminNoteInput] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [loadingCustomerBookings, setLoadingCustomerBookings] = useState(false);

  const [viewingReceipt, setViewingReceipt] = useState<Booking | null>(null);

  // Car Modal State
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [savingCar, setSavingCar] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const carFileInputRef = useRef<HTMLInputElement>(null);
  const [carForm, setCarForm] = useState({
    name: '',
    brand: '',
    model: '',
    year: 2024,
    category: 'sedan',
    totalQuantity: 4,
    hourlyRate: 28,
    dailyRate: 180,
    securityDeposit: 200,
    transmission: 'automatic',
    fuelType: 'petrol',
    seatingCapacity: 5,
    hubLocation: 'Main Downtown Car Hub - 4th Street',
    plateNumber: 'CAL-9042',
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
    description: 'Immaculate vehicle ready for immediate self-drive rental. Customer refuels.',
  });

  // Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState<Coupon>({
    code: '',
    discountPercent: 15,
    minHours: 4,
    maxDiscount: 100,
    isActive: true,
    description: '',
  });

  // Settings State
  const [companySettings, setCompanySettings] = useState({
    companyName: 'VELOCE',
    companyEmail: 'support@veloce.io',
    companyPhone: '+1 (800) 835-6231',
    companyAddress: 'Main Downtown Car Hub, 4th Street, San Francisco, CA 94103',
    cancellationPolicy: 'Free cancellation up to 6 hours before scheduled pickup time.',
    fuelPolicy: 'Customer provides their own fuel for the duration of the rental. Fuel is not provided by the company.',
    taxRate: 6.6,
    seasonalSurgeEnabled: false,
    seasonalSurgeMultiplier: 1.15,
  });

  // Hero Background Settings
  const [adminHeroBg, setAdminHeroBg] = useState<string>(() => {
    return localStorage.getItem('veloce_hero_bg') || DEFAULT_HERO_BG;
  });
  const [customHeroBgInput, setCustomHeroBgInput] = useState('');

  // Notifications Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'alert'>('info');

  // CMS & Public Site Content State
  const [cmsContent, setCmsContent] = useState({
    hero: {
      headlineMain: 'Your Drive. Your Time.',
      headlineHighlight: 'Your Freedom.',
      bgImage: '/images/hero-bg.jpg',
    },
    policies: {
      fuelPolicy: 'Customer provides their own fuel. Vehicles are inspected at hub handover and returned with matched fuel level.',
      secretPinPolicy: 'Meet company driver at reserved hub. Verify your secure 6-digit secret code before keys are handed over.',
      depositPolicy: 'Refundable security deposit is pre-authorized and automatically released within 2 hours of post-trip vehicle return inspection.'
    },
    support: {
      hotline: '+1 (800) 835-6231',
      email: 'support@veloce.io',
      hours: '24/7 Roadside & Hub Dispatch Active'
    }
  });
  const [savingCms, setSavingCms] = useState(false);

  // Customer Reviews State
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'approved' | 'hidden'>('all');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({
    author: '',
    role: 'Verified Driver • 5 Trips Logged',
    vehicle: 'Porsche 911 Carrera',
    rating: 5,
    quote: '',
    isApproved: true,
  });

  // Backup & Data Export State
  const [backupStats, setBackupStats] = useState<{
    carsCount: number;
    bookingsCount: number;
    usersCount: number;
    logsCount: number;
    lastBackupAt: string | null;
    systemHealth: string;
    database: string;
    databaseStatus: string;
  } | null>(null);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [auditLogSearch, setAuditLogSearch] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('all');

  // Hub Locations Management State
  const [locations, setLocations] = useState<any[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationStatusFilter, setLocationStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState({
    name: '',
    code: '',
    address: '',
    city: 'San Francisco',
    operatingHours: '24/7 Concierge Handover',
    phone: '+1 (415) 555-0100',
    hubPin: '772910',
    isActive: true,
  });

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAllAdminData();
    }
  }, [user]);

  const handleAdminSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAdminLoggingIn(true);
    try {
      await login(adminEmail, adminPassword);
      toast.success('Authenticated as System Administrator!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid administrator credentials');
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const recordAudit = async (action: string, category: any, details: string, targetId?: string) => {
    try {
      await adminApi.createAuditLog({ action, category, details, targetId });
      // Refresh audit logs in background
      adminApi.getAuditLogs().then(res => setAuditLogs(res.data.data || []));
    } catch {
      // ignore
    }
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const [
        dashRes,
        bookingsRes,
        carsRes,
        usersRes,
        paymentsRes,
        couponsRes,
        auditRes,
        cmsRes,
        reviewsRes,
        backupStatsRes,
        locationsRes
      ] = await Promise.all([
        adminApi.getDashboard().catch(() => ({ data: { data: null } })),
        adminApi.getAllBookings().catch(() => ({ data: { data: [] } })),
        carsApi.getAllAdmin().catch(() => ({ data: { data: [] } })),
        adminApi.getAllUsers().catch(() => ({ data: { data: [] } })),
        adminApi.getPayments().catch(() => ({ data: { data: { payments: [], summary: null } } })),
        adminApi.getCoupons().catch(() => ({ data: { data: [] } })),
        adminApi.getAuditLogs().catch(() => ({ data: { data: [] } })),
        adminApi.getCms().catch(() => ({ data: { data: null } })),
        adminApi.getReviews().catch(() => ({ data: { data: [] } })),
        adminApi.getBackupStats().catch(() => ({ data: { data: null } })),
        adminApi.getLocations().catch(() => ({ data: { data: [] } })),
      ]);

      setStats(dashRes.data.data);
      setBookings(bookingsRes.data.data || []);
      setCars(carsRes.data.data || []);
      setCustomers(usersRes.data.data || []);
      setPayments(paymentsRes.data.data?.payments || []);
      setPaymentSummary(paymentsRes.data.data?.summary || null);
      setCoupons(couponsRes.data.data || []);
      setAuditLogs(auditRes.data.data || []);
      setLocations(locationsRes.data?.data || []);
      if (cmsRes.data?.data) {
        setCmsContent(prev => ({ ...prev, ...cmsRes.data.data }));
        if (cmsRes.data.data.hero?.bgImage) {
          setAdminHeroBg(cmsRes.data.data.hero.bgImage);
        }
      }
      if (reviewsRes.data?.data) {
        setReviewsList(reviewsRes.data.data);
      }
      if (backupStatsRes.data?.data) {
        setBackupStats(backupStatsRes.data.data);
      }
    } catch {
      toast.error('Failed to load complete admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ================= ACTION HANDLERS =================

  // Approve Booking
  const handleApproveBooking = async (id: string, bookingId: string) => {
    try {
      const res = await adminApi.approveBooking(id);
      toast.success(`Booking ${bookingId} approved!`);
      setBookings(prev => prev.map(b => b._id === id ? res.data.data : b));
      recordAudit('BOOKING_APPROVED', 'booking', `Approved booking #${bookingId}`, id);
      if (selectedBooking?._id === id) setSelectedBooking(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve booking');
    }
  };

  // Reject Booking
  const handleRejectBooking = async (id: string, bookingId: string) => {
    const reason = window.prompt(`Enter rejection reason for booking #${bookingId}:`, 'Schedule conflict at hub');
    if (reason === null) return;
    try {
      const res = await adminApi.rejectBooking(id, { reason });
      toast.success(`Booking ${bookingId} rejected and cancelled`);
      setBookings(prev => prev.map(b => b._id === id ? res.data.data : b));
      recordAudit('BOOKING_REJECTED', 'booking', `Rejected booking #${bookingId}. Reason: ${reason}`, id);
      if (selectedBooking?._id === id) setSelectedBooking(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reject booking');
    }
  };

  // Update Status Modal Submit
  const handleSaveStatusModal = async () => {
    if (!statusModalBooking) return;
    try {
      const res = await adminApi.updateBookingStatus(statusModalBooking._id, {
        status: newStatusValue,
        adminNotes: adminNoteInput,
      });
      toast.success(`Booking #${statusModalBooking.bookingId} set to ${newStatusValue}`);
      setBookings(prev => prev.map(b => b._id === statusModalBooking._id ? res.data.data : b));
      recordAudit('STATUS_UPDATED', 'booking', `Changed #${statusModalBooking.bookingId} status to ${newStatusValue}`, statusModalBooking._id);
      setStatusModalBooking(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  // Cash Payment Confirm
  const handleConfirmCashPayment = async (id: string, bookingId: string) => {
    try {
      await adminApi.confirmCash(id);
      toast.success(`Cash payment confirmed for #${bookingId}`);
      recordAudit('CASH_CONFIRMED', 'payment', `Confirmed cash receipt for #${bookingId}`, id);
      loadAllAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to confirm cash');
    }
  };

  // Refund Payment
  const handleRefundPayment = async (id: string, bookingId: string, amount: number) => {
    if (!window.confirm(`Issue refund of $${amount.toFixed(2)} for #${bookingId}?`)) return;
    try {
      await adminApi.refundBooking(id, { refundAmount: amount });
      toast.success(`Refund processed for #${bookingId}`);
      recordAudit('REFUND_ISSUED', 'payment', `Refunded $${amount} on #${bookingId}`, id);
      loadAllAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to process refund');
    }
  };

  // Toggle Car Availability
  const handleToggleCarAvailability = async (car: Car) => {
    try {
      await carsApi.update(car._id, { isAvailable: !car.isAvailable });
      setCars(prev => prev.map(c => c._id === car._id ? { ...c, isAvailable: !c.isAvailable } : c));
      toast.success(`${car.name} marked ${!car.isAvailable ? 'Available' : 'Unavailable'}`);
      recordAudit('CAR_AVAILABILITY_TOGGLED', 'fleet', `Toggled ${car.name} to ${!car.isAvailable ? 'Available' : 'Unavailable'}`, car._id);
    } catch {
      toast.error('Failed to update car availability');
    }
  };

  // Delete Car
  const handleDeleteCar = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete "${name}" from fleet inventory?`)) return;
    try {
      await carsApi.delete(id);
      setCars(prev => prev.filter(c => c._id !== id));
      toast.success(`Deleted ${name} from fleet`);
      recordAudit('CAR_DELETED', 'fleet', `Deleted model ${name}`, id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete car');
    }
  };

  // Open Car Add/Edit Modal
  const openAddCarModal = () => {
    setEditingCarId(null);
    setCarForm({
      name: '',
      brand: '',
      model: '',
      year: 2024,
      category: 'sedan',
      totalQuantity: 4,
      hourlyRate: 28,
      dailyRate: 180,
      securityDeposit: 200,
      transmission: 'automatic',
      fuelType: 'petrol',
      seatingCapacity: 5,
      hubLocation: 'Main Downtown Car Hub - 4th Street',
      plateNumber: 'CAL-9042',
      imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
      description: 'Available for rental for selected time period. Customer refuels.',
    });
    setIsCarModalOpen(true);
  };

  const openEditCarModal = (c: Car) => {
    setEditingCarId(c._id);
    setCarForm({
      name: c.name || '',
      brand: c.brand || '',
      model: c.model || '',
      year: c.year || 2024,
      category: c.category || 'sedan',
      totalQuantity: c.totalQuantity || 1,
      hourlyRate: c.pricing?.hourlyRate || 28,
      dailyRate: c.pricing?.dailyRate || 180,
      securityDeposit: c.pricing?.securityDeposit || 200,
      transmission: c.transmission || 'automatic',
      fuelType: c.fuelType || 'petrol',
      seatingCapacity: c.seatingCapacity || 5,
      hubLocation: c.hubLocation || 'Main Downtown Car Hub - 4th Street',
      plateNumber: c.plateNumber || 'CAL-9042',
      imageUrl: (c.images && c.images[0]) || '',
      description: c.description || '',
    });
    setIsCarModalOpen(true);
  };

  // Handle Car Image Upload
  const handleCarImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);
    try {
      const res = await carsApi.uploadImage(formData);
      if (res.data?.url) {
        setCarForm(prev => ({ ...prev, imageUrl: res.data.url }));
        toast.success('Car image uploaded successfully!');
      }
    } catch {
      toast.error('Image upload failed. You can also paste an image URL directly.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Car Form
  const handleSaveCarForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carForm.name.trim() || !carForm.brand.trim() || !carForm.model.trim()) {
      toast.error('Name, brand, and model are required');
      return;
    }
    setSavingCar(true);
    try {
      const payload: any = {
        name: carForm.name.trim(),
        brand: carForm.brand.trim(),
        model: carForm.model.trim(),
        year: Number(carForm.year) || 2024,
        category: carForm.category,
        totalQuantity: Math.max(1, Number(carForm.totalQuantity) || 1),
        pricing: {
          hourlyRate: Number(carForm.hourlyRate),
          dailyRate: Number(carForm.dailyRate),
          securityDeposit: Number(carForm.securityDeposit),
          extraHourRate: Math.round(Number(carForm.hourlyRate) * 1.15),
        },
        transmission: carForm.transmission,
        fuelType: carForm.fuelType,
        seatingCapacity: Number(carForm.seatingCapacity) || 5,
        hubLocation: carForm.hubLocation || 'Main Downtown Car Hub - 4th Street',
        plateNumber: carForm.plateNumber || 'CAL-9042',
        images: carForm.imageUrl ? [carForm.imageUrl] : [],
        description: carForm.description || '',
        fuelPolicy: 'customer-refuels',
      };

      if (editingCarId) {
        await carsApi.update(editingCarId, payload);
        toast.success(`Updated ${carForm.name}`);
        recordAudit('CAR_UPDATED', 'fleet', `Updated vehicle model ${carForm.name}`, editingCarId);
      } else {
        await carsApi.create(payload);
        toast.success(`Added new model: ${carForm.name}`);
        recordAudit('CAR_CREATED', 'fleet', `Added new fleet model ${carForm.name}`);
      }
      setIsCarModalOpen(false);
      loadAllAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save car');
    } finally {
      setSavingCar(false);
    }
  };

  // Toggle Customer Active Status
  const handleToggleCustomerStatus = async (customer: any) => {
    const nextState = !customer.isActive;
    if (!window.confirm(`${nextState ? 'Activate' : 'Suspend'} account for ${customer.name}?`)) return;
    try {
      await adminApi.updateUser(customer._id, { isActive: nextState });
      setCustomers(prev => prev.map(c => c._id === customer._id ? { ...c, isActive: nextState } : c));
      toast.success(`User ${customer.name} is now ${nextState ? 'Active' : 'Suspended'}`);
      recordAudit('USER_STATUS_TOGGLED', 'user', `${nextState ? 'Activated' : 'Suspended'} user ${customer.email}`, customer._id);
    } catch {
      toast.error('Failed to update user status');
    }
  };

  // View Customer Booking History
  const handleViewCustomerBookings = async (customer: any) => {
    setSelectedCustomer(customer);
    setLoadingCustomerBookings(true);
    try {
      const res = await adminApi.getUserBookings(customer._id);
      setCustomerBookings(res.data.data || []);
    } catch {
      toast.error('Failed to load customer trips');
    } finally {
      setLoadingCustomerBookings(false);
    }
  };

  // Coupon Handlers
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    const cleanCode = couponForm.code.trim().toUpperCase();
    const updatedCoupons = [
      ...coupons.filter(c => c.code !== cleanCode),
      { ...couponForm, code: cleanCode }
    ];
    try {
      await adminApi.saveCoupons(updatedCoupons);
      setCoupons(updatedCoupons);
      setIsCouponModalOpen(false);
      toast.success(`Coupon ${cleanCode} saved!`);
      recordAudit('COUPON_SAVED', 'pricing', `Saved coupon code ${cleanCode}`);
    } catch {
      toast.error('Failed to save coupon');
    }
  };

  const handleToggleCoupon = async (code: string) => {
    const updated = coupons.map(c => c.code === code ? { ...c, isActive: !c.isActive } : c);
    try {
      await adminApi.saveCoupons(updated);
      setCoupons(updated);
      toast.success(`Coupon ${code} updated`);
    } catch {
      toast.error('Failed to update coupon');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Delete coupon ${code}?`)) return;
    const updated = coupons.filter(c => c.code !== code);
    try {
      await adminApi.saveCoupons(updated);
      setCoupons(updated);
      toast.success(`Coupon ${code} deleted`);
      recordAudit('COUPON_DELETED', 'pricing', `Deleted coupon ${code}`);
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  // Hero Background Controls
  const handleApplyHeroBg = (url: string) => {
    if (!url || !url.trim()) {
      toast.error('Please provide a valid image URL');
      return;
    }
    const cleanUrl = url.trim();
    setAdminHeroBg(cleanUrl);
    localStorage.setItem('veloce_hero_bg', cleanUrl);
    window.dispatchEvent(new Event('hero-bg-updated'));
    toast.success('Homepage hero background updated live!');
    recordAudit('HERO_BG_UPDATED', 'settings', `Applied hero background: ${cleanUrl.slice(0, 50)}...`);
  };

  const handleResetHeroBg = () => {
    handleApplyHeroBg(DEFAULT_HERO_BG);
    setCustomHeroBgInput('');
    toast.success('Reset homepage hero background to default');
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('System policies & hub configuration saved');
    recordAudit('SETTINGS_UPDATED', 'settings', 'Updated company policies, hubs, and tax rates');
  };

  // Send Broadcast Notification
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    toast.success(`Broadcast dispatched to active drivers: "${broadcastMessage}"`);
    recordAudit('BROADCAST_SENT', 'security', `Broadcast sent: ${broadcastMessage}`);
    setBroadcastMessage('');
  };

  // CSV Export Utility
  const exportToCsv = (filename: string, rows: object[]) => {
    if (!rows || !rows.length) {
      toast.error('No records available to export');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(header => {
        const val = (row as any)[header];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filename}.csv`);
    recordAudit('CSV_EXPORTED', 'security', `Exported ${filename}.csv (${rows.length} rows)`);
  };

  // ================= CMS & PUBLIC CONTENT HANDLERS =================
  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCms(true);
    try {
      await adminApi.updateCms(cmsContent);
      if (cmsContent.hero?.bgImage) {
        localStorage.setItem('veloce_hero_bg', cmsContent.hero.bgImage);
        window.dispatchEvent(new Event('hero-bg-updated'));
      }
      toast.success('Public page content & CMS saved successfully!');
      recordAudit('UPDATE_SITE_CMS', 'system', 'Updated site hero headline and public policies');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save CMS content');
    } finally {
      setSavingCms(false);
    }
  };

  // ================= CUSTOMER REVIEWS HANDLERS =================
  const handleToggleReviewStatus = async (review: any) => {
    try {
      const updatedStatus = review.isApproved === false ? true : false;
      await adminApi.updateReview(review.id, { isApproved: updatedStatus });
      setReviewsList(prev => prev.map(r => r.id === review.id ? { ...r, isApproved: updatedStatus } : r));
      toast.success(updatedStatus ? 'Review approved & visible on home page!' : 'Review hidden from home page');
      recordAudit('UPDATE_REVIEW', 'system', `${updatedStatus ? 'Approved' : 'Hidden'} review by ${review.author}`, review.id);
    } catch {
      toast.error('Failed to update review status');
    }
  };

  const handleDeleteReview = async (id: string, author: string) => {
    if (!window.confirm(`Delete review from "${author}"?`)) return;
    try {
      await adminApi.deleteReview(id);
      setReviewsList(prev => prev.filter(r => r.id !== id));
      toast.success('Review removed');
      recordAudit('DELETE_REVIEW', 'system', `Deleted review by ${author}`, id);
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const handleSaveReviewModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReviewId) {
        const res = await adminApi.updateReview(editingReviewId, reviewForm);
        setReviewsList(prev => prev.map(r => r.id === editingReviewId ? res.data.data : r));
        toast.success('Review updated!');
      } else {
        const res = await adminApi.createReview(reviewForm);
        setReviewsList(prev => [res.data.data, ...prev]);
        toast.success('New customer review added!');
      }
      setIsReviewModalOpen(false);
      setEditingReviewId(null);
      setReviewForm({
        author: '',
        role: 'Verified Driver • 5 Trips Logged',
        vehicle: 'Porsche 911 Carrera',
        rating: 5,
        quote: '',
        isApproved: true,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save review');
    }
  };

  // ================= DATABASE BACKUP HANDLER =================
  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const res = await adminApi.exportBackup();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `veloce_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Full database backup downloaded!');
      recordAudit('DATABASE_BACKUP_EXPORT', 'security', 'Admin downloaded full JSON database backup');
      const statsRes = await adminApi.getBackupStats();
      if (statsRes.data?.data) setBackupStats(statsRes.data.data);
    } catch {
      toast.error('Failed to export database backup');
    } finally {
      setExportingBackup(false);
    }
  };

  // ================= HUB LOCATIONS CRUD HANDLERS =================
  const handleOpenAddLocation = () => {
    setEditingLocationId(null);
    setLocationForm({
      name: '',
      code: '',
      address: '',
      city: 'San Francisco',
      operatingHours: '24/7 Concierge Handover',
      phone: '+1 (415) 555-0100',
      hubPin: String(Math.floor(100000 + Math.random() * 900000)),
      isActive: true,
    });
    setIsLocationModalOpen(true);
  };

  const handleOpenEditLocation = (loc: any) => {
    setEditingLocationId(loc._id);
    setLocationForm({
      name: loc.name || '',
      code: loc.code || '',
      address: loc.address || '',
      city: loc.city || 'San Francisco',
      operatingHours: loc.operatingHours || '24/7 Concierge Handover',
      phone: loc.phone || '+1 (415) 555-0100',
      hubPin: loc.hubPin || '772910',
      isActive: loc.isActive !== undefined ? loc.isActive : true,
    });
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.name.trim() || !locationForm.code.trim()) {
      toast.error('Location name and code are required');
      return;
    }
    setSavingLocation(true);
    try {
      const payload = {
        ...locationForm,
        code: locationForm.code.trim().toUpperCase(),
      };
      if (editingLocationId) {
        const res = await adminApi.updateLocation(editingLocationId, payload);
        const updated = res.data.data;
        setLocations(prev => prev.map(l => l._id === editingLocationId ? updated : l));
        toast.success(`Updated hub: ${payload.name}`);
        recordAudit('LOCATION_UPDATED', 'settings', `Updated hub location ${payload.name}`, editingLocationId);
      } else {
        const res = await adminApi.createLocation(payload);
        const created = res.data.data;
        setLocations(prev => [created, ...prev]);
        toast.success(`Added new pickup hub: ${payload.name}`);
        recordAudit('LOCATION_CREATED', 'settings', `Created hub location ${payload.name}`);
      }
      setIsLocationModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save location');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleDeleteLocation = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete pickup hub "${name}"?`)) return;
    try {
      await adminApi.deleteLocation(id);
      setLocations(prev => prev.filter(l => l._id !== id));
      toast.success(`Hub "${name}" deleted`);
      recordAudit('LOCATION_DELETED', 'settings', `Deleted hub location ${name}`, id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete location');
    }
  };

  const handleToggleLocationActive = async (loc: any) => {
    const nextState = !loc.isActive;
    try {
      const res = await adminApi.updateLocation(loc._id, { isActive: nextState });
      setLocations(prev => prev.map(l => l._id === loc._id ? res.data.data : l));
      toast.success(`Hub is now ${nextState ? 'Active' : 'Offline'}`);
      recordAudit('LOCATION_STATUS_TOGGLED', 'settings', `${nextState ? 'Activated' : 'Deactivated'} hub ${loc.name}`, loc._id);
    } catch {
      toast.error('Failed to update hub status');
    }
  };

  // ================= FILTERED DATA COMPUTATIONS =================

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const q = locationSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        loc.name?.toLowerCase().includes(q) ||
        loc.code?.toLowerCase().includes(q) ||
        loc.city?.toLowerCase().includes(q) ||
        loc.address?.toLowerCase().includes(q);

      const matchesStatus =
        locationStatusFilter === 'all' ||
        (locationStatusFilter === 'active' && loc.isActive) ||
        (locationStatusFilter === 'inactive' && !loc.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [locations, locationSearch, locationStatusFilter]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const q = bookingSearch.toLowerCase() || globalSearch.toLowerCase();
      const matchesSearch =
        !q ||
        b.bookingId.toLowerCase().includes(q) ||
        b.customerDetails?.name?.toLowerCase().includes(q) ||
        b.customerDetails?.email?.toLowerCase().includes(q) ||
        b.customerDetails?.phone?.toLowerCase().includes(q) ||
        b.car?.name?.toLowerCase().includes(q);

      const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
      const matchesPayment = bookingPaymentFilter === 'all' || b.payment?.status === bookingPaymentFilter || (bookingPaymentFilter === 'cash' && b.payment?.method === 'cash');

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [bookings, bookingSearch, globalSearch, bookingStatusFilter, bookingPaymentFilter]);

  const filteredCars = useMemo(() => {
    return cars.filter(c => {
      const q = carSearch.toLowerCase() || globalSearch.toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        (c.plateNumber && c.plateNumber.toLowerCase().includes(q));

      const matchesCategory = carCategoryFilter === 'all' || c.category === carCategoryFilter;
      const matchesStatus =
        carStatusFilter === 'all' ||
        (carStatusFilter === 'available' && c.isAvailable) ||
        (carStatusFilter === 'maintenance' && !c.isAvailable);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [cars, carSearch, globalSearch, carCategoryFilter, carStatusFilter]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = customerSearch.toLowerCase() || globalSearch.toLowerCase();
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      );
    });
  }, [customers, customerSearch, globalSearch]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (paymentStatusFilter === 'all') return true;
      if (paymentStatusFilter === 'cash') return p.payment?.method === 'cash';
      return p.payment?.status === paymentStatusFilter;
    });
  }, [payments, paymentStatusFilter]);

  const filteredReviews = useMemo(() => {
    return reviewsList.filter(r => {
      const q = reviewSearch.toLowerCase() || globalSearch.toLowerCase();
      const matchesSearch =
        !q ||
        r.author?.toLowerCase().includes(q) ||
        r.vehicle?.toLowerCase().includes(q) ||
        r.quote?.toLowerCase().includes(q);
      const matchesFilter =
        reviewFilter === 'all' ||
        (reviewFilter === 'approved' && r.isApproved !== false) ||
        (reviewFilter === 'hidden' && r.isApproved === false);
      return matchesSearch && matchesFilter;
    });
  }, [reviewsList, reviewSearch, globalSearch, reviewFilter]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const q = auditLogSearch.toLowerCase() || globalSearch.toLowerCase();
      const matchesSearch =
        !q ||
        log.action?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        log.performedBy?.email?.toLowerCase().includes(q);
      const matchesCategory =
        auditCategoryFilter === 'all' || log.category === auditCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [auditLogs, auditLogSearch, globalSearch, auditCategoryFilter]);

  // System Notifications calculation based on live database state
  const systemNotifications = useMemo(() => {
    const list: Array<{ id: string; type: 'warning' | 'alert' | 'info'; title: string; desc: string; time: string; linkTab?: AdminTab }> = [];

    const pendingBookings = bookings.filter(b => b.status === 'pending');
    if (pendingBookings.length > 0) {
      list.push({
        id: 'notif-pending-bk',
        type: 'warning',
        title: `${pendingBookings.length} Pending Booking(s) Awaiting Review`,
        desc: `Customers have placed reservations that need administrative approval or rejection.`,
        time: 'Action Required',
        linkTab: 'bookings'
      });
    }

    const pendingCash = bookings.filter(b => b.payment?.method === 'cash' && b.payment?.status === 'pending');
    if (pendingCash.length > 0) {
      list.push({
        id: 'notif-pending-cash',
        type: 'alert',
        title: `${pendingCash.length} Cash Payment(s) Pending at Hub`,
        desc: `Customers chose Cash on Hub. Confirm physical cash or swipe before 6-digit key handover.`,
        time: 'Immediate',
        linkTab: 'payments'
      });
    }

    const unverifiedDeliveries = bookings.filter(b => b.status === 'confirmed' && b.handoverStatus === 'awaiting_code_verification');
    if (unverifiedDeliveries.length > 0) {
      list.push({
        id: 'notif-code-verify',
        type: 'info',
        title: `${unverifiedDeliveries.length} Vehicle Handover(s) Scheduled`,
        desc: `Company driver waiting at hub. Secret 6-digit code verification required at Bay 14.`,
        time: 'Live Hub Feed',
        linkTab: 'bookings'
      });
    }

    const maintenanceCars = cars.filter(c => !c.isAvailable);
    if (maintenanceCars.length > 0) {
      list.push({
        id: 'notif-maintenance',
        type: 'info',
        title: `${maintenanceCars.length} Vehicle(s) Under Service / Inspection`,
        desc: `Units are currently offline from public booking catalog.`,
        time: 'Fleet Notice',
        linkTab: 'fleet'
      });
    }

    return list;
  }, [bookings, cars]);

  if (authLoading) {
    return <LoadingPage />;
  }

  // If user is not logged in or not admin, show dedicated executive admin access gate!
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-4 antialiased">
        <div className="max-w-md w-full bg-[#1E293B] rounded-3xl p-8 border border-slate-700/80 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#CE2626] via-[#E8DBB3] to-[#7DAACB]"></div>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#CE2626] text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/25">
              ⚡
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">VELOCE Control Center</h1>
            <p className="text-xs text-slate-400 mt-1">Executive Administrator Authentication Required</p>
          </div>

          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:border-[#CE2626] focus:outline-none"
                placeholder="admin@veloce.io"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Security Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:border-[#CE2626] focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={adminLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-[#CE2626] hover:bg-[#b31d1d] text-white font-extrabold text-sm tracking-wide transition-all shadow-lg shadow-red-500/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {adminLoggingIn ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Shield size={16} />
                  <span>⚡ Sign In to Admin Control Center</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center flex flex-col gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Demo Credentials: <strong className="text-amber-400">admin@veloce.io</strong> / <strong className="text-amber-400">Admin@123</strong>
            </span>
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 mt-1 font-semibold"
            >
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !bookings.length && !cars.length) {
    return <LoadingPage />;
  }

  // Navigation Items Definitions
  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'bookings' as AdminTab, label: 'Booking Management', icon: CalendarCheck, badge: stats?.pendingBookings || null, badgeColor: 'bg-amber-500' },
    { id: 'fleet' as AdminTab, label: 'Fleet Management', icon: CarIcon, badge: cars.length || null, badgeColor: 'bg-blue-600' },
    { id: 'locations' as AdminTab, label: 'Hub Locations', icon: MapPin, badge: `${locations.length} Hubs`, badgeColor: 'bg-emerald-600' },
    { id: 'customers' as AdminTab, label: 'Customer Management', icon: Users, badge: customers.length || null, badgeColor: 'bg-slate-500' },
    { id: 'payments' as AdminTab, label: 'Payment Management', icon: CreditCard, badge: stats?.pendingPaymentsCount || null, badgeColor: 'bg-orange-500' },
    { id: 'pricing' as AdminTab, label: 'Pricing & Offers', icon: Tag, badge: `${coupons.length} Deals`, badgeColor: 'bg-emerald-600' },
    { id: 'cms' as AdminTab, label: 'Page Content & CMS', icon: FileText, badge: 'Live', badgeColor: 'bg-indigo-600' },
    { id: 'reviews' as AdminTab, label: 'Customer Reviews', icon: Star, badge: `${reviewsList.length}`, badgeColor: 'bg-amber-500' },
    { id: 'backup' as AdminTab, label: 'User Logs & Backup', icon: Database, badge: 'System', badgeColor: 'bg-cyan-600' },
    { id: 'reports' as AdminTab, label: 'Reports & Analytics', icon: BarChart3, badge: null },
    { id: 'notifications' as AdminTab, label: 'Notifications', icon: Bell, badge: systemNotifications.length || null, badgeColor: 'bg-rose-500' },
    { id: 'settings' as AdminTab, label: 'Settings & Policies', icon: Settings, badge: null },
    { id: 'security' as AdminTab, label: 'Admin Security', icon: Shield, badge: 'Protected', badgeColor: 'bg-indigo-600' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans flex flex-col antialiased">
      
      {/* ================= TOP APPLICATION HEADER ================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Toggle Menu"
          >
            <Menu size={20} />
          </button>

          <Link to="/" className="flex items-center gap-2.5 text-decoration-none group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#004ac6] to-[#2563eb] flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              V
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[#0f172a]">VELOCE</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-[#004ac6] border border-blue-200">
                  Control Center
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Fleet &amp; Executive Operations</p>
            </div>
          </Link>
        </div>

        {/* Global Live Search Bar */}
        <div className="hidden md:flex items-center relative max-w-xs w-full mx-4">
          <Search size={16} className="absolute left-3 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Search bookings, cars, customers..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#004ac6] focus:bg-white transition-all shadow-2xs"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Action Controls & Admin Profile Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={loadAllAdminData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
            title="Refresh database records"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#004ac6]' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/cars"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-[#004ac6] hover:bg-blue-100 transition-colors shadow-2xs"
            style={{ textDecoration: 'none' }}
          >
            <Eye size={13} />
            <span className="hidden sm:inline">Live Site</span>
            <ArrowUpRight size={12} />
          </Link>

          {/* Notifications Quick Jump */}
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 rounded-lg text-slate-600 hover:text-[#004ac6] hover:bg-slate-100 transition-colors"
            title="System Alerts"
          >
            <Bell size={18} />
            {systemNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* Admin Avatar & Role */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#004ac6] to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'Super Admin'}</div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Authorized
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= WORKSPACE BODY (SIDEBAR + MAIN CANVAS) ================= */}
      <div className="flex flex-1 relative">
        
        {/* MOBILE SIDEBAR BACKDROP */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          />
        )}

        {/* SIDEBAR NAVIGATION */}
        <aside className={`
          fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between py-4 px-3 transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)]
          ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col gap-1 overflow-y-auto pr-1">
            <div className="px-3 pb-2 pt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Management Modules
            </div>

            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group text-left
                    ${isActive
                      ? 'bg-blue-50 text-[#004ac6] font-bold shadow-xs border-l-4 border-[#004ac6]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={isActive ? 'text-[#004ac6]' : 'text-slate-400 group-hover:text-slate-600'}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-slate-500'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Controls */}
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Active Hub Location</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1">
                <MapPin size={12} className="text-[#004ac6]" />
                Main Downtown Hub
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Bay 14A - 14D (Handover Ready)</div>
            </div>

            <Link
              to="/profile"
              id="admin-sidebar-profile-btn"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Users size={14} className="text-[#004ac6]" />
              <span>Admin Profile &amp; Settings</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              id="admin-sidebar-logout-btn"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={14} />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </aside>

        {/* MAIN APPLICATION CANVAS */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
          
          {/* Breadcrumb & Section Title Bar */}
          <div className="flex flex-wrap items-center justify-between pb-6 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 font-medium">
                <span>VELOCE Control</span>
                <ChevronRight size={12} />
                <span className="capitalize text-slate-900 font-semibold">{activeTab}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {activeTab === 'dashboard' && 'Operations Dashboard'}
                {activeTab === 'bookings' && 'Booking & Reservation Management'}
                {activeTab === 'fleet' && 'Fleet Inventory & Vehicle Catalog'}
                {activeTab === 'locations' && 'Pickup & Return Hub Locations'}
                {activeTab === 'customers' && 'Customer Profiles & Trip History'}
                {activeTab === 'payments' && 'Payment & Transaction Management'}
                {activeTab === 'pricing' && 'Dynamic Pricing, Policies & Coupons'}
                {activeTab === 'cms' && 'Page Content & CMS Editor'}
                {activeTab === 'reviews' && 'Customer Testimonials & Reviews'}
                {activeTab === 'backup' && 'User Logs & Data Backup'}
                {activeTab === 'reports' && 'Reports, Analytics & Data Export'}
                {activeTab === 'notifications' && 'System Alerts & Driver Broadcasts'}
                {activeTab === 'settings' && 'Hub Configuration & Platform Policies'}
                {activeTab === 'security' && 'Admin Security, Roles & Audit Trail'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">Database Sync: Live</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            </div>
          </div>

          {/* ================= TAB 1: DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="py-6 space-y-6">
              
              {/* Top 6 KPI Metric Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                
                {/* Total Bookings */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004ac6] flex items-center justify-center">
                      <CalendarCheck size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">{stats?.totalBookings ?? bookings.length}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      <span className="text-emerald-600 font-bold">{stats?.completedBookings ?? 0}</span> Completed Trips
                    </div>
                  </div>
                </div>

                {/* Total Gross Revenue */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-600">
                      ₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {stats?.paidPaymentsCount ?? 0} Paid Invoices
                    </div>
                  </div>
                </div>

                {/* Pending Payments */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Pending Pay</span>
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                      <CreditCard size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-orange-600">
                      ₹{(stats?.pendingPaymentAmount ?? 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {stats?.pendingPaymentsCount ?? 0} Unpaid / Cash holds
                    </div>
                  </div>
                </div>

                {/* Confirmed / Active Trips */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Confirmed</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-indigo-600">
                      {(stats?.confirmedBookings ?? 0) + (stats?.activeBookings ?? 0)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Active on road or scheduled
                    </div>
                  </div>
                </div>

                {/* Cancellations */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Cancellations</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <XCircle size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-rose-600">
                      {stats?.cancelledBookings ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Refunds logged in audit
                    </div>
                  </div>
                </div>

                {/* Active Fleet / Available Cars */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Available Fleet</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004ac6] flex items-center justify-center">
                      <CarIcon size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {stats?.availableCars ?? cars.filter(c => c.isAvailable).length}
                      <span className="text-sm font-semibold text-slate-400">/{cars.length}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {stats?.maintenanceCars ?? cars.filter(c => !c.isAvailable).length} in Service
                    </div>
                  </div>
                </div>

              </div>

              {/* Revenue & Bookings 14-Day Visual Chart + Fleet Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 14-Day Revenue & Booking Volume Chart */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">Revenue &amp; Booking Volume Trend</h3>
                      <p className="text-xs text-slate-500">Live 14-day aggregated billing and trip volume</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-3 h-3 rounded bg-[#004ac6]"></span> Revenue ($)
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-3 h-3 rounded bg-amber-400"></span> Trips
                      </span>
                    </div>
                  </div>

                  {/* Chart Bars Visual Rendering */}
                  <div className="pt-4 pb-2">
                    {stats?.dailyRevenueTrend && stats.dailyRevenueTrend.length > 0 ? (
                      <div className="flex items-end justify-between gap-2 h-48 border-b border-slate-200 pb-2 overflow-x-auto">
                        {stats.dailyRevenueTrend.map((d: any, idx: number) => {
                          const maxRev = Math.max(...stats.dailyRevenueTrend.map((t: any) => t.revenue || 100), 500);
                          const heightPct = Math.max(12, Math.round(((d.revenue || 0) / maxRev) * 100));
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 min-w-[28px] group relative">
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap shadow-md">
                                <strong>{d._id}</strong>: ${d.revenue} ({d.bookings} trips)
                              </div>

                              <div className="w-full flex items-end justify-center gap-1 h-36">
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className="w-3.5 bg-gradient-to-t from-[#004ac6] to-[#3b82f6] rounded-t-sm transition-all group-hover:brightness-110"
                                ></div>
                                <div
                                  style={{ height: `${Math.min(100, (d.bookings || 1) * 20)}%` }}
                                  className="w-2 bg-amber-400 rounded-t-sm"
                                ></div>
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {d._id.slice(5)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
                        <BarChart3 size={32} className="mb-2 text-slate-300" />
                        <span>Aggregating daily trend from recent bookings...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fleet Category Distribution */}
                <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 mb-1">Fleet Category Performance</h3>
                    <p className="text-xs text-slate-500 mb-4">Rental distribution by vehicle segment</p>

                    <div className="space-y-3">
                      {[
                        { cat: 'Sedan', count: 18, color: 'bg-blue-600', rev: '$4,280' },
                        { cat: 'SUV', count: 14, color: 'bg-emerald-600', rev: '$5,920' },
                        { cat: 'Luxury', count: 10, color: 'bg-amber-600', rev: '$7,840' },
                        { cat: 'Electric', count: 6, color: 'bg-purple-600', rev: '$3,190' },
                        { cat: 'Hatchback', count: 2, color: 'bg-indigo-600', rev: '$1,120' },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{item.cat} ({item.count} units)</span>
                            <span className="font-bold text-slate-900">{item.rev}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.count * 4}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="text-xs font-bold text-[#004ac6] hover:underline"
                    >
                      View Detailed Analytics Report →
                    </button>
                  </div>
                </div>

              </div>

              {/* Recent Bookings Quick Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Recent Customer Reservations</h3>
                    <p className="text-xs text-slate-500">Live stream of incoming booking orders</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-bold text-[#004ac6] hover:underline"
                  >
                    View All ({bookings.length}) Bookings →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Vehicle Model</th>
                        <th className="py-3 px-4">Pickup / Return</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {bookings.slice(0, 6).map(b => (
                        <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#004ac6]">
                            #{b.bookingId}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{b.customerDetails?.name || 'Customer'}</div>
                            <div className="text-[11px] text-slate-400">{b.customerDetails?.phone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{b.car?.name}</div>
                            <div className="text-[11px] text-slate-400 capitalize">{b.car?.category}</div>
                          </td>
                          <td className="py-3 px-4 text-[11px]">
                            <div>{new Date(b.pickupDateTime).toLocaleDateString()} {new Date(b.pickupDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-slate-400">Duration: {b.rentalDuration?.totalHours || 24} hrs</div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            ${b.pricing?.totalAmount?.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              b.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              b.status === 'active' ? 'bg-blue-50 text-[#004ac6] border border-blue-200' :
                              b.status === 'completed' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              {b.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveBooking(b._id, b.bookingId)}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedBooking(b)}
                                className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-[11px]"
                              >
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 2: BOOKING MANAGEMENT ================= */}
          {activeTab === 'bookings' && (
            <div className="py-6 space-y-4">
              
              {/* Filter & Search Toolbar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                    placeholder="Search by ID, Customer, Car, Phone..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#004ac6] focus:bg-white"
                  />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBookingStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                        bookingStatusFilter === st
                          ? 'bg-[#004ac6] text-white shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Export Bookings */}
                <button
                  type="button"
                  onClick={() => {
                    const exportData = filteredBookings.map(b => ({
                      BookingID: b.bookingId,
                      CustomerName: b.customerDetails?.name,
                      CustomerEmail: b.customerDetails?.email,
                      CustomerPhone: b.customerDetails?.phone,
                      Car: b.car?.name,
                      PickupTime: b.pickupDateTime,
                      ReturnTime: b.returnDateTime,
                      TotalHours: b.rentalDuration?.totalHours,
                      TotalAmount: b.pricing?.totalAmount,
                      Status: b.status,
                      PaymentMethod: b.payment?.method,
                      PaymentStatus: b.payment?.status,
                      SecretCode: b.secretCode,
                    }));
                    exportToCsv('veloce_bookings', exportData);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Bookings Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Car Model</th>
                        <th className="py-3 px-4">Rental Duration</th>
                        <th className="py-3 px-4">6-Digit PIN</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            <CalendarCheck size={32} className="mx-auto mb-2 text-slate-300" />
                            No matching bookings found
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map(b => (
                          <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#004ac6]">
                              #{b.bookingId}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{b.customerDetails?.name || 'Customer'}</div>
                              <div className="text-[11px] text-slate-400">{b.customerDetails?.email}</div>
                              <div className="text-[11px] text-slate-400">{b.customerDetails?.phone}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{b.car?.name}</div>
                              <div className="text-[11px] text-slate-400">{b.car?.hubLocation || 'Main Hub'}</div>
                            </td>
                            <td className="py-3 px-4 text-[11px]">
                              <div>{new Date(b.pickupDateTime).toLocaleDateString()} {new Date(b.pickupDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              <div className="text-slate-400">To {new Date(b.returnDateTime).toLocaleDateString()}</div>
                              <div className="font-semibold text-blue-600">{b.rentalDuration?.totalHours || 24} hrs</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                                {b.secretCode || '••••••'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">${b.pricing?.totalAmount?.toFixed(2)}</div>
                              <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                b.payment?.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                              }`}>
                                {b.payment?.method === 'cash' ? 'Cash on Hub' : b.payment?.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                b.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                b.status === 'active' ? 'bg-blue-50 text-[#004ac6] border border-blue-200' :
                                b.status === 'completed' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                {b.status === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveBooking(b._id, b.bookingId)}
                                      className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                                      title="Approve Booking"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectBooking(b._id, b.bookingId)}
                                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px]"
                                      title="Reject Booking"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStatusModalBooking(b);
                                    setNewStatusValue(b.status);
                                    setAdminNoteInput(b.adminNotes || '');
                                  }}
                                  className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-[11px]"
                                  title="Change Status"
                                >
                                  Status
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedBooking(b)}
                                  className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#004ac6] font-bold text-[11px]"
                                  title="View Full Details"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 3: FLEET MANAGEMENT ================= */}
          {activeTab === 'fleet' && (
            <div className="py-6 space-y-4">
              
              {/* Toolbar & Add Vehicle Button */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={carSearch}
                    onChange={e => setCarSearch(e.target.value)}
                    placeholder="Search by model, brand, license plate..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#004ac6] focus:bg-white"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={carCategoryFilter}
                  onChange={e => setCarCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="sedan">Sedans</option>
                  <option value="suv">SUVs</option>
                  <option value="luxury">Luxury</option>
                  <option value="electric">Electric</option>
                  <option value="hatchback">Hatchbacks</option>
                </select>

                {/* Status Filter */}
                <select
                  value={carStatusFilter}
                  onChange={e => setCarStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available in Catalog</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const exportData = filteredCars.map(c => ({
                        Name: c.name,
                        Brand: c.brand,
                        Model: c.model,
                        Category: c.category,
                        StockQuantity: c.totalQuantity || 1,
                        HourlyRate: c.pricing?.hourlyRate,
                        DailyRate: c.pricing?.dailyRate,
                        Deposit: c.pricing?.securityDeposit,
                        HubLocation: c.hubLocation,
                        PlateNumber: c.plateNumber,
                        IsAvailable: c.isAvailable ? 'Yes' : 'No',
                      }));
                      exportToCsv('veloce_fleet', exportData);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={openAddCarModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                  >
                    <Plus size={16} />
                    <span>Add Vehicle Model</span>
                  </button>
                </div>
              </div>

              {/* Fleet Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCars.map(car => (
                  <div key={car._id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between group">
                    <div>
                      {/* Image Preview & Badges */}
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        <img
                          src={car.images?.[0] || car.thumbnail}
                          alt={car.name}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {car.category}
                          </span>
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            Stock: {car.totalQuantity || 1} units
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <button
                            type="button"
                            onClick={() => handleToggleCarAvailability(car)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs transition-colors ${
                              car.isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            {car.isAvailable ? '● Operational' : '■ In Service'}
                          </button>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900">{car.name}</h3>
                            <div className="text-xs text-slate-500">{car.brand} • {car.year} • {car.transmission}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-[#004ac6]">₹{car.pricing?.hourlyRate?.toLocaleString('en-IN')}/hr</div>
                            <div className="text-[11px] text-slate-400">₹{car.pricing?.dailyRate?.toLocaleString('en-IN')}/day</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400 block">Hub Location</span>
                            <span className="font-semibold text-slate-800 truncate block">{car.hubLocation || 'Main Hub'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Plate Registration</span>
                            <span className="font-mono font-bold text-slate-800">{car.plateNumber || 'CAL-9042'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleCarAvailability(car)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        {car.isAvailable ? 'Mark for Inspection' : 'Mark Ready'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditCarModal(car)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-white hover:text-[#004ac6] transition-colors"
                          title="Edit Vehicle"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCar(car._id, car.name)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete Vehicle"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ================= TAB: HUB LOCATIONS CRUD ================= */}
          {activeTab === 'locations' && (
            <div className="py-6 space-y-6">

              {/* Action Toolbar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={locationSearch}
                      onChange={e => setLocationSearch(e.target.value)}
                      placeholder="Search locations by name, code, city, address..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#004ac6] focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {(['all', 'active', 'inactive'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setLocationStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                          locationStatusFilter === st
                            ? 'bg-white text-[#004ac6] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st === 'all' ? `All (${locations.length})` : st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddLocation}
                    className="px-4 py-2 rounded-xl bg-[#004ac6] hover:bg-[#003da6] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Add New Pickup Hub</span>
                  </button>
                </div>
              </div>

              {/* Metric Cards for Hubs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Hubs</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004ac6] flex items-center justify-center">
                      <MapPin size={16} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{locations.length}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Distributed across regions
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Pickup Hubs</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {locations.filter(l => l.isActive).length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Live &amp; open for reservations
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Cities Covered</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Shield size={16} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-indigo-600">
                    {new Set(locations.map(l => l.city).filter(Boolean)).size || 1}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Metropolitan service zones
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Handover Protocol</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Key size={16} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900">6-Digit Secret PIN</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Zero paperwork counter queues
                  </div>
                </div>
              </div>

              {/* Locations Grid */}
              {filteredLocations.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                  <MapPin size={40} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="font-bold text-slate-800 text-base">No Pickup Hubs Found</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {locationSearch ? 'No locations match your search query.' : 'Add your first pickup and return hub to start taking bookings.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddLocation}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#004ac6] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Create Hub Location</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredLocations.map(loc => (
                    <div
                      key={loc._id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                    >
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#004ac6] border border-blue-200">
                                {loc.code}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                loc.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${loc.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                {loc.isActive ? 'Active Hub' : 'Temporarily Closed'}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-base mt-1.5 leading-snug">
                              {loc.name}
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                            <span className="text-slate-700 font-medium">{loc.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400 shrink-0" />
                            <span>{loc.operatingHours || '24/7 Concierge Handover'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400 shrink-0" />
                            <span>{loc.phone || '+1 (415) 555-0100'}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                            <span className="text-slate-500">Concierge PIN:</span>
                            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {loc.hubPin || '772910'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleToggleLocationActive(loc)}
                          className={`text-xs font-bold transition-colors cursor-pointer ${
                            loc.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                        >
                          {loc.isActive ? 'Deactivate Hub' : 'Activate Hub'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditLocation(loc)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-white hover:text-[#004ac6] transition-colors cursor-pointer"
                            title="Edit Location"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLocation(loc._id, loc.name)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Location"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ================= TAB 4: CUSTOMER MANAGEMENT ================= */}
          {activeTab === 'customers' && (
            <div className="py-6 space-y-4">
              
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search customers by name, email, phone..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#004ac6] focus:bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const exportData = filteredCustomers.map(c => ({
                      Name: c.name,
                      Email: c.email,
                      Phone: c.phone,
                      TotalTrips: c.totalBookings || 0,
                      TotalSpent: c.totalSpent || 0,
                      License: c.drivingLicence?.number || 'Verified',
                      Status: c.isActive ? 'Active' : 'Suspended',
                      MemberSince: c.createdAt,
                    }));
                    exportToCsv('veloce_customers', exportData);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Export Customers CSV</span>
                </button>
              </div>

              {/* Customers Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                        <th className="py-3 px-4">Customer Profile</th>
                        <th className="py-3 px-4">Contact Information</th>
                        <th className="py-3 px-4">Driving License</th>
                        <th className="py-3 px-4">Booking Activity</th>
                        <th className="py-3 px-4">Total Spent</th>
                        <th className="py-3 px-4">Account Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredCustomers.map(customer => (
                        <tr key={customer._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#004ac6] to-blue-500 text-white font-bold text-xs flex items-center justify-center">
                                {customer.name?.slice(0, 2).toUpperCase() || 'CU'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{customer.name}</div>
                                <div className="text-[11px] text-slate-400">Registered {new Date(customer.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{customer.email}</div>
                            <div className="text-[11px] text-slate-500">{customer.phone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-xs">{customer.drivingLicence?.number || 'CA DL-9482-B'}</div>
                            <span className="text-[10px] text-emerald-600 font-bold">Verified Biometric</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">{customer.totalBookings || 0}</span> trips
                          </td>
                          <td className="py-3 px-4 font-black text-emerald-600">
                            ${(customer.totalSpent || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              customer.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {customer.isActive !== false ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleViewCustomerBookings(customer)}
                                className="px-2.5 py-1 rounded bg-blue-50 text-[#004ac6] font-bold text-[11px] hover:bg-blue-100"
                              >
                                Trips History
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCustomerStatus(customer)}
                                className={`px-2 py-1 rounded font-bold text-[11px] ${
                                  customer.isActive !== false
                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                }`}
                              >
                                {customer.isActive !== false ? 'Suspend' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 5: PAYMENT MANAGEMENT ================= */}
          {activeTab === 'payments' && (
            <div className="py-6 space-y-4">
              
              {/* Payment Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Settled &amp; Paid</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    ${(paymentSummary?.totalPaid ?? stats?.totalRevenue ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Direct Online &amp; Hub Settlements</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Collection</div>
                  <div className="text-2xl font-black text-orange-600 mt-1">
                    ${(paymentSummary?.totalPending ?? stats?.pendingPaymentAmount ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Pay-at-Hub cash reservations</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Refunds Processed</div>
                  <div className="text-2xl font-black text-rose-600 mt-1">
                    ${(paymentSummary?.totalRefunded ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Policy-compliant returns</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Export Statement</div>
                  <button
                    type="button"
                    onClick={() => {
                      const exportData = filteredPayments.map(p => ({
                        TransactionID: p.payment?.razorpayPaymentId || `TXN-${p._id.slice(0, 8)}`,
                        BookingID: p.bookingId,
                        Customer: p.customerDetails?.name,
                        Car: p.car?.name,
                        Amount: p.pricing?.totalAmount,
                        Method: p.payment?.method,
                        Status: p.payment?.status,
                        Date: p.createdAt,
                      }));
                      exportToCsv('veloce_payments', exportData);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Download size={14} />
                    <span>Download Ledger CSV</span>
                  </button>
                </div>
              </div>

              {/* Payments Filter Toolbar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {['all', 'paid', 'pending', 'cash', 'refunded'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPaymentStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${
                        paymentStatusFilter === st
                          ? 'bg-[#004ac6] text-white shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'cash' ? 'Cash on Hub' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                        <th className="py-3 px-4">Txn / Payment ID</th>
                        <th className="py-3 px-4">Booking Ref</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Vehicle Model</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Receipt &amp; Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredPayments.map(p => (
                        <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {p.payment?.razorpayPaymentId || `VEL-${p._id.slice(0, 8).toUpperCase()}`}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#004ac6]">
                            #{p.bookingId}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {p.customerDetails?.name || 'Customer'}
                          </td>
                          <td className="py-3 px-4">
                            {p.car?.name}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 uppercase text-[11px]">
                              {p.payment?.method === 'cash' ? '💵 Cash on Hub' : '💳 Online Card / Wallet'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900">
                            ${p.pricing?.totalAmount?.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              p.payment?.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              p.payment?.status === 'refunded' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {p.payment?.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {p.payment?.method === 'cash' && p.payment?.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmCashPayment(p._id, p.bookingId)}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                                >
                                  Collect Cash
                                </button>
                              )}
                              {p.status === 'cancelled' && p.payment?.status === 'paid' && (
                                <button
                                  type="button"
                                  onClick={() => handleRefundPayment(p._id, p.bookingId, p.pricing?.totalAmount)}
                                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
                                >
                                  Issue Refund
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setViewingReceipt(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-[11px]"
                              >
                                <Receipt size={12} />
                                <span>Receipt</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 6: PRICING & OFFERS ================= */}
          {activeTab === 'pricing' && (
            <div className="py-6 space-y-6">
              
              {/* Promo Coupons Management */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Active Promotional Discounts &amp; Coupons</h3>
                    <p className="text-xs text-slate-500">Configure customer promo codes and checkout discounts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCouponForm({
                        code: '',
                        discountPercent: 15,
                        minHours: 4,
                        maxDiscount: 100,
                        isActive: true,
                        description: '',
                      });
                      setIsCouponModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004ac6] text-white font-bold text-xs shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Create Promo Code</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {coupons.map((coupon, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        coupon.isActive ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-mono font-black text-sm text-[#004ac6] px-2 py-0.5 rounded bg-white border border-blue-200">
                          {coupon.code}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${coupon.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {coupon.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                      <div className="my-2">
                        <div className="text-xl font-black text-slate-900">{coupon.discountPercent}% OFF</div>
                        <div className="text-[11px] text-slate-500">Min. {coupon.minHours} hrs rental • Cap ${coupon.maxDiscount}</div>
                        <div className="text-xs text-slate-600 mt-1">{coupon.description}</div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(coupon.code)}
                          className="text-[#004ac6] hover:underline"
                        >
                          {coupon.isActive ? 'Deactivate' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(coupon.code)}
                          className="text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global Pricing Rules & Seasonal Surge Multiplier */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <h3 className="font-extrabold text-base text-slate-900 mb-1">Global Tariff Multipliers &amp; Surge Rules</h3>
                <p className="text-xs text-slate-500 mb-4">Set baseline rental ratios and holiday peak pricing</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Security Hold Standard</label>
                    <div className="text-xl font-black text-slate-900">$200.00</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Authorization hold, released after vehicle return</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Extra Hour Penalty Rate</label>
                    <div className="text-xl font-black text-slate-900">1.15x</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Applied when customer returns past scheduled booking time</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Hub Concession Tax</label>
                    <div className="text-xl font-black text-slate-900">6.6%</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">City facility &amp; road concession assessment</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 7: REPORTS & ANALYTICS ================= */}
          {activeTab === 'reports' && (
            <div className="py-6 space-y-6">
              
              {/* Analytics Header with Data Exports */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Executive Fleet Analytics</h3>
                  <p className="text-xs text-slate-500">Comprehensive booking velocity, revenue metrics, and fleet utilization</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const exportData = bookings.map(b => ({
                        ID: b.bookingId,
                        Customer: b.customerDetails?.name,
                        Car: b.car?.name,
                        DurationHours: b.rentalDuration?.totalHours,
                        Revenue: b.pricing?.totalAmount,
                        Status: b.status,
                        Date: b.createdAt
                      }));
                      exportToCsv('veloce_full_analytics_report', exportData);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                  >
                    <Download size={14} />
                    <span>Download Comprehensive Report (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Top Performing Vehicles Ranking */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <h3 className="font-extrabold text-base text-slate-900 mb-1">Top Performing Vehicles by Rental Frequency</h3>
                <p className="text-xs text-slate-500 mb-4">Ranked by customer demand and revenue yield</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-4">Rank</th>
                        <th className="py-2.5 px-4">Car Model</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Total Trips</th>
                        <th className="py-2.5 px-4">Revenue Yield</th>
                        <th className="py-2.5 px-4">Hourly / Daily Rates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(stats?.popularCars || cars.slice(0, 5)).map((c: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-black text-[#004ac6]">#{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                          <td className="py-3 px-4 uppercase text-slate-500">{c.category}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{c.bookingCount || 12} trips</td>
                          <td className="py-3 px-4 font-black text-emerald-600">${c.totalRevenue || (c.bookingCount ? c.bookingCount * 380 : 4200)}</td>
                          <td className="py-3 px-4 text-slate-600">${c.pricing?.hourlyRate}/hr • ${c.pricing?.dailyRate}/day</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 8: NOTIFICATIONS & ALERTS ================= */}
          {activeTab === 'notifications' && (
            <div className="py-6 space-y-6">
              
              {/* Broadcast Announcement Bar */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <h3 className="font-extrabold text-base text-slate-900 mb-1">Dispatch Fleet &amp; Hub Driver Broadcast</h3>
                <p className="text-xs text-slate-500 mb-3">Send urgent instructions to drivers stationed at company hubs</p>

                <form onSubmit={handleSendBroadcast} className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    value={broadcastMessage}
                    onChange={e => setBroadcastMessage(e.target.value)}
                    placeholder="e.g. Bay 14 maintenance complete. Clean all incoming Porsche Taycans before 2 PM."
                    className="flex-1 min-w-[260px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#004ac6]"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    <Send size={14} />
                    <span>Send Announcement</span>
                  </button>
                </form>
              </div>

              {/* Active System Alerts */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <h3 className="font-extrabold text-base text-slate-900 mb-1">Real-Time Operational Alerts</h3>
                <p className="text-xs text-slate-500 mb-4">Generated directly from live customer reservations and vehicle status</p>

                <div className="space-y-3">
                  {systemNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                      All operations nominal. No outstanding alerts.
                    </div>
                  ) : (
                    systemNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                          notif.type === 'alert' ? 'bg-rose-50/60 border-rose-200' :
                          notif.type === 'warning' ? 'bg-amber-50/60 border-amber-200' :
                          'bg-blue-50/60 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            notif.type === 'alert' ? 'bg-rose-100 text-rose-700' :
                            notif.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            <AlertCircle size={18} />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">{notif.title}</h4>
                            <p className="text-[11px] text-slate-600 mt-0.5">{notif.desc}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold text-slate-400">{notif.time}</span>
                          {notif.linkTab && (
                            <button
                              type="button"
                              onClick={() => setActiveTab(notif.linkTab!)}
                              className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-bold text-[#004ac6] hover:bg-slate-50 shadow-2xs"
                            >
                              Resolve →
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 9: SETTINGS & POLICIES ================= */}
          {activeTab === 'settings' && (
            <div className="py-6 space-y-6">
              
              {/* HOMEPAGE HERO BACKGROUND MANAGER */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004ac6] flex items-center justify-center">
                      <ImageIcon size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">Homepage Hero Visual Background</h3>
                      <p className="text-xs text-slate-500">Live customization of the main background visual on the customer portal</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetHeroBg}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw size={13} />
                    <span>Reset to Default</span>
                  </button>
                </div>

                {/* Current Active Preview */}
                <div className="mt-4 mb-5">
                  <label className="text-xs font-bold text-slate-700 block mb-2">Live Background Active Now</label>
                  <div
                    style={{ backgroundImage: `url('${adminHeroBg}')` }}
                    className="h-36 rounded-xl bg-cover bg-center border-2 border-[#004ac6]/40 relative overflow-hidden flex items-center px-6 shadow-sm"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-transparent"></div>
                    <div className="relative z-10 text-white max-w-md">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Preview</span>
                      <h4 className="font-black text-lg leading-tight">Your Journey. Your Exact Time. Complete Freedom.</h4>
                      <div className="text-[11px] text-white/70 truncate mt-1">{adminHeroBg}</div>
                    </div>
                  </div>
                </div>

                {/* Luxury Presets Grid */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-2.5">
                    <Sparkles size={14} className="text-[#004ac6]" />
                    <span>Select Curated High-Resolution Preset</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {HERO_BG_PRESETS.map((p, idx) => {
                      const isActive = adminHeroBg === p.url;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleApplyHeroBg(p.url)}
                          className={`rounded-xl border p-2 flex items-center gap-3 cursor-pointer transition-all ${
                            isActive ? 'border-[#004ac6] bg-blue-50/50 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div
                            style={{ backgroundImage: `url('${p.url}')` }}
                            className="w-16 h-12 rounded-lg bg-cover bg-center shrink-0 border border-slate-200"
                          ></div>
                          <div className="overflow-hidden flex-1">
                            <div className="font-bold text-xs text-slate-900 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{p.desc}</div>
                          </div>
                          {isActive && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#004ac6] text-white">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom URL Input */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
                  <input
                    type="url"
                    value={customHeroBgInput}
                    onChange={e => setCustomHeroBgInput(e.target.value)}
                    placeholder="Or paste any custom high-resolution image URL (Unsplash, Wikimedia...)"
                    className="flex-1 min-w-[260px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#004ac6]"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyHeroBg(customHeroBgInput)}
                    className="px-4 py-2 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    Apply Custom Image
                  </button>
                </div>
              </div>

              {/* Company & Rental Policies Configuration */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <h3 className="font-extrabold text-base text-slate-900 mb-1">Company Information &amp; Hub Handover Policies</h3>
                <p className="text-xs text-slate-500 mb-4">Official platform contact numbers, pickup bay address, and fuel policy</p>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Company Name</label>
                      <input
                        type="text"
                        value={companySettings.companyName}
                        onChange={e => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Support Email</label>
                      <input
                        type="email"
                        value={companySettings.companyEmail}
                        onChange={e => setCompanySettings({ ...companySettings, companyEmail: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Dispatch Phone</label>
                      <input
                        type="text"
                        value={companySettings.companyPhone}
                        onChange={e => setCompanySettings({ ...companySettings, companyPhone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Primary Hub Address</label>
                    <input
                      type="text"
                      value={companySettings.companyAddress}
                      onChange={e => setCompanySettings({ ...companySettings, companyAddress: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Cancellation &amp; Refund Policy Summary</label>
                    <textarea
                      rows={2}
                      value={companySettings.cancellationPolicy}
                      onChange={e => setCompanySettings({ ...companySettings, cancellationPolicy: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Mandatory Fuel Policy Notice</label>
                    <textarea
                      rows={2}
                      value={companySettings.fuelPolicy}
                      onChange={e => setCompanySettings({ ...companySettings, fuelPolicy: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                  >
                    Save Hub Configuration
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* ================= TAB 10: ADMIN SECURITY & AUDIT LOGS ================= */}
          {activeTab === 'security' && (
            <div className="py-6 space-y-6">
              
              {/* Session & Credentials Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">Current Administrative Session</h3>
                      <p className="text-xs text-slate-500">Super Administrator Privileges &amp; Two-Factor Clearance</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    Role: super_admin
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Admin Email</span>
                    <span className="font-bold text-slate-900">{user?.email || 'admin@veloce.io'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Session Authentication</span>
                    <span className="font-bold text-emerald-700">JWT Token Active</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Local Terminal IP</span>
                    <span className="font-mono font-bold text-slate-900">127.0.0.1 (Localhost)</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Database Audit Logs */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">System Audit Trail</h3>
                    <p className="text-xs text-slate-500">Immutable ledger of administrative mutations and customer status changes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const exportData = auditLogs.map(l => ({
                        Action: l.action,
                        Category: l.category,
                        Details: l.details,
                        PerformedBy: l.performedBy?.email || 'admin@veloce.io',
                        Date: l.createdAt,
                      }));
                      exportToCsv('veloce_audit_logs', exportData);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Export Audit CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-4">Action</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Details</th>
                        <th className="py-2.5 px-4">Admin User</th>
                        <th className="py-2.5 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No recorded audit logs yet.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.action}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded uppercase text-[10px] font-bold bg-slate-100 text-slate-700">
                                {log.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-800">{log.details}</td>
                            <td className="py-3 px-4 text-slate-500">{log.performedBy?.email || 'admin@veloce.io'}</td>
                            <td className="py-3 px-4 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 11: PAGE CONTENT & CMS EDITOR ================= */}
          {activeTab === 'cms' && (
            <div className="py-6 space-y-6">
              
              {/* Header Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Public Website Content &amp; CMS</h3>
                    <p className="text-xs text-slate-500">Edit hero headlines, visual background imagery, hub handover policies, and support details in real-time</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye size={13} />
                    <span>View Public Portal</span>
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Live Preview of Hero Banner */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles size={14} className="text-[#004ac6]" />
                    <span>Live Hero Banner Simulation (Public Homepage)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active on Production
                  </span>
                </div>

                <div
                  style={{ backgroundImage: `url('${cmsContent.hero.bgImage || adminHeroBg}')` }}
                  className="h-48 md:h-56 rounded-2xl bg-cover bg-center border-2 border-indigo-200 relative overflow-hidden flex flex-col justify-center px-8 shadow-inner"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30"></div>
                  <div className="relative z-10 text-white max-w-xl">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold block mb-1">
                      PORTAL HEADLINE PREVIEW
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                      <span>{cmsContent.hero.headlineMain || 'Your Drive. Your Time.'} </span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                        {cmsContent.hero.headlineHighlight || 'Your Freedom.'}
                      </span>
                    </h2>
                    <p className="text-xs text-white/70 mt-2 line-clamp-2">
                      {cmsContent.policies?.fuelPolicy || 'Customer provides their own fuel. 6-digit secret code handover at verified hub.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CMS Editor Form */}
              <form onSubmit={handleSaveCms} className="space-y-6">
                
                {/* Section 1: Hero Section */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-[#004ac6]"></span>
                    Hero Section Headlines &amp; Background
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Main Headline</label>
                      <input
                        type="text"
                        value={cmsContent.hero.headlineMain}
                        onChange={e => setCmsContent({
                          ...cmsContent,
                          hero: { ...cmsContent.hero, headlineMain: e.target.value }
                        })}
                        placeholder="e.g. Your Drive. Your Time."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#004ac6]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Highlighted Slogan Text</label>
                      <input
                        type="text"
                        value={cmsContent.hero.headlineHighlight}
                        onChange={e => setCmsContent({
                          ...cmsContent,
                          hero: { ...cmsContent.hero, headlineHighlight: e.target.value }
                        })}
                        placeholder="e.g. Your Freedom."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#004ac6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Hero Background Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={cmsContent.hero.bgImage}
                        onChange={e => setCmsContent({
                          ...cmsContent,
                          hero: { ...cmsContent.hero, bgImage: e.target.value }
                        })}
                        placeholder="Paste image URL..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-[#004ac6]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCmsContent({
                            ...cmsContent,
                            hero: { ...cmsContent.hero, bgImage: DEFAULT_HERO_BG }
                          });
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Default
                      </button>
                    </div>
                  </div>

                  {/* Preset Background Selectors */}
                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-2">Or Choose from Curated Automotive Presets:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {HERO_BG_PRESETS.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => setCmsContent({
                            ...cmsContent,
                            hero: { ...cmsContent.hero, bgImage: p.url }
                          })}
                          className={`rounded-xl border p-2 cursor-pointer transition-all ${
                            cmsContent.hero.bgImage === p.url ? 'border-[#004ac6] bg-blue-50/60 ring-2 ring-[#004ac6]/20' : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div
                            style={{ backgroundImage: `url('${p.url}')` }}
                            className="h-14 rounded-lg bg-cover bg-center mb-1.5"
                          />
                          <div className="font-bold text-[11px] text-slate-800 truncate">{p.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 2: Policies & Hub Handover Guarantees */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Platform Handover &amp; Rental Policies
                  </h4>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Fuel Policy Notice</label>
                    <textarea
                      rows={2}
                      value={cmsContent.policies?.fuelPolicy || ''}
                      onChange={e => setCmsContent({
                        ...cmsContent,
                        policies: { ...cmsContent.policies, fuelPolicy: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#004ac6]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">6-Digit Secret Pin Handover Policy</label>
                    <textarea
                      rows={2}
                      value={cmsContent.policies?.secretPinPolicy || ''}
                      onChange={e => setCmsContent({
                        ...cmsContent,
                        policies: { ...cmsContent.policies, secretPinPolicy: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#004ac6]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Refundable Security Deposit Policy</label>
                    <textarea
                      rows={2}
                      value={cmsContent.policies?.depositPolicy || ''}
                      onChange={e => setCmsContent({
                        ...cmsContent,
                        policies: { ...cmsContent.policies, depositPolicy: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#004ac6]"
                    />
                  </div>
                </div>

                {/* Section 3: Contact & Support Hotline */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Support &amp; Hub Dispatch Center
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Hotline Phone</label>
                      <input
                        type="text"
                        value={cmsContent.support?.hotline || ''}
                        onChange={e => setCmsContent({
                          ...cmsContent,
                          support: { ...cmsContent.support, hotline: e.target.value }
                        })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#004ac6]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Support Email</label>
                      <input
                        type="email"
                        value={cmsContent.support?.email || ''}
                        onChange={e => setCmsContent({
                          ...cmsContent,
                          support: { ...cmsContent.support, email: e.target.value }
                        })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#004ac6]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Dispatch Operations Hours</label>
                      <input
                        type="text"
                        value={cmsContent.support?.hours || ''}
                        onChange={e => setCmsContent({
                          ...cmsContent,
                          support: { ...cmsContent.support, hours: e.target.value }
                        })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#004ac6]"
                      />
                    </div>
                  </div>
                </div>

                {/* Publish Changes Button */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingCms}
                    className="px-6 py-3 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all inline-flex items-center gap-2"
                  >
                    {savingCms ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Publishing to Public Website...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Publish Changes to Live Website</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* ================= TAB 12: CUSTOMER REVIEWS CONTROL ================= */}
          {activeTab === 'reviews' && (
            <div className="py-6 space-y-6">
              
              {/* Header with Stats */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Star size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Customer Testimonials &amp; Reviews</h3>
                    <p className="text-xs text-slate-500">Curate verified driver experiences shown on the public marquee and website</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingReviewId(null);
                    setReviewForm({
                      author: '',
                      role: 'Verified Driver • 5 Trips Logged',
                      vehicle: cars[0]?.name || 'Porsche 911 Carrera',
                      rating: 5,
                      quote: '',
                      isApproved: true,
                    });
                    setIsReviewModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={14} />
                  <span>Add New Review</span>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Testimonials</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{reviewsList.length}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Approved &amp; Live</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">
                    {reviewsList.filter(r => r.isApproved !== false).length}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hidden / Draft</span>
                  <span className="text-2xl font-black text-slate-600 font-mono">
                    {reviewsList.filter(r => r.isApproved === false).length}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block mb-1">Avg Score</span>
                  <span className="text-2xl font-black text-amber-500 font-mono">5.0 ★</span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={e => setReviewSearch(e.target.value)}
                    placeholder="Search by author, vehicle or review keywords..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#004ac6]"
                  />
                  {reviewSearch && (
                    <button onClick={() => setReviewSearch('')} className="text-slate-400 hover:text-slate-700">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      reviewFilter === 'all' ? 'bg-[#004ac6] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({reviewsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      reviewFilter === 'approved' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Live on Portal ({reviewsList.filter(r => r.isApproved !== false).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter('hidden')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      reviewFilter === 'hidden' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Hidden ({reviewsList.filter(r => r.isApproved === false).length})
                  </button>
                </div>
              </div>

              {/* Reviews Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReviews.length === 0 ? (
                  <div className="col-span-2 bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400">
                    No testimonials match your query.
                  </div>
                ) : (
                  filteredReviews.map(review => (
                    <div
                      key={review.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
                    >
                      <div>
                        {/* Top Author Row */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#004ac6] to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {review.initials || review.author?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{review.author}</h4>
                              <p className="text-[11px] text-slate-500">{review.role || 'Verified Driver'}</p>
                            </div>
                          </div>

                          {/* Approval Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            review.isApproved !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {review.isApproved !== false ? 'Live on Home' : 'Hidden'}
                          </span>
                        </div>

                        {/* Vehicle & Stars */}
                        <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-slate-100">
                          <span className="font-semibold text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-100">
                            🚗 {review.vehicle || 'Fleet Car'}
                          </span>
                          <div className="flex items-center text-amber-400">
                            {Array.from({ length: review.rating || 5 }).map((_, i) => (
                              <Star key={i} size={13} fill="currentColor" />
                            ))}
                          </div>
                        </div>

                        {/* Quote Text */}
                        <p className="text-xs text-slate-600 italic leading-relaxed mb-4">
                          "{review.quote}"
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleReviewStatus(review)}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                            review.isApproved !== false
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {review.isApproved !== false ? 'Hide from Website' : 'Approve & Publish'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReviewId(review.id);
                              setReviewForm({
                                author: review.author,
                                role: review.role,
                                vehicle: review.vehicle,
                                rating: review.rating,
                                quote: review.quote,
                                isApproved: review.isApproved !== false,
                              });
                              setIsReviewModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#004ac6] hover:bg-blue-50"
                            title="Edit Review"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id, review.author)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Review"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* ================= TAB 13: USER LOGS & DATA BACKUP ================= */}
          {activeTab === 'backup' && (
            <div className="py-6 space-y-6">
              
              {/* Header with 1-Click Backup Export */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">User Audit Logs &amp; Database Backup</h3>
                    <p className="text-xs text-slate-500">Real-time system telemetry, comprehensive JSON database snapshots, and user activity trail</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={exportingBackup}
                  className="px-4 py-2.5 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {exportingBackup ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Packaging Snapshot...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Download Full Database Backup (JSON)</span>
                    </>
                  )}
                </button>
              </div>

              {/* System Telemetry & Entity Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">System Health</span>
                  <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    OPERATIONAL
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fleet Inventory</span>
                  <span className="text-xl font-black text-slate-900 font-mono">{backupStats?.carsCount ?? cars.length} Cars</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reservations</span>
                  <span className="text-xl font-black text-slate-900 font-mono">{backupStats?.bookingsCount ?? bookings.length} Trips</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">User Accounts</span>
                  <span className="text-xl font-black text-slate-900 font-mono">{backupStats?.usersCount ?? customers.length} Users</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Audit Ledger</span>
                  <span className="text-xl font-black text-slate-900 font-mono">{backupStats?.logsCount ?? auditLogs.length} Entries</span>
                </div>
              </div>

              {/* Backup Info Banner */}
              <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#004ac6] flex items-center justify-center shrink-0">
                    <Database size={16} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-blue-950">JSON Database Snapshot Package</h4>
                    <p className="text-[11px] text-blue-800">
                      The backup file includes full schemas and documents for Fleet, Reservations, User Accounts, Payments, Settings, and Audit Trail.
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-blue-700 font-mono">
                  Database: MongoDB Local (Live Connected)
                </div>
              </div>

              {/* Real-time User Activity & Audit Trail */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">User Activity &amp; Audit Logs</h3>
                    <p className="text-xs text-slate-500">Detailed event log of all admin operations, status changes, and platform events</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const exportData = filteredAuditLogs.map(l => ({
                          Action: l.action,
                          Category: l.category,
                          Details: l.details,
                          PerformedBy: l.performedBy?.email || 'admin@veloce.io',
                          Date: l.createdAt,
                        }));
                        exportToCsv('veloce_audit_logs', exportData);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
                    >
                      <Download size={13} />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search for Audit Logs */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search size={14} className="text-slate-400" />
                    <input
                      type="text"
                      value={auditLogSearch}
                      onChange={e => setAuditLogSearch(e.target.value)}
                      placeholder="Search logs by action, keyword, or user..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#004ac6]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {['all', 'booking', 'fleet', 'system', 'security', 'settings'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setAuditCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                          auditCategoryFilter === cat ? 'bg-[#004ac6] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audit Logs Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-4">Action</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Details</th>
                        <th className="py-2.5 px-4">Performed By</th>
                        <th className="py-2.5 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No matching audit logs found.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditLogs.map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[11px]">{log.action}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded uppercase text-[9px] font-bold bg-slate-100 text-slate-700">
                                {log.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-800">{log.details}</td>
                            <td className="py-3 px-4 text-slate-500">{log.performedBy?.email || 'admin@veloce.io'}</td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ================= MODAL 1: BOOKING DETAILS MODAL ================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-[#004ac6]">#{selectedBooking.bookingId}</span>
                <h3 className="font-extrabold text-lg text-slate-900">Reservation Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Secret 6-Digit Handover PIN Card */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                  6-Digit Secret Handover Code
                </span>
                <span className="font-mono text-2xl font-black text-[#004ac6] tracking-widest">
                  {selectedBooking.secretCode || '482916'}
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                selectedBooking.handoverStatus === 'code_verified_delivered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedBooking.handoverStatus === 'code_verified_delivered' ? '✓ Handover Completed' : 'Awaiting Driver Code Verification'}
              </span>
            </div>

            {/* Grid of Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-1">Customer</span>
                <div className="font-bold text-slate-900">{selectedBooking.customerDetails?.name}</div>
                <div className="text-slate-600">{selectedBooking.customerDetails?.email}</div>
                <div className="text-slate-600">{selectedBooking.customerDetails?.phone}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">License: {selectedBooking.customerDetails?.drivingLicenceNumber || 'CA-DL-948'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-1">Vehicle</span>
                <div className="font-bold text-slate-900">{selectedBooking.car?.name}</div>
                <div className="text-slate-600 capitalize">{selectedBooking.car?.category} • {selectedBooking.car?.brand}</div>
                <div className="text-slate-600">Hub: {selectedBooking.car?.hubLocation || 'Main Hub'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-1">Pickup Schedule</span>
                <div className="font-bold text-slate-900">{new Date(selectedBooking.pickupDateTime).toLocaleString()}</div>
                <div className="text-slate-600">Return: {new Date(selectedBooking.returnDateTime).toLocaleString()}</div>
                <div className="font-bold text-[#004ac6] mt-0.5">Duration: {selectedBooking.rentalDuration?.totalHours || 24} Hours</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-1">Payment Status</span>
                <div className="font-black text-base text-slate-900">${selectedBooking.pricing?.totalAmount?.toFixed(2)}</div>
                <div className="text-slate-600">Method: {selectedBooking.payment?.method}</div>
                <div className="font-semibold text-emerald-600">Status: {selectedBooking.payment?.status}</div>
              </div>
            </div>

            {/* Quick Actions in Modal */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setViewingReceipt(selectedBooking);
                  setSelectedBooking(null);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
              >
                <Receipt size={14} />
                <span>View Receipt</span>
              </button>
              {selectedBooking.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => handleApproveBooking(selectedBooking._id, selectedBooking.bookingId)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Approve Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: STATUS UPDATE MODAL ================= */}
      {statusModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Update Status for #{statusModalBooking.bookingId}
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Select New Status</label>
              <select
                value={newStatusValue}
                onChange={e => setNewStatusValue(e.target.value as BookingStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="pending">Pending Review</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active (On Road)</option>
                <option value="completed">Completed (Returned)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Administrative Notes</label>
              <textarea
                rows={3}
                value={adminNoteInput}
                onChange={e => setAdminNoteInput(e.target.value)}
                placeholder="e.g. Verified license and handover complete at Bay 14..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalBooking(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatusModal}
                className="px-4 py-2 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs"
              >
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ADD / EDIT CAR MODAL ================= */}
      {isCarModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingCarId ? `Edit ${carForm.name}` : 'Add New Vehicle Model to Fleet'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCarModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCarForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Name *</label>
                  <input
                    type="text"
                    required
                    value={carForm.name}
                    onChange={e => setCarForm({ ...carForm, name: e.target.value })}
                    placeholder="e.g. Porsche Taycan 4S"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={carForm.brand}
                    onChange={e => setCarForm({ ...carForm, brand: e.target.value })}
                    placeholder="Porsche"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    value={carForm.model}
                    onChange={e => setCarForm({ ...carForm, model: e.target.value })}
                    placeholder="Taycan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={carForm.category}
                    onChange={e => setCarForm({ ...carForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                  >
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="luxury">Luxury</option>
                    <option value="electric">Electric</option>
                    <option value="hatchback">Hatchback</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Units</label>
                  <input
                    type="number"
                    min={1}
                    value={carForm.totalQuantity}
                    onChange={e => setCarForm({ ...carForm, totalQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transmission</label>
                  <select
                    value={carForm.transmission}
                    onChange={e => setCarForm({ ...carForm, transmission: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fuel Type</label>
                  <select
                    value={carForm.fuelType}
                    onChange={e => setCarForm({ ...carForm, fuelType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="diesel">Diesel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hourly Rate ($)</label>
                  <input
                    type="number"
                    min={5}
                    value={carForm.hourlyRate}
                    onChange={e => setCarForm({ ...carForm, hourlyRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Rate ($)</label>
                  <input
                    type="number"
                    min={20}
                    value={carForm.dailyRate}
                    onChange={e => setCarForm({ ...carForm, dailyRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Security Deposit ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={carForm.securityDeposit}
                    onChange={e => setCarForm({ ...carForm, securityDeposit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hub Location</label>
                  <input
                    type="text"
                    value={carForm.hubLocation}
                    onChange={e => setCarForm({ ...carForm, hubLocation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">License Plate Number</label>
                  <input
                    type="text"
                    value={carForm.plateNumber}
                    onChange={e => setCarForm({ ...carForm, plateNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Image Input: URL or File Upload */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Vehicle Image (URL or Local Upload)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={carForm.imageUrl}
                    onChange={e => setCarForm({ ...carForm, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                  <input
                    type="file"
                    ref={carFileInputRef}
                    onChange={handleCarImageFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => carFileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 shrink-0"
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCarModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCar}
                  className="px-5 py-2 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold"
                >
                  {savingCar ? 'Saving...' : editingCarId ? 'Update Model' : 'Add Model to Fleet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: CUSTOMER TRIPS MODAL ================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{selectedCustomer.name}'s Trip History</h3>
                <p className="text-xs text-slate-500">{selectedCustomer.email} • {selectedCustomer.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {loadingCustomerBookings ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading trips history...</div>
            ) : customerBookings.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No booking records found for this driver.</div>
            ) : (
              <div className="space-y-2">
                {customerBookings.map(b => (
                  <div key={b._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">#{b.bookingId} • {b.car?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(b.pickupDateTime).toLocaleDateString()} to {new Date(b.returnDateTime).toLocaleDateString()} ({b.rentalDuration?.totalHours} hrs)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">${b.pricing?.totalAmount?.toFixed(2)}</div>
                      <span className="text-[10px] font-bold text-[#004ac6] uppercase">{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 5: PRINTABLE RECEIPT INVOICE MODAL ================= */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500">Official VELOCE Tax Invoice</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  <Printer size={13} />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-800"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">VELOCE</h2>
                  <p className="text-[11px] text-slate-500">Executive Self-Drive Car Rental Hub</p>
                  <p className="text-[10px] text-slate-400">Main Downtown Car Hub, 4th Street, San Francisco</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900">INVOICE #{viewingReceipt.bookingId}</div>
                  <div className="text-[10px] text-slate-400">Date: {new Date(viewingReceipt.createdAt).toLocaleDateString()}</div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">Paid &amp; Verified</div>
                </div>
              </div>

              {/* Customer & Vehicle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Billed To</span>
                  <div className="font-bold text-slate-900">{viewingReceipt.customerDetails?.name}</div>
                  <div className="text-slate-500">{viewingReceipt.customerDetails?.email}</div>
                  <div className="text-slate-500">{viewingReceipt.customerDetails?.phone}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Vehicle Rented</span>
                  <div className="font-bold text-slate-900">{viewingReceipt.car?.name}</div>
                  <div className="text-slate-500">{viewingReceipt.car?.hubLocation || 'Main Hub'}</div>
                  <div className="text-slate-500">Secret PIN: {viewingReceipt.secretCode}</div>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5">
                <div className="flex justify-between">
                  <span>Rental Time Base ({viewingReceipt.rentalDuration?.totalHours || 24} Hours)</span>
                  <span className="font-semibold">${viewingReceipt.pricing?.rentalCharges?.toFixed(2) || viewingReceipt.pricing?.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Hub Facility &amp; Concession Assessment (6.6%)</span>
                  <span>${viewingReceipt.pricing?.taxes?.toFixed(2) || '14.50'}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Refundable Security Hold (Auth)</span>
                  <span>${viewingReceipt.pricing?.securityDeposit || 200}.00</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-300 pt-2">
                  <span>Total Amount Paid</span>
                  <span className="text-emerald-600">${viewingReceipt.pricing?.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900">
                <strong>Fuel Policy Notice:</strong> Customer provides own fuel. Driver verifies 6-digit Secret PIN at hub handover.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 6: CREATE / EDIT COUPON MODAL ================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="font-extrabold text-base text-slate-900">Create Promotional Discount Coupon</h3>

            <form onSubmit={handleSaveCoupon} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER25"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={couponForm.discountPercent}
                    onChange={e => setCouponForm({ ...couponForm, discountPercent: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Rental Hours</label>
                  <input
                    type="number"
                    min={1}
                    value={couponForm.minHours}
                    onChange={e => setCouponForm({ ...couponForm, minHours: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Max Cap Discount ($)</label>
                <input
                  type="number"
                  min={1}
                  value={couponForm.maxDiscount}
                  onChange={e => setCouponForm({ ...couponForm, maxDiscount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={e => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="e.g. 15% discount for weekend touring"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT CUSTOMER REVIEW ================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingReviewId ? 'Edit Customer Testimonial' : 'Add New Customer Testimonial'}
              </h3>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReviewModal} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Author Name *</label>
                <input
                  type="text"
                  required
                  value={reviewForm.author}
                  onChange={e => setReviewForm({ ...reviewForm, author: e.target.value })}
                  placeholder="e.g. Jordan Hayes"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004ac6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role / Badge</label>
                  <input
                    type="text"
                    value={reviewForm.role}
                    onChange={e => setReviewForm({ ...reviewForm, role: e.target.value })}
                    placeholder="e.g. Verified Driver • 10 Trips"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#004ac6]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Rented</label>
                  <input
                    type="text"
                    value={reviewForm.vehicle}
                    onChange={e => setReviewForm({ ...reviewForm, vehicle: e.target.value })}
                    placeholder="e.g. BMW M3 Competition"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#004ac6]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rating Score</label>
                <select
                  value={reviewForm.rating}
                  onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#004ac6]"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Review Quote *</label>
                <textarea
                  rows={3}
                  required
                  value={reviewForm.quote}
                  onChange={e => setReviewForm({ ...reviewForm, quote: e.target.value })}
                  placeholder="Write the customer's testimonial or feedback..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#004ac6]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reviewApproval"
                  checked={reviewForm.isApproved}
                  onChange={e => setReviewForm({ ...reviewForm, isApproved: e.target.checked })}
                  className="rounded border-slate-300 text-[#004ac6] focus:ring-[#004ac6]"
                />
                <label htmlFor="reviewApproval" className="font-bold text-slate-700 cursor-pointer">
                  Approve immediately &amp; display on public homepage
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold"
                >
                  {editingReviewId ? 'Update Review' : 'Create Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT HUB LOCATION MODAL ================= */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004ac6] flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingLocationId ? 'Edit Pickup Hub Location' : 'Add New Pickup & Return Hub'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Hubs appear dynamically across public search &amp; checkout</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hub Name *</label>
                <input
                  type="text"
                  required
                  value={locationForm.name}
                  onChange={e => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="e.g. SFO International Airport Concierge Hub"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004ac6] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hub Code (Uppercase) *</label>
                  <input
                    type="text"
                    required
                    value={locationForm.code}
                    onChange={e => setLocationForm({ ...locationForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SFO-AIRPORT"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#004ac6] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={locationForm.city}
                    onChange={e => setLocationForm({ ...locationForm, city: e.target.value })}
                    placeholder="e.g. San Francisco"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#004ac6] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={locationForm.address}
                  onChange={e => setLocationForm({ ...locationForm, address: e.target.value })}
                  placeholder="e.g. Terminal 2 Level 4, San Francisco, CA 94128"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#004ac6] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={locationForm.operatingHours}
                    onChange={e => setLocationForm({ ...locationForm, operatingHours: e.target.value })}
                    placeholder="e.g. 24/7 Concierge Handover"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#004ac6] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hub Phone</label>
                  <input
                    type="text"
                    value={locationForm.phone}
                    onChange={e => setLocationForm({ ...locationForm, phone: e.target.value })}
                    placeholder="e.g. +1 (415) 555-0100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#004ac6] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hub Secret Verification PIN (6-Digit)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={locationForm.hubPin}
                  onChange={e => setLocationForm({ ...locationForm, hubPin: e.target.value })}
                  placeholder="e.g. 772910"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#004ac6] focus:outline-none focus:border-[#004ac6] focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="locIsActive"
                  checked={locationForm.isActive}
                  onChange={e => setLocationForm({ ...locationForm, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-[#004ac6] focus:ring-[#004ac6]"
                />
                <label htmlFor="locIsActive" className="font-bold text-slate-700 cursor-pointer">
                  Hub is Active for Public Customer Bookings
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="px-4 py-2 rounded-xl bg-[#004ac6] hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {savingLocation ? 'Saving Hub...' : editingLocationId ? 'Update Hub Location' : 'Create Hub Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
