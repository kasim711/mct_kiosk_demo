import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  LogOut,
  Bell,
  Volume2,
  VolumeX,
  ChefHat,
  LayoutDashboard,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { sounds } from '../utils/format';
import { OrderCard } from '../components/staff/OrderCard';
import { PaymentModal } from '../components/staff/PaymentModal';
import { CancelModal } from '../components/staff/CancelModal';
import { ThermalReceiptSimulator } from '../components/shared/ThermalReceiptSimulator';
import { LanguageToggle } from '../components/shared/LanguageToggle';

export const StaffPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { socket, joinRoom } = useSocket();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals state
  const [selectedOrderForPay, setSelectedOrderForPay] = useState<Order | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [receiptPayload, setReceiptPayload] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Authenticated user
  const token = localStorage.getItem('pos_token');
  const currentUser = localStorage.getItem('pos_user')
    ? JSON.parse(localStorage.getItem('pos_user')!)
    : null;

  // Join 'staff' room for real-time order alerts
  useEffect(() => {
    joinRoom('staff');
  }, [socket]);

  // Fetch orders from server
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/staff/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        navigate('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Listen for real-time events via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = (newOrder: Order) => {
      if (soundEnabled) sounds.playNewOrderChime();
      setOrders((prev) => [newOrder, ...prev]);
    };

    const handleOrderPaid = ({ order }: { order: Order }) => {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    };

    const handleStatusChanged = (updatedOrder: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    };

    const handleOrderCancelled = (cancelledOrder: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === cancelledOrder.id ? cancelledOrder : o)));
    };

    socket.on('order:created', handleOrderCreated);
    socket.on('order:paid', handleOrderPaid);
    socket.on('order:status_changed', handleStatusChanged);
    socket.on('order:cancelled', handleOrderCancelled);

    return () => {
      socket.off('order:created', handleOrderCreated);
      socket.off('order:paid', handleOrderPaid);
      socket.off('order:status_changed', handleStatusChanged);
      socket.off('order:cancelled', handleOrderCancelled);
    };
  }, [socket, soundEnabled]);

  // Payment Settlement Handler
  const handleConfirmPayment = async (
    paymentMethod: 'CASH' | 'CARD' | 'OTHER',
    receivedBaisa?: number,
    notes?: string
  ) => {
    if (!selectedOrderForPay) return;

    const res = await fetch(`/api/staff/orders/${selectedOrderForPay.id}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentMethod, receivedBaisa, notes }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Payment failed');
    }

    const data = await res.json();
    sounds.playSuccess();
    setOrders((prev) => prev.map((o) => (o.id === data.order.id ? data.order : o)));

    // Open receipt simulator if cashier wants to print
    if (data.receipt) {
      setReceiptPayload(data.receipt);
      setIsReceiptOpen(true);
    }
  };

  // Cancellation Handler
  const handleConfirmCancel = async (reason: string) => {
    if (!selectedOrderForCancel) return;

    const res = await fetch(`/api/staff/orders/${selectedOrderForCancel.id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Cancellation failed');
    }

    const data = await res.json();
    setOrders((prev) => prev.map((o) => (o.id === data.order.id ? data.order : o)));
  };

  // Reprint Receipt Handler
  const handleReprintReceipt = async (order: Order) => {
    try {
      const res = await fetch(`/api/staff/orders/${order.id}/reprint`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReceiptPayload(data.receipt);
        setIsReceiptOpen(true);
      }
    } catch {
      alert('Failed to reprint receipt');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    navigate('/login');
  };

  // Filter and Search
  const filteredOrders = orders.filter((order) => {
    if (selectedStatus !== 'ALL' && order.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = String(order.orderNumber).includes(q);
      const matchTable = order.tableNumber && order.tableNumber.toLowerCase().includes(q);
      const matchKiosk = order.kioskId.toLowerCase().includes(q);
      return matchNum || matchTable || matchKiosk;
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING_PAYMENT').length;

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col select-none">
      {/* Top Staff Navigation Header */}
      <header className="sticky top-0 z-30 bg-neutral-900 border-b border-neutral-800 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs">
            POS
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">{t('counterPOS')}</h1>
            <p className="text-xs text-neutral-400">
              {currentUser?.name || 'Cashier Counter'} • Muscat, Oman
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-neutral-800 text-neutral-500 border-neutral-700'
            }`}
            title="Audio alerts toggle"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <LanguageToggle size="sm" />

          {/* Quick links to KDS & Admin */}
          <button
            onClick={() => navigate('/kitchen')}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700 flex items-center gap-1.5 text-xs font-semibold transition-colors"
            title="Kitchen Display"
          >
            <ChefHat className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">{t('kitchenKDS')}</span>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700 flex items-center gap-1.5 text-xs font-semibold transition-colors"
            title="Admin Panel"
          >
            <LayoutDashboard className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">{t('adminPanel')}</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 text-xs font-semibold transition-colors"
            title={t('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Filter and Search Toolbar */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'ALL'
                ? 'bg-neutral-200 text-neutral-950'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-750'
            }`}
          >
            {t('filterStatus')} ({orders.length})
          </button>

          {/* Prominent Pending Payment Filter */}
          <button
            onClick={() => setSelectedStatus('PENDING_PAYMENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              selectedStatus === 'PENDING_PAYMENT'
                ? 'bg-red-500 text-white'
                : 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>{t('pendingPaymentBadge')}</span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus('PAID')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'PAID'
                ? 'bg-emerald-500 text-neutral-950'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-750'
            }`}
          >
            {t('paidBadge')}
          </button>

          <button
            onClick={() => setSelectedStatus('PREPARING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'PREPARING'
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-750'
            }`}
          >
            {t('preparingBadge')}
          </button>

          <button
            onClick={() => setSelectedStatus('READY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'READY'
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-750'
            }`}
          >
            {t('readyBadge')}
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchOrders')}
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none"
            />
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 active:scale-95"
            title="Refresh orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <main className="flex-1 p-5 md:p-6 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <RefreshCw className="w-7 h-7 animate-spin text-amber-500 mb-2.5" />
            <p className="text-xs font-medium">Loading incoming orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 text-center">
            <CheckCircle2 className="w-12 h-12 text-neutral-700 mb-2.5" />
            <p className="text-base font-semibold text-neutral-400">No orders found</p>
            <p className="text-xs text-neutral-500 max-w-sm mt-1">
              Orders created on customer kiosks will stream here automatically in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onOpenPaymentModal={setSelectedOrderForPay}
                onOpenCancelModal={setSelectedOrderForCancel}
                onReprintReceipt={handleReprintReceipt}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <PaymentModal
        order={selectedOrderForPay}
        isOpen={!!selectedOrderForPay}
        onClose={() => setSelectedOrderForPay(null)}
        onConfirmPayment={handleConfirmPayment}
      />

      <CancelModal
        order={selectedOrderForCancel}
        isOpen={!!selectedOrderForCancel}
        onClose={() => setSelectedOrderForCancel(null)}
        onConfirmCancel={handleConfirmCancel}
      />

      <ThermalReceiptSimulator
        receiptPayload={receiptPayload}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
