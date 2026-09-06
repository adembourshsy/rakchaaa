import React from 'react';
import { getAvatarFrameById } from '../../data/avatarFrames';

export interface AvatarFrameRingProps {
  frameId?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  children?: React.ReactNode;
  showCrown?: boolean;
}

export const AvatarFrameRing: React.FC<AvatarFrameRingProps> = ({
  frameId = 'default',
  size = 'md',
  className = '',
  children,
  showCrown = false,
}) => {
  const frame = getAvatarFrameById(frameId);

  // Container dimensions
  const dimensions = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  }[size];

  // Dynamic crown/accent badge positioning and scaling
  const crownBadgeClass = {
    xs: 'text-[8px] -top-1.5',
    sm: 'text-[9px] -top-2',
    md: 'text-xs -top-2.5',
    lg: 'text-sm -top-3',
    xl: 'text-base -top-3.5',
    '2xl': 'text-lg -top-4',
  }[size];

  // Specific Frame Renderers
  const renderFrameAura = () => {
    switch (frame.id) {
      case 'fire_blaze':
        return (
          <>
            {/* Blazing Conic Spinning Flame Layer */}
            <div
              className="absolute -inset-1 rounded-full anim-spin-slow opacity-90 blur-[1px] pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, #FF4500, #FFA500, #FF0000, #FF8C00, #FFD700, #FF4500)',
              }}
            />
            {/* Pulsing Ember Glow */}
            <div
              className="absolute -inset-0.5 rounded-full anim-flame-flicker pointer-events-none"
              style={{
                boxShadow: '0 0 10px #FF4500, inset 0 0 6px #FF8C00',
                border: '2px solid #FF7700',
              }}
            />
            {/* Top Flame Sparkle */}
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_6px_#FF4500] animate-bounce`}>
                🔥
              </span>
            )}
          </>
        );

      case 'ice_frost':
        return (
          <>
            {/* Sub-Zero Crystalline Rotating Ring */}
            <div
              className="absolute -inset-1 rounded-full anim-spin-reverse opacity-90 blur-[0.5px] pointer-events-none"
              style={{
                background: 'conic-gradient(from 180deg, #00E5FF, #E0F2FE, #38BDF8, #7DD3FC, #0284C7, #00E5FF)',
              }}
            />
            {/* Glacial Frost Shimmer */}
            <div
              className="absolute -inset-0.5 rounded-full anim-frost-shimmer pointer-events-none"
              style={{
                boxShadow: '0 0 10px #00E5FF, inset 0 0 6px #38BDF8',
                border: '2px solid #7DD3FC',
              }}
            />
            {/* Top Ice Flake */}
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_6px_#00E5FF]`}>
                ❄️
              </span>
            )}
          </>
        );

      case 'water_wave':
        return (
          <>
            {/* Swirling Deep Ocean Wave Ring */}
            <div
              className="absolute -inset-1 rounded-full anim-spin-slow opacity-85 blur-[0.5px] pointer-events-none"
              style={{
                background: 'conic-gradient(from 90deg, #0284C7, #38BDF8, #0EA5E9, #0369A1, #38BDF8, #0284C7)',
              }}
            />
            <div
              className="absolute -inset-0.5 rounded-full anim-water-ripple pointer-events-none"
              style={{
                boxShadow: '0 0 10px #0EA5E9, inset 0 0 5px #38BDF8',
                border: '2px solid #38BDF8',
              }}
            />
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_6px_#0284C7]`}>
                🌊
              </span>
            )}
          </>
        );

      case 'electric_storm':
        return (
          <>
            {/* High Voltage Electric Pulse */}
            <div
              className="absolute -inset-1 rounded-full anim-spin-slow opacity-90 pointer-events-none"
              style={{
                background: 'conic-gradient(from 45deg, #FACC15, #FEF08A, #CA8A04, #FDE047, #EAB308, #FACC15)',
              }}
            />
            <div
              className="absolute -inset-0.5 rounded-full anim-pulse-glow pointer-events-none"
              style={{
                boxShadow: '0 0 12px #FACC15, inset 0 0 6px #FEF08A',
                border: '2px dashed #FEF08A',
              }}
            />
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_8px_#FACC15]`}>
                ⚡
              </span>
            )}
          </>
        );

      case 'golden_royalty':
        return (
          <>
            {/* 24K Royal Shimmering Gold Halo */}
            <div
              className="absolute -inset-1 rounded-full anim-spin-slow opacity-95 pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, #FFD700, #FFFBEB, #D97706, #F59E0B, #FDE047, #FFD700)',
              }}
            />
            <div
              className="absolute -inset-0.5 rounded-full anim-gold-radiance pointer-events-none"
              style={{
                boxShadow: '0 0 12px #FFD700, inset 0 0 6px #FDE047',
                border: '2px solid #FDE047',
              }}
            />
            {/* Crown Topper */}
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_8px_#FFD700]`}>
                👑
              </span>
            )}
          </>
        );

      case 'cyber_neon':
        return (
          <>
            {/* Cyberpunk Laser Cyan & Neon Magenta */}
            <div
              className="absolute -inset-1 rounded-full anim-spin-slow opacity-90 pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, #EC4899, #06B6D4, #8B5CF6, #06B6D4, #EC4899)',
              }}
            />
            <div
              className="absolute -inset-0.5 rounded-full anim-pulse-glow pointer-events-none"
              style={{
                boxShadow: '0 0 10px #EC4899, 0 0 16px #06B6D4',
                border: '2px solid #06B6D4',
              }}
            />
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_6px_#EC4899]`}>
                ✨
              </span>
            )}
          </>
        );

      case 'cosmic_galaxy':
        return (
          <>
            {/* Deep Space Swirling Nebula */}
            <div
              className="absolute -inset-1 rounded-full anim-spin-reverse opacity-90 pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, #8B5CF6, #C084FC, #4338CA, #A855F7, #6366F1, #8B5CF6)',
              }}
            />
            <div
              className="absolute -inset-0.5 rounded-full anim-cosmic-shimmer pointer-events-none"
              style={{
                boxShadow: '0 0 12px #8B5CF6, inset 0 0 6px #C084FC',
                border: '2px solid #C084FC',
              }}
            />
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_8px_#A855F7]`}>
                🌌
              </span>
            )}
          </>
        );

      case 'toxic_emerald':
        return (
          <>
            {/* Radioactive Toxic Green Ring */}
            <div
              className="absolute -inset-1 rounded-full anim-spin-slow opacity-90 pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, #10B981, #86EFAC, #047857, #22C55E, #10B981)',
              }}
            />
            <div
              className="absolute -inset-0.5 rounded-full anim-pulse-glow pointer-events-none"
              style={{
                boxShadow: '0 0 10px #10B981, inset 0 0 5px #86EFAC',
                border: '2px solid #86EFAC',
              }}
            />
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_6px_#10B981]`}>
                ☣️
              </span>
            )}
          </>
        );

      case 'blood_crimson':
        return (
          <>
            {/* Blood Ruby Demon Aura */}
            <div
              className="absolute -inset-1 rounded-full anim-spin-slow opacity-90 pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, #EF4444, #7F1D1D, #DC2626, #991B1B, #EF4444)',
              }}
            />
            <div
              className="absolute -inset-0.5 rounded-full anim-flame-flicker pointer-events-none"
              style={{
                boxShadow: '0 0 12px #DC2626, inset 0 0 6px #EF4444',
                border: '2px solid #EF4444',
              }}
            />
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_6px_#DC2626]`}>
                🩸
              </span>
            )}
          </>
        );

      case 'diamond_mythic':
        return (
          <>
            {/* Astral Mythic Diamond Shimmer */}
            <div
              className="absolute -inset-1.5 rounded-full anim-spin-slow opacity-95 pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, #60A5FA, #FFFFFF, #93C5FD, #E0F2FE, #38BDF8, #60A5FA)',
              }}
            />
            <div
              className="absolute -inset-0.5 rounded-full anim-diamond-glitz pointer-events-none"
              style={{
                boxShadow: '0 0 14px #93C5FD, inset 0 0 8px #FFFFFF',
                border: '2px solid #FFFFFF',
              }}
            />
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_10px_#60A5FA]`}>
                💎
              </span>
            )}
          </>
        );

      case 'rainbow_prism':
        return (
          <>
            {/* Smooth 360° RGB Rainbow Prism */}
            <div
              className="absolute -inset-1 rounded-full anim-spin-slow opacity-95 pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #8B00FF, #FF0000)',
              }}
            />
            <div
              className="absolute -inset-0.5 rounded-full anim-pulse-glow pointer-events-none"
              style={{
                boxShadow: '0 0 12px rgba(255, 105, 180, 0.7)',
                border: '1.5px solid rgba(255, 255, 255, 0.8)',
              }}
            />
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_8px_#FF69B4]`}>
                🌈
              </span>
            )}
          </>
        );

      case 'sakura_bloom':
        return (
          <>
            {/* Blooming Pastel Pink Sakura Ring */}
            <div
              className="absolute -inset-1 rounded-full anim-spin-slow opacity-85 pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, #F472B6, #FCE7F3, #FB7185, #F43F5E, #F472B6)',
              }}
            />
            <div
              className="absolute -inset-0.5 rounded-full anim-pulse-glow pointer-events-none"
              style={{
                boxShadow: '0 0 10px #F472B6, inset 0 0 6px #FCE7F3',
                border: '2px solid #FB7185',
              }}
            />
            {showCrown && (
              <span className={`absolute left-1/2 -translate-x-1/2 ${crownBadgeClass} select-none pointer-events-none drop-shadow-[0_0_6px_#F472B6]`}>
                🌸
              </span>
            )}
          </>
        );

      default:
        // Default clean border
        return (
          <div
            className="absolute -inset-0.5 rounded-full border-2 border-[#D5E5F7] dark:border-[#334155] pointer-events-none"
          />
        );
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${dimensions} ${className}`}>
      {/* Default clean border */}
      <div
        className="absolute -inset-0.5 rounded-full border-2 border-[#D5E5F7] dark:border-[#334155] pointer-events-none"
      />

      {/* Internal Avatar Content (Rounded Circular Mask with clean border frame) */}
      <div className="relative w-full h-full rounded-full overflow-hidden z-10 bg-white dark:bg-[#0F172A] p-[2px] shadow-xs flex items-center justify-center">
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
};
