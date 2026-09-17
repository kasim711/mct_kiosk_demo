import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, ArrowRight, ArrowLeft, RefreshCw, ChefHat } from 'lucide-react';
import { Category, Product, Order } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { formatOMR, sounds } from '../utils/format';

import { WelcomeScreen } from '../components/kiosk/WelcomeScreen';
import { CategoryNav } from '../components/kiosk/CategoryNav';
import { ProductCard } from '../components/kiosk/ProductCard';
import { CustomizationModal } from '../components/kiosk/CustomizationModal';
import { CartDrawer } from '../components/kiosk/CartDrawer';

import { OrderConfirmationModal } from '../components/kiosk/OrderConfirmationModal';
import { OrderSuccessModal } from '../components/kiosk/OrderSuccessModal';
import { InactivityModal } from '../components/kiosk/InactivityModal';
import { ThermalReceiptSimulator } from '../components/shared/ThermalReceiptSimulator';
import { LanguageToggle } from '../components/shared/LanguageToggle';

export const KioskPage: React.FC = () => {
  const { language, t, isRtl } = useLanguage();
  const { items, totalItemsCount, totalBaisa, orderType, tableNumber, placeOrder, clearCart } = useCart();
  const { settings } = useSettings();

  // Menu State
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);

  // Workflow Modal States
  const [viewState, setViewState] = useState<'welcome' | 'menu'>('welcome');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [receiptPayload, setReceiptPayload] = useState<any>(null);
  const [isReceiptSimulatorOpen, setIsReceiptSimulatorOpen] = useState<boolean>(false);

  // Inactivity Detection
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState<boolean>(false);
  const idleTimerRef = useRef<any>(null);
  const idleTimeoutSecs = settings?.idleTimeoutSeconds || 60;

  // Fetch Menu
  const fetchMenu = async () => {
    try {
      setLoadingMenu(true);
      const res = await fetch('/api/kiosk/menu');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Idle Timer
  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isIdleWarningOpen) return;

    if (viewState === 'menu' && !placedOrder) {
      idleTimerRef.current = setTimeout(() => {
        setIsIdleWarningOpen(true);
      }, idleTimeoutSecs * 1000);
    }
  };

  useEffect(() => {
    const handleUserActivity = () => resetIdleTimer();
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [viewState, placedOrder, idleTimeoutSecs, isIdleWarningOpen]);

  const handleProceedFromCart = () => {
    setIsCartOpen(false);
    setIsConfirmModalOpen(true);
  };



  const handlePlaceOrder = async () => {
    try {
      const result = await placeOrder();
      setIsConfirmModalOpen(false);
      setPlacedOrder(result.order);
      setReceiptPayload(result.receipt);
    } catch (err: any) {
      alert(err.message || 'Failed to place order');
    }
  };

  const handleStartNewOrder = () => {
    clearCart();
    setPlacedOrder(null);
    setReceiptPayload(null);
    setIsReceiptSimulatorOpen(false);
    setViewState('welcome');
  };

  const filteredProducts = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)?.products || []
    : categories.flatMap((c) => c.products);

  if (viewState === 'welcome') {
    return <WelcomeScreen onStartOrder={() => setViewState('menu')} />;
  }

  const restaurantName = language === 'ar'
    ? settings?.restaurantNameAr || t('restaurantName')
    : settings?.restaurantNameEn || t('restaurantName');

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col select-none">
      {/* Compact Commercial POS Header (64px) */}
      <header className="sticky top-0 z-30 h-16 bg-neutral-900 border-b border-neutral-800 px-6 flex items-center justify-between shadow-sm">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewState('welcome')}
            className="flex items-center gap-2.5 text-left rtl:text-right hover:opacity-90 transition-opacity kiosk-tap"
          >
            <div className="w-8 h-8 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-500 font-bold text-sm">
              M
            </div>
            <span className="text-base font-bold text-white tracking-tight leading-none">
              {restaurantName}
            </span>
          </button>
        </div>

        {/* Center: Order Type Status */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-md bg-neutral-850 border border-neutral-750 text-neutral-300">
            {orderType === 'DINE_IN' ? t('dineIn') : t('takeaway')}
          </span>
        </div>

        {/* Right: Language + Compact Cart Button */}
        <div className="flex items-center gap-2.5">
          <LanguageToggle />

          <button
            onClick={() => {
              sounds.playTap();
              setIsCartOpen(true);
            }}
            className="h-10 px-4 rounded-lg bg-neutral-850 hover:bg-neutral-800 active:bg-neutral-750 border border-neutral-750 text-white flex items-center gap-2.5 text-xs font-bold transition-colors kiosk-tap"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">{t('cart')}</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950 font-bold text-[11px] font-mono">
              {totalItemsCount}
            </span>
          </button>
        </div>
      </header>

      {/* Clean Category Navigation */}
      <CategoryNav
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* Dense Commercial Product Grid */}
      <main className="flex-1 p-5 md:p-6 max-w-7xl mx-auto w-full pb-24">
        {loadingMenu ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <RefreshCw className="w-8 h-8 animate-spin text-neutral-400 mb-2" />
            <p className="text-xs font-semibold">{t('placingOrder')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenCustomization={setCustomizingProduct}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sleek Commercial Bottom Cart Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-neutral-900 border-t border-neutral-800 px-6 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700 font-mono font-bold text-xs text-white">
                {totalItemsCount} {t('items')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-neutral-400">{t('total')}:</span>
                <span className="font-mono text-base font-bold text-amber-400">
                  {formatOMR(totalBaisa, language)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playTap();
                setIsCartOpen(true);
              }}
              className="h-11 px-6 rounded-lg bg-amber-500 hover:bg-amber-450 active:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 kiosk-tap transition-colors"
            >
              <span>{t('cart')}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Workflow Modals */}
      <CustomizationModal
        product={customizingProduct}
        onClose={() => setCustomizingProduct(null)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToTableOrConfirm={handleProceedFromCart}
      />



      <OrderConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirmOrder={handlePlaceOrder}
      />

      <OrderSuccessModal
        order={placedOrder}
        receiptPayload={receiptPayload}
        onStartNewOrder={handleStartNewOrder}
        onOpenReceiptSimulator={() => setIsReceiptSimulatorOpen(true)}
      />

      <ThermalReceiptSimulator
        isOpen={isReceiptSimulatorOpen}
        receiptPayload={receiptPayload}
        onClose={() => setIsReceiptSimulatorOpen(false)}
      />

      <InactivityModal
        isOpen={isIdleWarningOpen}
        countdownSeconds={15}
        onContinue={() => setIsIdleWarningOpen(false)}
        onReset={() => {
          setIsIdleWarningOpen(false);
          handleStartNewOrder();
        }}
      />
    </div>
  );
};
