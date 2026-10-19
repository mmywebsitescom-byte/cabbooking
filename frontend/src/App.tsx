import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Pages
import HomePage from './pages/HomePage';
import CarsPage from './pages/CarsPage';
import CarDetailPage from './pages/CarDetailPage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import DashboardPage from './pages/DashboardPage';
import PoliciesPage from './pages/PoliciesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import OffersPage from './pages/OffersPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cars" element={<CarsPage />} />
              <Route path="/cars/:id" element={<CarDetailPage />} />
              <Route path="/book/:carId" element={<BookingPage />} />
              <Route path="/booking-confirmation/:id" element={<BookingConfirmationPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/bookings" element={<DashboardPage />} />
              <Route path="/my-bookings" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/account" element={<ProfilePage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/deals" element={<OffersPage />} />
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/policy" element={<PoliciesPage />} />
              <Route path="/terms" element={<PoliciesPage />} />
              <Route path="/support" element={<PoliciesPage />} />
              <Route path="/locations" element={<CarsPage />} />
              <Route path="/corporate" element={<PoliciesPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1d2e',
                color: '#fff',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
              },
            }}
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
