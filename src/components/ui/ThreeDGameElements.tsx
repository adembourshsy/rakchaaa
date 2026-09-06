import React from 'react';
import { motion } from 'motion/react';

/* ============================================================================
 * 1. 3D FLOATING CARD COMPONENT
 * ============================================================================ */
interface Floating3DCardProps {
  title?: string;
  category?: string;
  symbol?: string;
  badge?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Floating3DCard: React.FC<Floating3DCardProps> = ({
  title = 'RAKCHA',
  category = 'CARD',
  symbol = '♠',
  badge,
  size = 'md',
  className = '',
}) => {
  const dimensions = {
    sm: 'w-20 h-28 text-[9px]',
    md: 'w-28 h-36 text-xs',
    lg: 'w-36 h-48 text-sm',
  }[size];

  return (
    <div
      className={`relative select-none perspective-800 ${dimensions} ${className}`}
    >
      {/* 3D Depth Back Drop Shadow */}
      <div className="absolute inset-0 rounded-2xl bg-[#352208]/30 border border-[#E1BB80]/20 translate-y-1.5 translate-x-1" />

      {/* Main 3D Card Body */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#352208] via-[#463013] to-[#251704] border-2 border-[#E1BB80] p-2 sm:p-3 flex flex-col justify-between text-[#FFF5E6] shadow-md overflow-hidden transform-gpu"
      >
        {/* Metallic Bevel Inner Frame Line */}
        <div className="absolute inset-1.5 rounded-xl border border-dashed border-[#E1BB80]/30 pointer-events-none" />

        {/* Diagonal Specular Sheen */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-md pointer-events-none" />

        {/* Top Header Corner */}
        <div className="flex justify-between items-start relative z-10">
          <div className="font-mono font-bold leading-none text-[#E1BB80]">
            <div className="text-sm sm:text-base">{symbol}</div>
            <div className="text-[7px] uppercase tracking-wider opacity-80">{category.substring(0, 3)}</div>
          </div>
          {badge && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#E1BB80] text-[#352208] text-[7px] font-mono font-black uppercase tracking-wider shadow-xs">
              {badge}
            </span>
          )}
        </div>

        {/* Center Emblem */}
        <div className="my-auto text-center space-y-0.5 relative z-10">
          <div className="text-xl sm:text-2xl font-black text-[#E1BB80] drop-shadow-md">
            {symbol}
          </div>
          <div className="font-mono font-bold uppercase tracking-wider text-[#FFF5E6] line-clamp-1 opacity-90">
            {title}
          </div>
        </div>

        {/* Bottom Corner Inverted Value */}
        <div className="flex justify-end items-end rotate-180 relative z-10">
          <div className="font-mono font-bold leading-none text-[#E1BB80]">
            <div className="text-xs sm:text-sm">{symbol}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


/* ============================================================================
 * 2. 3D GAME TOKEN / COIN COMPONENT
 * ============================================================================ */
interface ThreeDTokenProps {
  label?: string;
  size?: number;
  className?: string;
}

export const ThreeDToken: React.FC<ThreeDTokenProps> = ({
  label = 'RAKCHA',
  size = 48,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full select-none transform-gpu ${className}`}
    >
      {/* 3D Edge Bevel Ring */}
      <div
        className="w-full h-full rounded-full bg-gradient-to-tr from-[#352208] via-[#E1BB80] to-[#FFF5E6] p-[3px] shadow-sm"
      >
        {/* Inner Coin Face */}
        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#463013] via-[#352208] to-[#251704] border border-[#E1BB80]/60 flex items-center justify-center p-1 relative overflow-hidden">
          {/* Inner Coin Ridge Circle */}
          <div className="absolute inset-1 rounded-full border border-dashed border-[#E1BB80]/40 pointer-events-none" />

          {/* Center Symbol/Text */}
          <span className="text-[#E1BB80] font-mono font-black text-[9px] sm:text-[10px] tracking-wider uppercase drop-shadow-sm text-center leading-tight">
            {label.substring(0, 4)}
          </span>
        </div>
      </div>
    </div>
  );
};


/* ============================================================================
 * 3. 3D DICE ELEMENT COMPONENT
 * ============================================================================ */
interface ThreeDDiceProps {
  value?: number;
  size?: number;
  className?: string;
}

export const ThreeDDice: React.FC<ThreeDDiceProps> = ({
  size = 40,
  className = '',
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
      }}
      className={`relative rounded-xl bg-gradient-to-br from-[#463013] via-[#352208] to-[#251704] border-2 border-[#E1BB80] p-1.5 shadow-sm flex items-center justify-center select-none transform-gpu ${className}`}
    >
      {/* 5 Pip Dice Face Pattern */}
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5 items-center justify-items-center">
        <div className="w-1.5 h-1.5 rounded-full bg-[#E1BB80]" />
        <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#E1BB80]" />

        <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
        <div className="w-2 h-2 rounded-full bg-[#FFF5E6]" />
        <div className="w-1.5 h-1.5 rounded-full bg-transparent" />

        <div className="w-1.5 h-1.5 rounded-full bg-[#E1BB80]" />
        <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#E1BB80]" />
      </div>
    </div>
  );
};


/* ============================================================================
 * 4. 3D FAN DECK COMPONENT
 * ============================================================================ */
export const ThreeDDeckFan: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-28 h-20 select-none flex items-center justify-center ${className}`}>
      {/* Left Angled Card */}
      <div
        className="absolute w-14 h-20 rounded-xl bg-[#352208] border border-[#E1BB80]/50 p-1 shadow-xs flex items-center justify-center text-[#E1BB80] font-mono text-[9px] font-bold -rotate-12 -translate-x-3"
      >
        ♠ 7
      </div>

      {/* Center Top Card */}
      <div
        className="absolute w-14 h-20 rounded-xl bg-gradient-to-br from-[#463013] to-[#352208] border-2 border-[#E1BB80] p-1 shadow-md flex flex-col justify-between text-[#FFF5E6] z-10"
      >
        <span className="text-[8px] font-mono font-bold text-[#E1BB80]">◆</span>
        <span className="text-center text-[9px] font-mono font-black text-[#E1BB80]">A</span>
        <span className="text-right text-[8px] font-mono font-bold text-[#E1BB80]">◆</span>
      </div>

      {/* Right Angled Card */}
      <div
        className="absolute w-14 h-20 rounded-xl bg-[#352208] border border-[#E1BB80]/50 p-1 shadow-xs flex items-center justify-center text-[#E1BB80] font-mono text-[9px] font-bold rotate-12 translate-x-3"
      >
        ♥ K
      </div>
    </div>
  );
};
