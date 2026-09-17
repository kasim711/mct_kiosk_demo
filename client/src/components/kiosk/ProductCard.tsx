import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { formatOMR, sounds } from '../../utils/format';

interface ProductCardProps {
  product: Product;
  onOpenCustomization: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenCustomization,
}) => {
  const { language, t } = useLanguage();
  const isArabic = language === 'ar';

  const title = isArabic ? product.nameAr : product.nameEn;
  const desc = isArabic ? product.descAr || product.descEn : product.descEn || product.descAr;

  const handleClick = () => {
    sounds.playTap();
    onOpenCustomization(product);
  };

  return (
    <div
      onClick={handleClick}
      className="group flex flex-col bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden shadow-sm transition-all duration-150 kiosk-tap cursor-pointer select-none"
    >
      {/* Product Image: 48-52% visual weight */}
      <div className="relative w-full aspect-[16/10] bg-neutral-950 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={title}
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-700">
            <Sparkles className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between p-4 bg-neutral-900">
        <div>
          <h3 className="text-base font-bold text-white leading-snug line-clamp-1 mb-1">
            {title}
          </h3>

          {desc && (
            <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-3">
              {desc}
            </p>
          )}
        </div>

        {/* Bottom Row: Price + Rectangular ADD Button */}
        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between mt-auto">
          <span className="font-mono font-bold text-base text-amber-400">
            {formatOMR(product.priceBaisa, language)}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="h-9 px-3.5 rounded-lg bg-neutral-800 hover:bg-amber-500 text-neutral-200 hover:text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-neutral-700/60"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t('add')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
