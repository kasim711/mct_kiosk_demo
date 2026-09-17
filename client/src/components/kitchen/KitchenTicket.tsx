import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, Check, CheckCheck, Utensils, ShoppingBag } from 'lucide-react';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { sounds } from '../../utils/format';

interface KitchenTicketProps {
  order: Order;
  onStartPrep: (orderId: string) => Promise<void>;
  onMarkReady: (orderId: string) => Promise<void>;
  onComplete: (orderId: string) => Promise<void>;
}

export const KitchenTicket: React.FC<KitchenTicketProps> = ({
  order,
  onStartPrep,
  onMarkReady,
  onComplete,
}) => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    const calculateElapsed = () => {
      const created = new Date(order.paidAt || order.createdAt).getTime();
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((now - created) / 1000));
      setElapsedMinutes(Math.floor(diffSecs / 60));
      setElapsedSeconds(diffSecs % 60);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt, order.paidAt]);

  const isPreparing = order.status === 'PREPARING';
  const isReady = order.status === 'READY';
  const isPaid = order.status === 'PAID';

  // Timer urgency color
  const getTimerClass = () => {
    if (elapsedMinutes >= 10) return 'text-red-400 bg-red-500/20 border-red-500 animate-pulse';
    if (elapsedMinutes >= 5) return 'text-amber-400 bg-amber-500/20 border-amber-500';
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500';
  };

  const handleAction = async () => {
    sounds.playTap();
    setIsUpdating(true);
    try {
      if (isPaid) {
        await onStartPrep(order.id);
      } else if (isPreparing) {
        sounds.playKitchenAlert();
        await onMarkReady(order.id);
      } else if (isReady) {
        sounds.playSuccess();
        await onComplete(order.id);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden border transition-all ${
        isReady
          ? 'bg-neutral-900 border-blue-500/70'
          : isPreparing
          ? 'bg-neutral-900 border-amber-500/70'
          : 'bg-neutral-900 border-neutral-800'
      }`}
    >
      {/* Ticket Header */}
      <div className="p-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white font-mono tracking-wider">
              {order.displayOrderNumber}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
              {order.kioskId}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs font-medium text-neutral-300">
            {order.orderType === 'DINE_IN' ? (
              <span className="flex items-center gap-1 text-amber-400">
                <Utensils className="w-3.5 h-3.5" />
                <span>
                  {t('dineIn')} {order.tableNumber && `(T${order.tableNumber})`}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-blue-400">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('takeaway')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Elapsed Timer Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${getTimerClass()}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>
            {String(elapsedMinutes).padStart(2, '0')}:
            {String(elapsedSeconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Items Section */}
      <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[380px]">
        {order.items.map((item) => {
          const itemTitle = isArabic ? item.productNameAr : item.productNameEn;

          return (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-md bg-amber-500 text-neutral-950 font-bold text-sm flex items-center justify-center font-mono">
                  {item.quantity}
                </span>
                <span className="text-sm font-bold text-white leading-tight">
                  {itemTitle}
                </span>
              </div>

              {/* Modifiers Badges */}
              {item.selectedModifiersJson && item.selectedModifiersJson !== '[]' && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-9 rtl:pr-9">
                  {JSON.parse(item.selectedModifiersJson).map((m: any, idx: number) => {
                    const isRemoval =
                      m.nameEn.toLowerCase().includes('no ') ||
                      m.nameAr.includes('بدون');
                    return (
                      <span
                        key={idx}
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isRemoval
                            ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isArabic ? m.nameAr : m.nameEn}
                      </span>
                    );
                  })}
                </div>
              )}

              {item.specialNotes && (
                <div className="mt-2 pl-9 rtl:pr-9 text-xs font-medium text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-800/40">
                  ⚠️ Note: {item.specialNotes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Action Button */}
      <div className="p-3.5 bg-neutral-950 border-t border-neutral-800">
        {isPaid && (
          <button
            onClick={handleAction}
            disabled={isUpdating}
            className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ChefHat className="w-4 h-4" />
            <span>{t('startPrep')}</span>
          </button>
        )}

        {isPreparing && (
          <button
            onClick={handleAction}
            disabled={isUpdating}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>{t('markReady')}</span>
          </button>
        )}

        {isReady && (
          <button
            onClick={handleAction}
            disabled={isUpdating}
            className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{t('markComplete')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
