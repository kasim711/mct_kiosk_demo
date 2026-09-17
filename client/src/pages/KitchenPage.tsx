import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Clock,
  Maximize,
  Minimize,
  RefreshCw,
  LogOut,
  Volume2,
  VolumeX,
  Store,
} from 'lucide-react';
import { Order } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { sounds } from '../utils/format';
import { KitchenTicket } from '../components/kitchen/KitchenTicket';
import { LanguageToggle } from '../components/shared/LanguageToggle';

export const KitchenPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { socket, joinRoom } = useSocket();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const token = localStorage.getItem('pos_token');

  // Join 'kitchen' room for tickets stream
  useEffect(() => {
    joinRoom('kitchen');
  }, [socket]);

  // Fetch active kitchen tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/kitchen/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        navigate('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Listen for real-time kitchen updates
  useEffect(() => {
    if (!socket) return;

    // Triggered ONLY after cashier marks order as PAID
    const handleNewTicket = ({ order }: { order: Order }) => {
      if (soundEnabled) sounds.playKitchenAlert();
      setTickets((prev) => [...prev, order]);
    };

    const handleStatusChanged = (updatedOrder: Order) => {
      if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
        // Remove from active kitchen queue
        setTickets((prev) => prev.filter((t) => t.id !== updatedOrder.id));
      } else {
        // Update ticket
        setTickets((prev) => prev.map((t) => (t.id === updatedOrder.id ? updatedOrder : t)));
      }
    };

    socket.on('kds:new_ticket', handleNewTicket);
    socket.on('order:status_changed', handleStatusChanged);

    return () => {
      socket.off('kds:new_ticket', handleNewTicket);
      socket.off('order:status_changed', handleStatusChanged);
    };
  }, [socket, soundEnabled]);

  // Action Handlers
  const handleStartPrep = async (orderId: string) => {
    const res = await fetch(`/api/kitchen/tickets/${orderId}/start-prep`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === data.order.id ? data.order : t)));
    }
  };

  const handleMarkReady = async (orderId: string) => {
    const res = await fetch(`/api/kitchen/tickets/${orderId}/ready`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === data.order.id ? data.order : t)));
    }
  };

  const handleComplete = async (orderId: string) => {
    const res = await fetch(`/api/kitchen/tickets/${orderId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setTickets((prev) => prev.filter((t) => t.id !== orderId));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col select-none">
      {/* KDS Header */}
      <header className="sticky top-0 z-30 bg-neutral-900 border-b border-neutral-800 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">{t('kdsTitle')}</h1>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              {tickets.length} {language === 'ar' ? 'طلبات قيد الإعداد' : 'Active Paid Tickets'}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-neutral-800 text-neutral-500 border-neutral-700'
            }`}
            title="Audio alerts"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <LanguageToggle size="sm" />

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 active:scale-95 transition-colors"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={() => navigate('/staff')}
            className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 active:scale-95 transition-colors"
            title="Counter POS"
          >
            <Store className="w-4 h-4" />
          </button>

          <button
            onClick={fetchTickets}
            className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 active:scale-95 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Tickets Grid Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <p className="text-sm font-medium">Syncing kitchen queue...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 mb-4">
              <ChefHat className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-300 mb-1.5">
              {t('noActiveKitchenTickets')}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {t('waitingForPaymentAlert')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tickets.map((ticket) => (
              <KitchenTicket
                key={ticket.id}
                order={ticket}
                onStartPrep={handleStartPrep}
                onMarkReady={handleMarkReady}
                onComplete={handleComplete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
