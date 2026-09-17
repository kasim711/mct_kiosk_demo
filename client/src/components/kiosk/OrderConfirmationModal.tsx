import React from 'react';
import { X, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { formatOMR, sounds } from '../../utils/format';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmOrder: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmOrder,
}) => {
  const { items, orderType, tableNumber, totalBaisa, subtotalBaisa, taxBaisa, isSubmitting } = useCart();
  const { language, t, isRtl } = useLanguage();
  const { settings } = useSettings();
  const isArabic = language === 'ar';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">
              {t('orderSummary')}
            </h3>
            <span className="text-xs text-neutral-400">
              {orderType === 'DINE_IN'
                ? `${t('dineIn')} • ${t('tableNumber')} ${tableNumber}`
                : t('takeaway')}
            </span>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt-Style Summary Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Itemized List */}
          <div className="divide-y divide-neutral-800 border-b border-neutral-800 pb-3">
            {items.map((item) => {
              const itemTitle = isArabic ? item.product.nameAr : item.product.nameEn;

              return (
                <div key={item.id} className="py-2.5 first:pt-0">
                  <div className="flex justify-between items-start text-xs font-semibold">
                    <span className="text-white">
                      {item.quantity} × {itemTitle}
                    </span>
                    <span className="font-mono text-neutral-200">
                      {formatOMR(item.totalPriceBaisa, language)}
                    </span>
                  </div>

                  {item.selectedOptions.length > 0 && (
                    <div className="text-[11px] text-neutral-400 mt-1 space-y-0.5 pl-2 rtl:pr-2">
                      {item.selectedOptions.map((opt) => (
                        <div key={opt.id}>+ {isArabic ? opt.nameAr : opt.nameEn}</div>
                      ))}
                    </div>
                  )}

                  {item.specialNotes && (
                    <div className="text-[11px] text-neutral-400 italic mt-0.5 pl-2 rtl:pr-2">
                      * {item.specialNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>{t('subtotal')}</span>
              <span className="font-mono text-neutral-200">{formatOMR(subtotalBaisa, language)}</span>
            </div>

            {settings?.isTaxEnabled && (
              <div className="flex justify-between text-neutral-400 text-[11px]">
                <span>
                  {t('vat')} ({settings.taxRatePercent}%{' '}
                  {settings.isTaxIncludedInPrice ? t('vatIncluded') : ''})
                </span>
                <span className="font-mono text-neutral-300">{formatOMR(taxBaisa, language)}</span>
              </div>
            )}

            <div className="flex justify-between text-white text-base font-bold pt-2 border-t border-neutral-800">
              <span>{t('total')}</span>
              <span className="font-mono text-amber-400 text-lg font-bold">
                {formatOMR(totalBaisa, language)}
              </span>
            </div>
          </div>

          {/* Calm, Sober Counter Payment Notice */}
          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
            <span className="font-bold text-neutral-200 uppercase tracking-wider block mb-1">
              {isArabic ? 'الدفع عند الكاونتر' : 'PAYMENT AT COUNTER'}
            </span>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              {isArabic
                ? 'سيتم سداد قيمة الطلب يدوياً لدى كاشير المطعم بعد استلام الإيصال.'
                : 'Payment will be collected at the restaurant counter via Cash or Card.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-11 px-5 rounded-lg border border-neutral-750 text-neutral-300 hover:text-white text-xs font-semibold kiosk-tap transition-colors"
          >
            {t('back')}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onConfirmOrder();
            }}
            disabled={isSubmitting}
            className="h-11 px-6 rounded-lg bg-amber-500 hover:bg-amber-450 active:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 kiosk-tap transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('placingOrder')}</span>
              </>
            ) : (
              <>
                <span>{t('confirmOrder')}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
