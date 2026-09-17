import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Delete, KeyRound, User, ChefHat, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { sounds } from '../utils/format';
import { LanguageToggle } from '../components/shared/LanguageToggle';

export const LoginPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState<string>('');
  const [username, setUsername] = useState<string>('cashier1');
  const [password, setPassword] = useState<string>('cashier123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handlePinPress = (digit: string) => {
    sounds.playTap();
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  };

  const submitPin = async (pinValue: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Invalid PIN');
      }

      const data = await res.json();
      sounds.playSuccess();
      localStorage.setItem('pos_token', data.token);
      localStorage.setItem('pos_user', JSON.stringify(data.user));

      if (data.user.role === 'KITCHEN') {
        navigate('/kitchen');
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/staff');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }

      const data = await res.json();
      sounds.playSuccess();
      localStorage.setItem('pos_token', data.token);
      localStorage.setItem('pos_user', JSON.stringify(data.user));

      if (data.user.role === 'KITCHEN') {
        navigate('/kitchen');
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/staff');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/kiosk')}
          className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white py-2 px-3 rounded-lg bg-neutral-900 border border-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>Go to Customer Kiosk</span>
        </button>

        <LanguageToggle size="sm" />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-3">
          <ChefHat className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-1">
          {t('staffLogin')}
        </h2>
        <p className="text-xs text-neutral-400 text-center mb-5">
          Muscat Commercial Restaurant POS Terminal
        </p>

        {/* Tab switch between PIN and Username/Password */}
        <div className="grid grid-cols-2 p-1 bg-neutral-900 border border-neutral-800 rounded-lg w-full mb-5">
          <button
            onClick={() => {
              sounds.playTap();
              setMode('pin');
              setPin('');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-md font-semibold text-xs transition-all ${
              mode === 'pin'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t('quickPinLogin')}
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setMode('password');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-md font-semibold text-xs transition-all ${
              mode === 'password'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Password
          </button>
        </div>

        {/* PIN MODE */}
        {mode === 'pin' && (
          <div className="w-full flex flex-col items-center">
            {/* PIN Dots Display */}
            <div className="flex items-center gap-3.5 mb-5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    pin.length > idx
                      ? 'bg-amber-500 border-amber-500 shadow-sm'
                      : 'border-neutral-700 bg-neutral-900'
                  }`}
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-400 mb-3 text-center">
                {errorMsg}
              </p>
            )}

            {/* Numeric Touchpad */}
            <div className="grid grid-cols-3 gap-2.5 w-full mb-5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinPress(digit)}
                  className="h-14 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-white font-bold text-xl border border-neutral-800 active:scale-95 flex items-center justify-center font-mono transition-transform"
                >
                  {digit}
                </button>
              ))}

              <div />

              <button
                onClick={() => handlePinPress('0')}
                className="h-14 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-white font-bold text-xl border border-neutral-800 active:scale-95 flex items-center justify-center font-mono transition-transform"
              >
                0
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setPin(pin.slice(0, -1));
                }}
                className="h-14 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-amber-500 border border-neutral-800 active:scale-95 flex items-center justify-center transition-transform"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* PASSWORD MODE */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="w-full space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                {t('username')}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                {t('password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-400">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : t('login')}
            </button>
          </form>
        )}

        {/* Quick Demo Credentials Assistant */}
        <div className="mt-6 p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 w-full space-y-1">
          <p className="font-bold text-amber-400 text-xs mb-1">Quick Demo Credentials:</p>
          <p>
            • <strong>Cashier Counter:</strong> PIN <code className="text-white font-mono font-bold">1111</code> (or user: cashier1 / cashier123)
          </p>
          <p>
            • <strong>Kitchen KDS:</strong> PIN <code className="text-white font-mono font-bold">2222</code> (or user: kitchen1 / kitchen123)
          </p>
          <p>
            • <strong>Admin Manager:</strong> PIN <code className="text-white font-mono font-bold">1234</code> (or user: admin / admin123)
          </p>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-600">
        Touchscreen Self-Order POS & Kiosk • Muscat, Sultanate of Oman
      </div>
    </div>
  );
};
