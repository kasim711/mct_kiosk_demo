import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Printer, XCircle, Utensils, ShoppingBag } from 'lucide-react';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { formatOMR, formatDateTime, sounds } from '../../utils/format';

interface OrderCardProps {
  order: Order;
  onOpenPaymentModal: (order: Order) => void;
  onOpenCancelModal: (order: Order) => void;
  onReprintReceipt: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onOpenPaymentModal,
  onOpenCancelModal,
  onReprintReceipt,
}) => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  const isPending = order.status === 'PENDING_PAYMENT';
  const isPaid = order.status === 'PAID';
  const isPreparing = order.status === 'PREPARING';
  const isReady = order.status === 'READY';
  const isCompleted = order.status === 'COMPLETED';
  const isCancelled = order.status === 'CANCELLED';

  const getStatusBadge = () => {
    switch (order.status) {
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-extrabold text-xs uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {t('pendingPaymentBadge')}
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {t('paidBadge')}
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {t('preparingBadge')}
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 font-bold text-xs uppercase">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {t('readyBadge')}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 text-slate-300 font-bold text-xs">
            {t('completedBadge')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-900 text-red-500 font-bold text-xs line-through">
            {t('cancelledBadge')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative flex flex-col rounded-xl p-4 border transition-all duration-150 ${
        isPending
          ? 'bg-neutral-900 border-red-500/50 shadow-sm'
          : 'bg-neutral-900 border-neutral-800 shadow-sm'
      }`}
    >
      {/* Header: Order #, Status, Kiosk ID */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white font-mono tracking-wider">
              {order.displayOrderNumber}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
              {order.kioskId}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDateTime(order.createdAt, language)}</span>
          </div>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Type & Table */}
      <div className="py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-1.5">
          {order.orderType === 'DINE_IN' ? (
            <>
              <Utensils className="w-4 h-4 text-amber-400" />
              <span>
                {t('dineIn')}{' '}
                {order.tableNumber && (
                  <strong className="text-amber-400">({t('tableNumber')} {order.tableNumber})</strong>
                )}
              </span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>{t('takeaway')}</span>
            </>
          )}
        </div>

        {order.printCount > 1 && (
          <span className="text-[11px] text-slate-400 font-mono">
            Print x{order.printCount}
          </span>
        )}
      </div>

      {/* Itemized List Preview */}
      <div className="flex-1 py-3 border-t border-b border-neutral-800/80 space-y-2 max-h-48 overflow-y-auto">
        {order.items.map((item) => (
          <div key={item.id} className="text-xs">
            <div className="flex justify-between font-medium text-neutral-200">
              <span>
                {item.quantity} × {isArabic ? item.productNameAr : item.productNameEn}
              </span>
              <span className="font-mono text-neutral-400">
                {formatOMR(item.totalPriceBaisa, language)}
              </span>
            </div>

            {/* Modifiers */}
            {item.selectedModifiersJson && item.selectedModifiersJson !== '[]' && (
              <div className="pl-3 rtl:pr-3 text-[11px] text-amber-400/90 space-y-0.5">
                {JSON.parse(item.selectedModifiersJson).map((m: any, idx: number) => (
                  <div key={idx}>+ {isArabic ? m.nameAr : m.nameEn}</div>
                ))}
              </div>
            )}

            {item.specialNotes && (
              <p className="pl-3 rtl:pr-3 text-[11px] text-neutral-400 italic">
                * {item.specialNotes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Total Amount & Cashier Info */}
      <div className="pt-3 pb-3 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-neutral-400 block uppercase tracking-wider">{t('total')}</span>
          <span className="text-xl font-bold text-amber-400 font-mono">
            {formatOMR(order.totalBaisa, language)}
          </span>
        </div>

        {order.payment && (
          <div className="text-right rtl:text-left text-xs text-neutral-400">
            <span className="block font-medium text-neutral-300">
              {order.payment.paymentMethod}
            </span>
            {order.payment.cashierName && (
              <span className="text-[11px]">{order.payment.cashierName}</span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2">
        {isPending && (
          <button
            onClick={() => {
              sounds.playTap();
              onOpenPaymentModal(order);
            }}
            className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('markAsPaid')}</span>
          </button>
        )}

        <button
          onClick={() => {
            sounds.playTap();
            onReprintReceipt(order);
          }}
          className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700 active:scale-95 transition-all"
          title={t('reprintReceipt')}
        >
          <Printer className="w-4 h-4" />
        </button>

        {!isCompleted && !isCancelled && (
          <button
            onClick={() => {
              sounds.playTap();
              onOpenCancelModal(order);
            }}
            className="p-2.5 rounded-lg bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-neutral-700 active:scale-95 transition-all"
            title={t('cancelOrder')}
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
