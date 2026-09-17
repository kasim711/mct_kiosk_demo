import React from 'react';
import { Utensils, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { LanguageToggle } from '../shared/LanguageToggle';
import { sounds } from '../../utils/format';

interface WelcomeScreenProps {
  onStartOrder: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartOrder }) => {
  const { t, language, isRtl } = useLanguage();
  const { setOrderType } = useCart();
  const { settings } = useSettings();

  const isArabic = language === 'ar';
  const restaurantName = isArabic
    ? settings?.restaurantNameAr || t('restaurantName')
    : settings?.restaurantNameEn || t('restaurantName');

  const handleSelectOrderType = (type: 'DINE_IN' | 'TAKEAWAY') => {
    sounds.playTap();
    setOrderType(type);
    onStartOrder();
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-neutral-950 text-neutral-100 select-none overflow-hidden">
      {/* Background with dark moody food photography and heavy vignette */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 filter brightness-75 scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/90 via-neutral-950/80 to-neutral-950/95" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-8 py-6 flex items-center justify-between border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-500 font-bold text-base">
            M
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block">
              {restaurantName}
            </span>
            <span className="text-xs text-neutral-400 font-normal">
              {isArabic ? 'مسقط، سلطنة عُمان' : 'Muscat, Sultanate of Oman'}
            </span>
          </div>
        </div>

        <LanguageToggle />
      </header>

      {/* Center Interactive Kiosk Zone */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-xl mx-auto w-full text-center">
        {/* Simple Commercial Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
            {isArabic ? 'أهلاً بكم' : 'Welcome'}
          </h1>
          <p className="text-sm md:text-base text-neutral-400">
            {isArabic ? 'يرجى اختيار طريقة الطلب للمتابعة' : "Choose how you'd like to order"}
          </p>
        </div>

        {/* Dine-In / Takeaway Primary Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <button
            onClick={() => handleSelectOrderType('DINE_IN')}
            className="flex flex-col items-center justify-center p-6 md:p-8 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 active:bg-neutral-800 border border-neutral-750 hover:border-amber-500/60 transition-all kiosk-tap text-center group"
          >
            <div className="w-14 h-14 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4 text-neutral-200 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-colors">
              <Utensils className="w-7 h-7" />
            </div>
            <span className="text-lg font-bold text-white mb-1">{t('dineIn')}</span>
            <span className="text-xs text-neutral-400 font-normal">{t('dineInDesc')}</span>
          </button>

          <button
            onClick={() => handleSelectOrderType('TAKEAWAY')}
            className="flex flex-col items-center justify-center p-6 md:p-8 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 active:bg-neutral-800 border border-neutral-750 hover:border-amber-500/60 transition-all kiosk-tap text-center group"
          >
            <div className="w-14 h-14 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4 text-neutral-200 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-colors">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <span className="text-lg font-bold text-white mb-1">{t('takeaway')}</span>
            <span className="text-xs text-neutral-400 font-normal">{t('takeawayDesc')}</span>
          </button>
        </div>

        {/* Separator */}
        <div className="w-full flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
            {isArabic ? 'أو' : 'OR'}
          </span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        {/* Fast "Start Your Order" Button */}
        <button
          onClick={() => {
            sounds.playTap();
            onStartOrder();
          }}
          className="w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-450 active:bg-amber-600 text-neutral-950 font-bold text-base flex items-center justify-center gap-2 transition-colors kiosk-tap shadow-md"
        >
          <span>{t('startOrder')}</span>
          {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
        </button>
      </main>

      {/* Clean Commercial Footer */}
      <footer className="relative z-10 w-full py-4 px-8 border-t border-neutral-800/80 bg-neutral-950/90 text-center">
        <p className="text-xs text-neutral-400 font-normal">
          {isArabic
            ? 'لا يلزم الدفع داخل الكشك. يتم سداد قيمة الطلب يدوياً لدى الكاشير نقداً أو بالبطاقة.'
            : 'No card payment inside kiosk. Please complete payment at the counter.'}
        </p>
      </footer>
    </div>
  );
};
