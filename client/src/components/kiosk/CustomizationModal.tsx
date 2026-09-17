import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { Product, ModifierOption } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { formatOMR, sounds } from '../../utils/format';

interface CustomizationModalProps {
  product: Product | null;
  onClose: () => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  product,
  onClose,
}) => {
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const isArabic = language === 'ar';

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<ModifierOption[]>([]);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSpecialNotes('');
      const defaults: ModifierOption[] = [];

      product.modifierGroups?.forEach(({ group }) => {
        if (group.isRequired && group.maxSelect === 1 && group.options.length > 0) {
          defaults.push(group.options[0]);
        }
      });

      setSelectedOptions(defaults);
    }
  }, [product]);

  if (!product) return null;

  const title = isArabic ? product.nameAr : product.nameEn;
  const desc = isArabic ? product.descAr || product.descEn : product.descEn || product.descAr;

  const handleToggleOption = (group: any, option: ModifierOption) => {
    sounds.playTap();
    setSelectedOptions((prev) => {
      const isAlreadySelected = prev.some((o) => o.id === option.id);

      if (group.maxSelect === 1) {
        // Radio single-choice
        const withoutGroup = prev.filter((o) => o.groupId !== group.id);
        if (isAlreadySelected && !group.isRequired) {
          return withoutGroup;
        }
        return [...withoutGroup, option];
      } else {
        // Checkbox multi-choice
        if (isAlreadySelected) {
          return prev.filter((o) => o.id !== option.id);
        } else {
          const currentInGroup = prev.filter((o) => o.groupId === group.id).length;
          if (group.maxSelect > 0 && currentInGroup >= group.maxSelect) {
            return prev;
          }
          return [...prev, option];
        }
      }
    });
  };

  const isOptionSelected = (optionId: string) => {
    return selectedOptions.some((o) => o.id === optionId);
  };

  const modifiersDeltaBaisa = selectedOptions.reduce(
    (sum, opt) => sum + opt.priceDeltaBaisa,
    0
  );
  const unitTotalBaisa = product.priceBaisa + modifiersDeltaBaisa;
  const grandTotalBaisa = unitTotalBaisa * quantity;

  const handleAddToCart = () => {
    sounds.playTap();
    addItem(product, quantity, selectedOptions, specialNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rtl:right-auto rtl:left-3 z-20 p-2 text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: Large Food Image (Split Layout) */}
        <div className="hidden md:block w-5/12 bg-neutral-950 relative overflow-hidden border-r border-neutral-800">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={title}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-700">
              <Sparkles className="w-12 h-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
        </div>

        {/* RIGHT COLUMN: Customization Details & Action */}
        <div className="flex-1 flex flex-col justify-between max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-5 md:p-6 border-b border-neutral-800 bg-neutral-900/90">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {title}
                </h2>
                {desc && (
                  <p className="text-xs md:text-sm text-neutral-400 mt-1 leading-relaxed">
                    {desc}
                  </p>
                )}
              </div>
              <span className="text-lg md:text-xl font-bold font-mono text-amber-400 whitespace-nowrap">
                {formatOMR(product.priceBaisa, language)}
              </span>
            </div>
          </div>

          {/* Scrollable Options Body */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
            {product.modifierGroups && product.modifierGroups.length > 0 ? (
              product.modifierGroups.map(({ group }) => {
                const groupName = isArabic ? group.nameAr : group.nameEn;
                const isSingleChoice = group.maxSelect === 1;

                return (
                  <div key={group.id} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                        {groupName}
                        {group.isRequired && (
                          <span className="text-amber-400 font-semibold ml-1 rtl:mr-1">*</span>
                        )}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-normal">
                        {isSingleChoice
                          ? isArabic ? 'خيار واحد' : 'Select 1'
                          : isArabic ? `حتى ${group.maxSelect}` : `Up to ${group.maxSelect}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.options.map((option) => {
                        const selected = isOptionSelected(option.id);
                        const optName = isArabic ? option.nameAr : option.nameEn;
                        const hasPrice = option.priceDeltaBaisa > 0;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleToggleOption(group, option)}
                            className={`flex items-center justify-between p-3 rounded-lg border text-left rtl:text-right text-xs font-semibold transition-colors kiosk-tap ${
                              selected
                                ? 'bg-neutral-800 border-amber-500 text-white'
                                : 'bg-neutral-850/60 border-neutral-750 text-neutral-300 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-${
                                  isSingleChoice ? 'full' : 'sm'
                                } border flex items-center justify-center ${
                                  selected
                                    ? 'bg-amber-500 border-amber-500 text-neutral-950'
                                    : 'border-neutral-600 bg-neutral-900'
                                }`}
                              >
                                {selected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span>{optName}</span>
                            </div>

                            {hasPrice && (
                              <span className="font-mono text-amber-400 font-normal text-[11px]">
                                +{formatOMR(option.priceDeltaBaisa, language)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : null}

            {/* Special Instructions */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                {t('specialNotes')}
              </label>
              <input
                type="text"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder={isArabic ? 'ملاحظة للمطبخ...' : 'Add special instructions...'}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="p-4 md:p-5 bg-neutral-950 border-t border-neutral-800 flex items-center gap-3">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-neutral-750 bg-neutral-900 rounded-lg p-1 h-12">
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setQuantity(Math.max(1, quantity - 1));
                }}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded bg-neutral-850 hover:bg-neutral-800 disabled:opacity-30 text-neutral-200 flex items-center justify-center kiosk-tap transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-sm text-white font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setQuantity(quantity + 1);
                }}
                className="w-10 h-10 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-200 flex items-center justify-center kiosk-tap transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Order Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 h-12 px-6 rounded-lg bg-amber-500 hover:bg-amber-450 active:bg-amber-600 text-neutral-950 font-bold text-sm tracking-wide flex items-center justify-between shadow-sm kiosk-tap transition-colors"
            >
              <span>{t('addToCart')}</span>
              <span className="font-mono text-base font-bold">
                {formatOMR(grandTotalBaisa, language)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
