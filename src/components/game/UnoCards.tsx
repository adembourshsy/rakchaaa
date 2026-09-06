import React from 'react';

// Types for UNO Game
export interface UnoCard {
  id: string;
  color: 'red' | 'yellow' | 'green' | 'blue' | 'wild';
  value: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';
}

// ==========================================
// PREMIUM CLASSIC-STYLE FRONT CARD FACE COMPONENT
// ==========================================
export const UnoCardFront: React.FC<{
  card: UnoCard;
  playable?: boolean;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}> = React.memo(({ card, playable = false, onClick, className = '', compact = false }) => {
  // Rich official card backgrounds matching reference image
  const bgColors = {
    red: 'from-[#EF233C] to-[#D90429] border-white text-white',
    yellow: 'from-[#FFD166] to-[#FFB703] border-white text-[#111111]',
    green: 'from-[#06D6A0] to-[#049669] border-white text-white',
    blue: 'from-[#118AB2] to-[#0077B6] border-white text-white',
    wild: 'from-[#212529] via-[#343A40] to-[#0D0E15] border-white text-white',
  }[card.color];

  // Corner values renderer
  const renderCornerValue = (val: string) => {
    switch (val) {
      case 'skip': return '🚫';
      case 'reverse': return '🔄';
      case 'draw2': return '+2';
      case 'wild': return 'W';
      case 'wild4': return '+4';
      case '6':
      case '9':
        return (
          <div className="flex flex-col items-center justify-center leading-none">
            <span className="text-xs font-black italic font-sans">{val}</span>
            <div className="w-2.5 h-[2px] bg-current rounded-full mt-[0.5px]" />
          </div>
        );
      default:
        return val;
    }
  };

  const renderCenterSymbol = () => {
    switch (card.value) {
      case 'skip':
        return (
          <svg viewBox="0 0 100 100" className={compact ? 'w-5 h-5' : 'w-10 sm:w-12 h-10 sm:h-12'} fill="none" stroke="currentColor" strokeWidth="12">
            <circle cx="50" cy="50" r="38" className="stroke-[#DC2626]" />
            <line x1="23" y1="23" x2="77" y2="77" className="stroke-[#DC2626]" />
          </svg>
        );
      case 'reverse':
        return (
          <div className={compact ? 'text-base font-black text-[#1E3A8A]' : 'text-2xl sm:text-3xl font-black text-[#1E3A8A]'}>
            🔄
          </div>
        );
      case 'draw2':
        return (
          <div className={`relative flex items-center justify-center ${compact ? 'w-5 h-5' : 'w-10 sm:w-12 h-10 sm:h-12'}`}>
            <div className={`absolute rounded bg-[#1D4ED8] border-2 border-white shadow-sm rotate-[-12deg] -translate-x-1 flex items-center justify-center font-black text-white ${compact ? 'w-2.5 h-4 text-[5px]' : 'w-5 h-8 text-[10px]'}`}>
              +2
            </div>
            <div className={`absolute rounded bg-[#DC2626] border-2 border-white shadow-sm rotate-[12deg] translate-x-1 flex items-center justify-center font-black text-white ${compact ? 'w-2.5 h-4 text-[5px]' : 'w-5 h-8 text-[10px]'}`}>
              +2
            </div>
          </div>
        );
      case 'wild':
        return (
          <div className={`rounded-full border-2 border-white shadow-md grid grid-cols-2 overflow-hidden ${compact ? 'w-5 h-5' : 'w-10 sm:w-12 h-10 sm:h-12'}`}>
            <div className="bg-[#EF233C]" />
            <div className="bg-[#118AB2]" />
            <div className="bg-[#06D6A0]" />
            <div className="bg-[#FFD166]" />
          </div>
        );
      case 'wild4':
        return (
          <div className={`relative flex items-center justify-center ${compact ? 'w-5 h-5' : 'w-10 sm:w-12 h-10 sm:h-12'}`}>
            <div className={`absolute rounded bg-[#118AB2] border border-white rotate-[-20deg] -translate-x-2 ${compact ? 'w-2 h-3.5' : 'w-4 h-7'}`} />
            <div className={`absolute rounded bg-[#06D6A0] border border-white rotate-[-8deg] -translate-x-0.5 ${compact ? 'w-2 h-3.5' : 'w-4 h-7'}`} />
            <div className={`absolute rounded bg-[#FFD166] border border-white rotate-[8deg] translate-x-0.5 ${compact ? 'w-2 h-3.5' : 'w-4 h-7'}`} />
            <div className={`absolute rounded bg-[#EF233C] border border-white rotate-[20deg] translate-x-2 ${compact ? 'w-2 h-3.5' : 'w-4 h-7'}`} />
            <span className={`relative z-10 bg-black text-[#FACC15] font-extrabold rounded-full border border-white/40 shadow-md ${compact ? 'text-[6px] px-0.5 py-0' : 'text-[10px] sm:text-[11px] px-1.5 py-0.5'}`}>
              +4
            </span>
          </div>
        );
      case '6':
      case '9':
        return (
          <div className="flex flex-col items-center justify-center leading-none">
            <span className={`font-black italic tracking-tighter text-[#0A0A0C] font-sans drop-shadow-xs ${compact ? 'text-sm' : 'text-3xl sm:text-4xl'}`}>
              {card.value}
            </span>
            <div className={`bg-[#0A0A0C] rounded-full mt-0.5 ${compact ? 'w-2.5 h-0.5' : 'w-6 h-1'}`} />
          </div>
        );
      default:
        return (
          <span className={`font-black italic tracking-tighter text-[#0A0A0C] font-sans drop-shadow-xs select-none ${compact ? 'text-sm' : 'text-3xl sm:text-5xl'}`}>
            {card.value}
          </span>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative aspect-[2/3] bg-gradient-to-br shadow-md overflow-hidden flex flex-col justify-between select-none transition-all duration-200 ${
        compact ? 'rounded-[12px] border-2 p-0.5' : 'rounded-[20px] sm:rounded-[24px] border-[3px] sm:border-[4px] p-1.5'
      } ${bgColors} ${
        playable
          ? 'cursor-pointer border-white ring-2 sm:ring-[3px] ring-amber-300 shadow-[0_0_18px_rgba(253,224,71,0.65)] -translate-y-3 z-30'
          : 'border-white/90'
      } ${className}`}
    >
      {/* Top Left Corner Indicator */}
      <div className="flex flex-col items-center justify-center self-start leading-none -mt-0.5 -ml-0.5">
        <span className={`font-black font-sans tracking-tighter ${compact ? 'text-[6px]' : 'text-[10px] sm:text-xs'}`}>
          {renderCornerValue(card.value)}
        </span>
      </div>

      {/* Tilted White Oval Center Badge */}
      <div className="absolute inset-x-0 h-[66%] top-[17%] overflow-hidden pointer-events-none">
        <div className="absolute w-[125%] h-full left-[-12.5%] bg-white rounded-[50%] rotate-[-18deg] shadow-inner flex items-center justify-center border-y border-neutral-200">
          <div className="rotate-[18deg] flex items-center justify-center w-full h-full">
            {renderCenterSymbol()}
          </div>
        </div>
      </div>

      {/* Bottom Right Inverted Corner Indicator */}
      <div className="flex flex-col items-center justify-center self-end leading-none rotate-180 -mb-0.5 -mr-0.5">
        <span className={`font-black font-sans tracking-tighter ${compact ? 'text-[6px]' : 'text-[10px] sm:text-xs'}`}>
          {renderCornerValue(card.value)}
        </span>
      </div>
    </div>
  );
});

// ==========================================
// PREMIUM CUSTOM CARD-BACK COMPONENT
// ==========================================
export const UnoCardBack: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}> = React.memo(({ onClick, disabled = false, className = '', compact = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative aspect-[2/3] overflow-hidden transition-all flex items-center justify-center select-none border-white bg-[#0A0A0C] shadow-lg ${
        compact ? 'rounded-[8px] border-2' : 'rounded-[14px] sm:rounded-[18px] border-[3px] sm:border-[4px]'
      } ${
        disabled
          ? 'cursor-not-allowed opacity-80'
          : 'hover:scale-105 active:scale-95 cursor-pointer shadow-xl'
      } ${className}`}
    >
      {/* Tilted Red Oval Center Badge */}
      <div className="w-[88%] h-[54%] bg-gradient-to-tr from-[#DC2626] via-[#EF4444] to-[#F87171] border-2 border-white rounded-[50%] rotate-[-18deg] shadow-md flex items-center justify-center">
        <span className={`rotate-[18deg] text-[#FACC15] font-black italic tracking-tighter font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none ${compact ? 'text-[7px]' : 'text-xs sm:text-base'}`}>
          UNO
        </span>
      </div>
    </button>
  );
});
