import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { SettingsProvider } from './context/SettingsContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';

import { KioskPage } from './pages/KioskPage';
import { StaffPage } from './pages/StaffPage';
import { KitchenPage } from './pages/KitchenPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  return (
    <LanguageProvider>
      <SettingsProvider>
        <SocketProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                {/* Default redirect to Customer Touchscreen Kiosk */}
                <Route path="/" element={<Navigate to="/kiosk" replace />} />
                
                {/* Customer Touchscreen Kiosk */}
                <Route path="/kiosk" element={<KioskPage />} />

                {/* Staff / Cashier Counter POS */}
                <Route path="/staff" element={<StaffPage />} />

                {/* Kitchen Display System (KDS) */}
                <Route path="/kitchen" element={<KitchenPage />} />

                {/* Admin Management Dashboard */}
                <Route path="/admin" element={<AdminPage />} />

                {/* Staff & Admin Login */}
                <Route path="/login" element={<LoginPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/kiosk" replace />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </SocketProvider>
      </SettingsProvider>
    </LanguageProvider>
  );
}

export default App;
