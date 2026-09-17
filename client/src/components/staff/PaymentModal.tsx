import React, { useState } from 'react';
import { X, CreditCard, Banknote, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { formatOMR, sounds } from '../../utils/format';

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (
    paymentMethod: 'CASH' | 'CARD' | 'OTHER',
    receivedBaisa?: number,
    notes?: string
  ) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmPayment,
}) => {
  const { t, language } = useLanguage();
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'OTHER'>('CASH');
  const [receivedInput, setReceivedInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const totalOmr = order.totalBaisa / 1000;
  const receivedBaisa = Math.round(parseFloat(receivedInput || '0') * 1000);
  const changeBaisa = receivedBaisa - order.totalBaisa;
  const isCashInsufficient = method === 'CASH' && receivedBaisa < order.totalBaisa;

  const handleQuickAmount = (omr: number) => {
    sounds.playTap();
    setReceivedInput(omr.toFixed(3));
    setErrorMsg(null);
  };

  const handleExactAmount = () => {
    sounds.playTap();
    setReceivedInput(totalOmr.toFixed(3));
    setErrorMsg(null);
  };

  const handleSubmit = async () => {
    if (method === 'CASH' && isCashInsufficient) {
      setErrorMsg(t('insufficientCash'));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmPayment(
        method,
        method === 'CASH' ? receivedBaisa : undefined,
        notes.trim() || undefined
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment settlement failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{t('payModalTitle')}</h3>
            <p className="text-xs text-amber-500 font-medium font-mono mt-0.5">
              ORDER {order.displayOrderNumber} • {order.kioskId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Total Due Banner */}
          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              {t('total')}
            </span>
            <span className="text-3xl font-black text-amber-400 font-mono">
              {formatOMR(order.totalBaisa, language)}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              {t('paymentMethod')}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setMethod('CASH');
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border font-bold text-sm transition-all active:scale-95 ${
                  method === 'CASH'
                    ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1" />
                <span>{t('cash')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setMethod('CARD');
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border font-bold text-sm transition-all active:scale-95 ${
                  method === 'CARD'
                    ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1" />
                <span>{t('card')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setMethod('OTHER');
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border font-bold text-sm transition-all active:scale-95 ${
                  method === 'OTHER'
                    ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                }`}
              >
                <HelpCircle className="w-5 h-5 mb-1" />
                <span>{t('other')}</span>
              </button>
            </div>
          </div>

          {/* Cash Details (Only if Cash is selected) */}
          {method === 'CASH' && (
            <div className="space-y-3.5 bg-neutral-950 border border-neutral-800 rounded-lg p-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  {t('cashReceived')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.100"
                    min="0"
                    value={receivedInput}
                    onChange={(e) => {
                      setReceivedInput(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="0.000"
                    className="w-full bg-neutral-900 border border-neutral-700 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-xl font-bold font-mono text-white tracking-wider outline-none"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-semibold text-neutral-500">
                    OMR
                  </span>
                </div>
              </div>

              {/* Quick Denominations */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExactAmount}
                  className="px-2.5 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30 active:scale-95"
                >
                  {language === 'ar' ? 'المبلغ بالضبط' : 'Exact Amount'}
                </button>
                {[1, 5, 10, 20].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAmount(amt)}
                    className="px-2.5 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold border border-neutral-700 font-mono active:scale-95"
                  >
                    +{amt} OMR
                  </button>
                ))}
              </div>

              {/* Calculated Change Due */}
              <div className="pt-2.5 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  {t('changeDue')}
                </span>
                <span
                  className={`text-xl font-bold font-mono ${
                    changeBaisa >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatOMR(Math.max(0, changeBaisa), language)}
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-medium text-xs active:scale-95 transition-all"
          >
            {t('back')}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (method === 'CASH' && isCashInsufficient)}
            className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:pointer-events-none text-neutral-950 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{t('confirmPayment')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
