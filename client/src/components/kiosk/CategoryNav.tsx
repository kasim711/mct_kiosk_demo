import React from 'react';
import { Category } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { sounds } from '../../utils/format';

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const { language, t } = useLanguage();
  const isArabic = language === 'ar';

  const handleSelect = (id: string | null) => {
    sounds.playTap();
    onSelectCategory(id);
  };

  return (
    <nav className="w-full bg-neutral-900 border-b border-neutral-800 sticky top-16 z-20 px-6 py-0 overflow-x-auto scrollbar-none select-none">
      <div className="flex items-center gap-1 sm:gap-2 min-w-max max-w-7xl mx-auto">
        {/* All Items */}
        <button
          onClick={() => handleSelect(null)}
          className={`relative py-4 px-4 text-sm font-bold transition-colors whitespace-nowrap kiosk-tap ${
            selectedCategoryId === null
              ? 'text-white font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>{t('all')}</span>
          {selectedCategoryId === null && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />
          )}
        </button>

        {/* Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const title = isArabic ? cat.nameAr : cat.nameEn;

          return (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              className={`relative py-4 px-4 text-sm font-bold transition-colors whitespace-nowrap kiosk-tap ${
                isSelected
                  ? 'text-white font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{title}</span>
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
