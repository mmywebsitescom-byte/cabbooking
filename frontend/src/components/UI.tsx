import type { BookingStatus, PaymentStatus } from '../types';

const statusConfig: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'badge-warning' },
  confirmed: { label: 'Confirmed', cls: 'badge-success' },
  active: { label: 'Active', cls: 'badge-info' },
  completed: { label: 'Completed', cls: 'badge-muted' },
  cancelled: { label: 'Cancelled', cls: 'badge-danger' },
  no_show: { label: 'No Show', cls: 'badge-danger' },
};

const paymentConfig: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: { label: 'Payment Pending', cls: 'badge-warning' },
  paid: { label: 'Paid', cls: 'badge-success' },
  partially_paid: { label: 'Partial', cls: 'badge-warning' },
  refunded: { label: 'Refunded', cls: 'badge-info' },
  failed: { label: 'Failed', cls: 'badge-danger' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = statusConfig[status] || { label: status, cls: 'badge-muted' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cfg = paymentConfig[status] || { label: status, cls: 'badge-muted' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

export function Spinner({ size = 40 }: { size?: number }) {
  return <div className="spinner" style={{ width: size, height: size, borderWidth: size > 30 ? 3 : 2 }} />;
}

export function LoadingPage() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <Spinner />
      <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      {icon && <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{icon}</div>}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif' }}>{title}</h3>
      {description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{description}</p>}
      {action}
    </div>
  );
}

export function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}
