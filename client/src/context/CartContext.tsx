import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ModifierOption, Order } from '../types';
import { useSettings } from './SettingsContext';
import { useLanguage } from './LanguageContext';

interface CartContextType {
  items: CartItem[];
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableNumber: string;
  kioskId: string;
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY') => void;
  setTableNumber: (table: string) => void;
  setKioskId: (id: string) => void;
  addItem: (
    product: Product,
    quantity: number,
    selectedOptions: ModifierOption[],
    specialNotes?: string
  ) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotalBaisa: number;
  taxBaisa: number;
  totalBaisa: number;
  placeOrder: () => Promise<{ order: Order; receipt: any }>;
  isSubmitting: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [kioskId, setKioskId] = useState<string>('Kiosk-1');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { settings } = useSettings();
  const { language } = useLanguage();

  // Read kiosk ID from URL query if present (e.g. ?kioskId=Kiosk-2)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qKioskId = params.get('kioskId');
    if (qKioskId) {
      setKioskId(qKioskId);
      localStorage.setItem('kiosk_id', qKioskId);
    } else {
      const saved = localStorage.getItem('kiosk_id');
      if (saved) setKioskId(saved);
    }
  }, []);

  const generateCartItemId = (productId: string, options: ModifierOption[]) => {
    const sortedOptionIds = options
      .map((o) => o.id)
      .sort()
      .join('_');
    return `${productId}_${sortedOptionIds}`;
  };

  const addItem = (
    product: Product,
    quantity: number,
    selectedOptions: ModifierOption[],
    specialNotes?: string
  ) => {
    const cartItemId = generateCartItemId(product.id, selectedOptions);
    const modifiersDelta = selectedOptions.reduce((sum, opt) => sum + opt.priceDeltaBaisa, 0);
    const unitPriceBaisa = product.priceBaisa;
    const itemTotalBaisa = (unitPriceBaisa + modifiersDelta) * quantity;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === cartItemId);
      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = existing.quantity + quantity;
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPriceBaisa: (unitPriceBaisa + modifiersDelta) * newQty,
          specialNotes: specialNotes || existing.specialNotes,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          quantity,
          selectedOptions,
          specialNotes,
          unitPriceBaisa,
          modifiersPriceBaisa: modifiersDelta,
          totalPriceBaisa: itemTotalBaisa,
        },
      ];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPriceBaisa: (item.unitPriceBaisa + item.modifiersPriceBaisa) * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    setTableNumber('');
  };

  // Pricing calculations
  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalBaisa = items.reduce((sum, i) => sum + i.totalPriceBaisa, 0);

  const isTaxEnabled = settings?.isTaxEnabled ?? true;
  const taxRatePercent = settings?.taxRatePercent ?? 5.0;
  const isTaxIncludedInPrice = settings?.isTaxIncludedInPrice ?? true;

  let taxBaisa = 0;
  let totalBaisa = subtotalBaisa;

  if (isTaxEnabled && taxRatePercent > 0) {
    if (isTaxIncludedInPrice) {
      taxBaisa = Math.round(subtotalBaisa * (taxRatePercent / (100 + taxRatePercent)));
      totalBaisa = subtotalBaisa;
    } else {
      taxBaisa = Math.round(subtotalBaisa * (taxRatePercent / 100));
      totalBaisa = subtotalBaisa + taxBaisa;
    }
  }

  // Submit order to server (strictly sending IDs and quantities; backend calculates actual prices)
  const placeOrder = async (): Promise<{ order: Order; receipt: any }> => {
    if (items.length === 0) {
      throw new Error('Cannot place an empty order');
    }

    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      throw new Error('Table number is required for Dine-in orders');
    }

    setIsSubmitting(true);
    try {
      const payload = {
        kioskId,
        orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() : undefined,
        customerLanguage: language,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          modifierOptionIds: item.selectedOptions.map((o) => o.id),
          specialNotes: item.specialNotes,
        })),
      };

      const res = await fetch('/api/kiosk/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to place order');
      }

      const data = await res.json();
      clearCart();
      return data;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        orderType,
        tableNumber,
        kioskId,
        setOrderType,
        setTableNumber,
        setKioskId,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItemsCount,
        subtotalBaisa,
        taxBaisa,
        totalBaisa,
        placeOrder,
        isSubmitting,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
