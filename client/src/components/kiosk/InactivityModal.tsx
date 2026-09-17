import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { sounds } from '../../utils/format';

interface InactivityModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onReset: () => void;
  countdownSeconds?: number;
}

export const InactivityModal: React.FC<InactivityModalProps> = ({
  isOpen,
  onContinue,
  onReset,
  countdownSeconds = 15,
}) => {
  const { t } = useLanguage();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(countdownSeconds);

  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(countdownSeconds);
      const timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onReset();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, countdownSeconds, onReset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500 flex items-center justify-center mb-4">
          <span className="text-xl font-bold font-mono text-amber-400">
            {secondsRemaining}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-1.5">
          {t('idleWarningTitle')}
        </h3>

        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          {t('idleWarningDesc')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onContinue();
            }}
            className="w-full h-11 rounded-lg bg-amber-500 hover:bg-amber-450 active:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider kiosk-tap transition-colors"
          >
            {t('idleContinue')}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onReset();
            }}
            className="w-full h-10 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white font-semibold text-xs border border-neutral-750 kiosk-tap transition-colors"
          >
            {t('idleReset')}
          </button>
        </div>
      </div>
    </div>
  );
};
