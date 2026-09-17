import React, { useEffect, useState } from 'react';
import { Printer, RotateCcw } from 'lucide-react';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { formatOMR, sounds } from '../../utils/format';

interface OrderSuccessModalProps {
  order: Order | null;
  receiptPayload?: any;
  onStartNewOrder: () => void;
  onOpenReceiptSimulator: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onStartNewOrder,
  onOpenReceiptSimulator,
}) => {
  const { t, language } = useLanguage();
  const [countdown, setCountdown] = useState<number>(15);

  useEffect(() => {
    if (order) {
      sounds.playSuccess();
      setCountdown(15);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onStartNewOrder();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [order]);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Subtitle */}
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
          {t('orderSuccessTitle')}
        </span>

        {/* Prominent Order Number */}
        <div className="my-4 py-5 px-8 rounded-lg bg-neutral-950 border border-neutral-800 w-full flex flex-col items-center">
          <span className="text-[11px] font-bold tracking-wider text-neutral-500 uppercase mb-0.5">
            {t('orderNumber')}
          </span>
          <span className="text-5xl md:text-6xl font-black text-amber-400 font-mono tracking-tight">
            {order.displayOrderNumber}
          </span>
          <span className="text-xs text-neutral-400 mt-1 font-mono">
            {order.orderType === 'DINE_IN'
              ? `${t('dineIn')} • ${t('tableNumber')} ${order.tableNumber}`
              : t('takeaway')}
          </span>
        </div>

        {/* Sober Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-950/80 border border-red-800/80 text-red-300 font-bold text-xs uppercase tracking-wider mb-4">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>{t('pendingPaymentStatus')}</span>
        </div>

        {/* Calm Instructions */}
        <p className="text-xs md:text-sm text-neutral-300 max-w-xs mb-6 leading-relaxed">
          {t('orderSuccessDesc')}
        </p>

        <div className="text-xs text-neutral-400 mb-6">
          <span>{t('total')}: </span>
          <span className="font-mono text-white font-bold text-sm">
            {formatOMR(order.totalBaisa, language)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => {
              sounds.playTap();
              onStartNewOrder();
            }}
            className="w-full h-12 rounded-lg bg-amber-500 hover:bg-amber-450 active:bg-amber-600 text-neutral-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 kiosk-tap transition-colors"
          >
            <span>{t('startNewOrder')}</span>
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenReceiptSimulator}
            className="w-full h-10 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold border border-neutral-750 flex items-center justify-center gap-2 kiosk-tap transition-colors"
          >
            <Printer className="w-4 h-4 text-neutral-400" />
            <span>{t('printSimulatorTitle')}</span>
          </button>
        </div>

        {/* Auto Reset Countdown */}
        <span className="text-[11px] text-neutral-500 mt-5">
          {t('autoResetIn')} <strong className="text-neutral-300 font-mono">{countdown}s</strong>
        </span>
      </div>
    </div>
  );
};
