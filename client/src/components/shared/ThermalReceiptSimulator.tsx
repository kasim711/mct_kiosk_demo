import React, { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ThermalReceiptSimulatorProps {
  receiptPayload: any;
  onClose: () => void;
  isOpen: boolean;
}

export const ThermalReceiptSimulator: React.FC<ThermalReceiptSimulatorProps> = ({
  receiptPayload,
  onClose,
  isOpen,
}) => {
  const { t } = useLanguage();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receiptPayload) return null;

  const handleBrowserPrint = () => {
    window.print();
  };

  const lines = receiptPayload.formattedLines || [];
  const is58mm = receiptPayload.printerWidth === '58mm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-sm max-h-[92vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-950 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {receiptPayload.printerWidth || '80mm'} Thermal Receipt
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Receipt Display Area */}
        <div className="flex-1 overflow-y-auto p-5 flex justify-center bg-neutral-950">
          <div
            ref={printAreaRef}
            id="thermal-print-area"
            className={`animate-receipt-feed bg-neutral-100 text-neutral-900 p-4 shadow-md font-mono transition-all ${
              is58mm ? 'w-[260px] text-[10px]' : 'w-[320px] text-[11px]'
            }`}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              lineHeight: '1.28',
            }}
          >
            {/* Monospace receipt text lines */}
            <div className="whitespace-pre-wrap select-text leading-tight">
              {lines.map((line: string, idx: number) => {
                const isHeading = line.includes('ORDER #') || line.includes('TOTAL DUE:');
                const isWarning = line.includes('PENDING PAYMENT') || line.includes('PLEASE TAKE THIS RECEIPT');

                return (
                  <div
                    key={idx}
                    className={`${isHeading ? 'font-bold' : ''} ${
                      isWarning ? 'font-bold bg-neutral-200/80 px-1 my-0.5' : ''
                    } ${line.includes('===') || line.includes('---') ? 'text-neutral-500' : ''}`}
                  >
                    {line}
                  </div>
                );
              })}
            </div>

            {/* Subtle tear cut line */}
            <div className="mt-4 pt-3 border-t border-dashed border-neutral-400 text-center text-[9px] text-neutral-500">
              - - - - - - - - - - - - - - - -
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
          <button
            onClick={handleBrowserPrint}
            className="flex-1 h-10 px-4 bg-amber-500 hover:bg-amber-450 active:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{t('printReceipt')}</span>
          </button>

          <button
            onClick={onClose}
            className="h-10 px-4 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs rounded-lg border border-neutral-750 transition-colors"
          >
            {t('back')}
          </button>
        </div>
      </div>
    </div>
  );
};
