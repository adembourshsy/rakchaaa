import React from 'react';
import { Coins, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface EntryCostSelectorProps {
  selectedCost: number;
  onSelectCost: (cost: number) => void;
  disabled?: boolean;
}

export const ENTRY_COST_OPTIONS = [0, 30, 50, 100, 300];

export const EntryCostSelector: React.FC<EntryCostSelectorProps> = ({
  selectedCost,
  onSelectCost,
  disabled = false,
}) => {
  const { userProfile, setIsCoinsModalOpen, language, t } = useApp();
  const currentCoins = userProfile.coins ?? 300;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-medium text-[#4C5055] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
          <Coins size={14} strokeWidth={1.75} className="text-[#FF8F00]" />
          <span>{t('entryFeeLabel') || 'Entry Fee'}</span>
        </label>
        <span className="text-[11px] font-mono font-normal text-[#4C5055] dark:text-[#94A3B8]">
          {t('balanceLabel') ? t('balanceLabel').replace('{coins}', currentCoins.toString()) : `Balance: ${currentCoins}`}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {ENTRY_COST_OPTIONS.map((cost, idx) => {
          const isSelected = selectedCost === cost;
          const isAffordable = currentCoins >= cost;

          return (
            <button
              key={`cost-${cost}-${idx}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectCost(cost)}
              className={`p-2 rounded-[11px] text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                isSelected
                  ? 'bg-[#F0F6FF] dark:bg-[#1E273C] text-[#FF8F00] border-[#FF8F00] font-bold shadow-xs'
                  : 'bg-[#F4F8FC] dark:bg-[#1A2234] text-[#000000] dark:text-[#F8FAFC] border-[#D5E5F7] dark:border-[#222E46] hover:border-[#47A5FF] font-medium'
              } ${!isAffordable ? 'opacity-60' : ''}`}
            >
              <span className="text-xs font-mono font-semibold">
                {cost === 0 ? (t('freeLabel') || 'Free') : cost}
              </span>
              <span className="text-[9px] uppercase font-mono text-[#4C5055] dark:text-[#94A3B8]">
                {cost === 0 ? '0' : 'Coins'}
              </span>
            </button>
          );
        })}
      </div>

      {currentCoins < selectedCost && (
        <div className="flex items-center justify-between p-2 rounded-[10px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[11px] text-[#EF4444] font-mono">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} strokeWidth={1.75} className="shrink-0" />
            <span>
              {t('insufficientCoins') || 'Insufficient coins balance for this entry cost!'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCoinsModalOpen(true)}
            className="px-2 py-0.5 rounded-[6px] bg-[#FF8F00] text-black font-bold text-[10px] uppercase hover:bg-[#FFA726] transition-colors cursor-pointer shrink-0"
          >
            {t('getCoins') || 'Get Coins'}
          </button>
        </div>
      )}
    </div>
  );
};
