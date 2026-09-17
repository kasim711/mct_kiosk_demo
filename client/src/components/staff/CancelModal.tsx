import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { sounds } from '../../utils/format';

interface CancelModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (reason: string) => Promise<void>;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmCancel,
}) => {
  const { t, language } = useLanguage();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const quickReasons = [
    t('customerCancelled'),
    t('wrongOrder'),
    t('productUnavailable'),
    t('otherReason'),
  ];

  const handleSelectReason = (reason: string) => {
    sounds.playTap();
    setSelectedReason(reason);
    if (reason !== t('otherReason')) {
      setCustomReason('');
    }
  };

  const handleSubmit = async () => {
    const finalReason =
      selectedReason === t('otherReason')
        ? customReason.trim()
        : selectedReason || customReason.trim();

    if (!finalReason) {
      setErrorMsg(t('reasonRequired'));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmCancel(finalReason);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t('cancelOrder')}</h3>
              <p className="text-xs text-neutral-400 font-mono">
                ORDER {order.displayOrderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-3.5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            {t('cancellationReason')} *
          </p>

          <div className="space-y-2">
            {quickReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleSelectReason(r)}
                className={`w-full text-left rtl:text-right p-2.5 rounded-lg border text-xs font-medium transition-all active:scale-98 ${
                  selectedReason === r
                    ? 'bg-red-500/15 border-red-500/40 text-red-200'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {(selectedReason === t('otherReason') || !selectedReason) && (
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                language === 'ar'
                  ? 'يرجى كتابة تفاصيل سبب الإلغاء...'
                  : 'Enter specific cancellation details...'
              }
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg p-2.5 text-white text-xs outline-none resize-none"
            />
          )}

          {errorMsg && (
            <p className="text-xs text-red-400 font-medium">{errorMsg}</p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-neutral-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-medium text-xs active:scale-95 transition-all"
          >
            {t('back')}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="py-2 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('confirmCancel')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
