import React from 'react';
import logoImg from '../../assets/brand/logo.png';

interface LammaHubLogoProps {
  variant?: 'icon' | 'full' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  showTagline?: boolean;
  textScale?: number;
}

export const LammaHubLogoIcon: React.FC<{ sizePx?: number; className?: string }> = ({
  sizePx = 48,
  className = '',
}) => {
  return (
    <img
      src={logoImg}
      width={sizePx}
      height={sizePx}
      alt="RAKCHA GAME logo"
      className={`shrink-0 rounded-xl object-cover ${className}`}
      style={{ width: sizePx, height: sizePx }}
    />
  );
};

export const RakchaGameTextSvg: React.FC<{ className?: string; heightPx?: number; scale?: number }> = ({
  className = '',
  heightPx = 60,
  scale = 1,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <span
        style={{ fontSize: `${19 * scale}px`, lineHeight: `${20 * scale}px`, color: '#0b0a0a' }}
        className="font-black tracking-[0.2em] uppercase font-mono"
      >
        RAKCHA
      </span>
      <span
        style={{ fontSize: `${15 * scale}px`, lineHeight: `${19 * scale}px`, color: '#120ce5' }}
        className="font-black tracking-[0.5em] uppercase font-mono mt-0.5"
      >
        GAME
      </span>
    </div>
  );
};

export const LammaHubLogo: React.FC<LammaHubLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showTagline = false,
  textScale = 1,
}) => {
  // Size mappings
  const iconSizes: Record<string, number> = {
    xs: 20,
    sm: 28,
    md: 40,
    lg: 56,
    xl: 72,
    hero: 110,
  };

  const textHeights: Record<string, number> = {
    xs: 22,
    sm: 28,
    md: 36,
    lg: 48,
    xl: 60,
    hero: 84,
  };

  const px = iconSizes[size] || 40;
  const textH = textHeights[size] || 36;

  if (variant === 'icon') {
    return <LammaHubLogoIcon sizePx={px} className={className} />;
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] shadow-md p-3 ${className}`}
      >
        <LammaHubLogoIcon sizePx={px} />
      </div>
    );
  }

  const isHero = size === 'hero' || size === 'xl';

  return (
    <div
      className={`inline-flex ${
        isHero ? 'flex-col items-center gap-4' : 'items-center gap-3'
      } select-none ${className}`}
    >
      <LammaHubLogoIcon sizePx={px} />
      <div className={`flex flex-col ${isHero ? 'items-center text-center' : 'text-left'}`}>
        <RakchaGameTextSvg heightPx={textH} scale={textScale} />
        {showTagline && (
          <span
            className={`font-mono tracking-[0.3em] text-[#4C5055] dark:text-[#94A3B8] uppercase font-medium ${
              isHero ? 'text-[10px] sm:text-[11px] mt-2' : 'text-[8px] sm:text-[9px] mt-0.5'
            }`}
          >
            NO MORE BOREDOM • PLAY TOGETHER
          </span>
        )}
      </div>
    </div>
  );
};

