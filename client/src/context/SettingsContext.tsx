import React, { createContext, useContext, useState, useEffect } from 'react';
import { RestaurantSettings } from '../types';

interface SettingsContextType {
  settings: RestaurantSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultFallbackSettings: RestaurantSettings = {
  restaurantNameEn: 'Muscat Grill & Burger Lounge',
  restaurantNameAr: 'مطعم ولاونج مسقط للمشاوي والبرجر',
  addressEn: 'Al Khuwair St, Muscat, Sultanate of Oman',
  addressAr: 'شارع الخوير، مسقط، سلطنة عُمان',
  phone: '+968 24 556677',
  currencyCode: 'OMR',
  currencySymbolAr: 'ر.ع.',
  isTaxEnabled: true,
  taxRatePercent: 5.0,
  isTaxIncludedInPrice: true,
  receiptHeaderEn: 'Welcome to Muscat Grill & Burger Lounge',
  receiptHeaderAr: 'أهلاً بكم في مطعم ولاونج مسقط للمشاوي',
  receiptFooterEn: 'Thank you for your visit! Please pay at the counter.',
  receiptFooterAr: 'شكراً لزيارتكم الكريمة! يرجى الدفع عند الكاونتر.',
  defaultLanguage: 'en',
  idleTimeoutSeconds: 60,
  printerWidth: '80mm',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(defaultFallbackSettings);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/kiosk/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
