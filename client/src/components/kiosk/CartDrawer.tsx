import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { formatOMR, sounds } from '../../utils/format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToTableOrConfirm: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToTableOrConfirm,
}) => {
  const { items, updateQuantity, removeItem, clearCart, subtotalBaisa, taxBaisa, totalBaisa } = useCart();
  const { language, t, isRtl } = useLanguage();
  const { settings } = useSettings();
  const isArabic = language === 'ar';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/75 backdrop-blur-xs animate-fade-in select-none">
      <div className="w-full max-w-md h-full bg-neutral-900 border-l rtl:border-l-0 rtl:border-r border-neutral-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-neutral-400" />
            <h2 className="text-base font-bold text-white tracking-wide uppercase">
              {t('cart')} ({items.length})
            </h2>
          </div>

          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={() => {
                  sounds.playTap();
                  clearCart();
                }}
                className="p-2 text-neutral-400 hover:text-red-400 rounded-lg transition-colors"
                title={t('clearCart')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-500">
              <ShoppingBag className="w-12 h-12 mb-3 text-neutral-600 stroke-[1.5]" />
              <p className="text-base font-semibold text-neutral-300 mb-1">{t('cartEmpty')}</p>
              <p className="text-xs text-neutral-500 max-w-xs">{t('cartEmptyDesc')}</p>
            </div>
          ) : (
            items.map((item) => {
              const itemTitle = isArabic ? item.product.nameAr : item.product.nameEn;

              return (
                <div
                  key={item.id}
                  className="bg-neutral-850 border border-neutral-750/80 rounded-lg p-3.5 flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {itemTitle}
                      </h4>

                      {/* Modifiers List */}
                      {item.selectedOptions.length > 0 && (
                        <div className="text-[11px] text-neutral-400 mt-1 space-y-0.5">
                          {item.selectedOptions.map((opt) => (
                            <div key={opt.id} className="flex items-center gap-1">
                              <span>•</span>
                              <span>{isArabic ? opt.nameAr : opt.nameEn}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.specialNotes && (
                        <p className="text-[11px] text-neutral-400 italic mt-1">
                          * {item.specialNotes}
                        </p>
                      )}
                    </div>

                    <span className="font-mono font-bold text-sm text-neutral-200 whitespace-nowrap">
                      {formatOMR(item.totalPriceBaisa, language)}
                    </span>
                  </div>

                  {/* Quantity and Remove Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-750">
                    <button
                      onClick={() => {
                        sounds.playTap();
                        removeItem(item.id);
                      }}
                      className="text-[11px] text-neutral-400 hover:text-red-400 font-medium transition-colors"
                    >
                      {isArabic ? 'إزالة' : 'Remove'}
                    </button>

                    <div className="flex items-center border border-neutral-700 bg-neutral-900 rounded-md p-0.5">
                      <button
                        onClick={() => {
                          sounds.playTap();
                          updateQuantity(item.id, -1);
                        }}
                        className="w-7 h-7 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-200 flex items-center justify-center kiosk-tap"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-white font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          sounds.playTap();
                          updateQuantity(item.id, 1);
                        }}
                        className="w-7 h-7 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-200 flex items-center justify-center kiosk-tap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Financial Summary & Actions */}
        {items.length > 0 && (
          <div className="p-5 bg-neutral-950 border-t border-neutral-800 space-y-4">
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

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  sounds.playTap();
                  onProceedToTableOrConfirm();
                }}
                className="w-full h-12 px-5 rounded-lg bg-amber-500 hover:bg-amber-450 active:bg-amber-600 text-neutral-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 kiosk-tap transition-colors"
              >
                <span>{t('reviewOrder')}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="w-full h-10 text-xs text-neutral-400 hover:text-white font-semibold rounded-lg transition-colors border border-neutral-800"
              >
                {t('continueShopping')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
