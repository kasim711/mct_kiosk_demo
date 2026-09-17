import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { sounds } from '../../utils/format';

interface LanguageToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '', size = 'md' }) => {
  const { language, setLanguage } = useLanguage();

  const handleToggle = () => {
    sounds.playTap();
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const sizeClasses = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs';

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 rounded-lg border border-neutral-750 bg-neutral-900 hover:bg-neutral-850 active:bg-neutral-800 text-neutral-200 font-semibold tracking-wide transition-colors kiosk-tap ${sizeClasses} ${className}`}
      title="Switch Language / تغيير اللغة"
    >
      <Globe className="w-4 h-4 text-neutral-400" />
      <span>{language === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
};
