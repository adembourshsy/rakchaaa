import React from 'react';
import { Trophy, Shield, Crown } from 'lucide-react';
import { AvatarFrameRing } from './AvatarFrameRing';
import { getAvatarUrl } from '../../data/mockData';

interface PlayerAvatarBadgeProps {
  avatarUrl: string;
  name: string;
  wins?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRankIcon?: boolean;
  equippedFrame?: string | null;
  rankPosition?: 'right' | 'left';
}

export function getPlayerRank(wins: number = 0): {
  tier: 'none' | 'starter' | 'advanced' | 'pro';
  title: string;
  colorClass: string;
  ringClass: string;
  badgeBg: string;
  borderColor: string;
} {
  if (wins >= 1000) {
    return {
      tier: 'pro',
      title: 'PRO Rank',
      colorClass: 'text-[#FF8F00]',
      ringClass: 'ring-2 ring-[#FF8F00] shadow-sm',
      badgeBg: 'bg-[#FF8F00] text-white',
      borderColor: '#FF8F00',
    };
  }
  if (wins >= 100) {
    return {
      tier: 'advanced',
      title: 'Advanced Rank',
      colorClass: 'text-[#47A5FF]',
      ringClass: 'ring-2 ring-[#47A5FF] shadow-sm',
      badgeBg: 'bg-[#47A5FF] text-white',
      borderColor: '#47A5FF',
    };
  }
  if (wins >= 10) {
    return {
      tier: 'starter',
      title: 'Starter Rank',
      colorClass: 'text-[#10B981]',
      ringClass: 'ring-1.5 ring-[#10B981]',
      badgeBg: 'bg-[#10B981] text-white',
      borderColor: '#10B981',
    };
  }
  return {
    tier: 'none',
    title: 'Newcomer',
    colorClass: 'text-[#4C5055]',
    ringClass: 'ring-1 ring-[#D5E5F7]',
    badgeBg: 'bg-[#F0F6FF] text-[#4C5055]',
    borderColor: '#D5E5F7',
  };
}

export const PlayerAvatarBadge: React.FC<PlayerAvatarBadgeProps> = ({
  avatarUrl,
  name,
  wins = 0,
  size = 'md',
  className = '',
  showRankIcon = false,
  equippedFrame,
  rankPosition = 'right',
}) => {
  const rank = getPlayerRank(wins);

  const iconSizes = {
    sm: 10,
    md: 13,
    lg: 15,
    xl: 20,
  }[size];

  const badgePositionClass = rankPosition === 'left' ? '-bottom-0.5 -left-0.5' : '-bottom-0.5 -right-0.5';

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Avatar Container with Animated Frame Ring */}
      <AvatarFrameRing frameId="default" size={size}>
        <img
          src={getAvatarUrl(avatarUrl, name)}
          alt={name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'player')}`;
          }}
        />
      </AvatarFrameRing>
    </div>
  );
};

