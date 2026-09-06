import React, { useRef, useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Crown, LayoutGrid, Rows } from 'lucide-react';
import { RoomPlayer } from '../../types';
import { getAvatarUrl, DEFAULT_AVATAR } from '../../data/mockData';
import { AvatarFrameRing } from '../ui/AvatarFrameRing';

interface InGamePlayerDisplayProps {
  players: RoomPlayer[];
  activePlayerIndex: number;
  activePlayerId?: string;
  shieldsMap: Record<string, number>;
  currentUserId: string;
}

// Sub-component for individual player avatar item, memoized for zero-lag rendering
const PlayerAvatarItem = memo<{
  player: RoomPlayer;
  idx: number;
  isActive: boolean;
  shields: number;
  isMe: boolean;
  layoutMode: 'strip' | 'grid';
}>(({ player, idx, isActive, shields, isMe, layoutMode }) => {
  const avatarSrc = getAvatarUrl(player.avatarUrl);
  const displayName = isMe ? 'You' : player.name || player.username.replace('@', '');
  const displayUsername = player.username || `@${displayName.toLowerCase().replace(/\s+/g, '')}`;

  if (layoutMode === 'grid') {
    return (
      <div
        className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl border transition-all relative overflow-hidden select-none ${
          isActive
            ? 'bg-gradient-to-r from-[#FF8600]/20 via-[#FF8600]/10 to-transparent border-[#FF8600] shadow-md shadow-[#FF8600]/15'
            : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
        }`}
      >
        <div className="relative shrink-0">
          {isActive && (
            <span className="absolute -inset-1 rounded-full bg-[#FF8600] animate-pulse blur-[3px] opacity-80" />
          )}
          <AvatarFrameRing
            frameId={player.equippedFrame || 'default'}
            size="sm"
            showCrown={false}
            className={isActive ? 'scale-105' : 'opacity-90'}
          >
            <img loading="lazy" decoding="async" src={avatarSrc}
              alt={player.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
            />
          </AvatarFrameRing>

          {player.isHost && (
            <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-[#E1BB80] text-[#352208] ring-1 ring-white dark:ring-[#352208]">
              <Crown size={8} />
            </span>
          )}

          {shields > 0 && (
            <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full bg-[#10B981] text-white ring-1 ring-white text-[7px] font-mono font-bold flex items-center gap-0.5">
              <Shield size={7} fill="currentColor" />
              <span>{shields}</span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p
              className={`text-[11px] font-bold truncate leading-tight ${
                isActive
                  ? 'text-[#FF8600] dark:text-[#FFA040]'
                  : 'text-[#352208] dark:text-[#FFF5E6]'
              }`}
            >
              {displayName}
            </p>
            {isActive && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#FF8600] text-white text-[7px] font-mono uppercase font-bold tracking-widest shrink-0 animate-bounce">
                TURN
              </span>
            )}
          </div>
          <p className="text-[8px] font-mono text-[#75552D] dark:text-[#D5B585] truncate mt-0.5">
            {displayUsername}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center flex-shrink-0 snap-center group relative select-none">
      <div className="relative">
        {isActive && (
          <motion.div
            layoutId="activeTurnRing"
            className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#FF8600] via-[#FFB800] to-[#FF8600] animate-pulse blur-[3px] opacity-90"
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          />
        )}

        <AvatarFrameRing
          frameId={player.equippedFrame || 'default'}
          size="md"
          showCrown={false}
          className={`transition-all duration-300 ${
            isActive ? 'scale-105 shadow-md shadow-black/20' : 'opacity-85 hover:opacity-100'
          }`}
        >
          <img loading="lazy" decoding="async" src={avatarSrc}
            alt={player.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
            }}
          />
        </AvatarFrameRing>

        {player.isHost && (
          <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-[#E1BB80] text-[#352208] ring-2 ring-white dark:ring-[#352208] shadow-xs">
            <Crown size={9} />
          </span>
        )}

        {shields > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 px-1 py-0.5 rounded-full bg-[#10B981] text-white ring-2 ring-white dark:ring-[#352208] text-[8px] font-mono font-bold flex items-center gap-0.5 shadow-xs"
            title={`${shields} Shield(s)`}
          >
            <Shield size={8} fill="currentColor" />
            <span>{shields}</span>
          </motion.span>
        )}
      </div>

      <div className="mt-1 text-center w-[64px] sm:w-[72px]">
        <p
          className={`text-[10px] font-semibold truncate leading-tight tracking-tight ${
            isActive
              ? 'text-[#FF8600] dark:text-[#FFA040] font-bold'
              : 'text-[#352208] dark:text-[#FFF5E6]'
          }`}
          title={displayName}
        >
          {displayName}
        </p>
        <p className="text-[8px] font-mono text-[#75552D] dark:text-[#D5B585] truncate leading-none mt-0.5">
          {displayUsername}
        </p>

        {isActive && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block mt-0.5 px-1.5 py-0.2 rounded-full bg-[#FF8600] text-white text-[7px] font-mono uppercase font-bold tracking-widest shadow-2xs"
          >
            TURN
          </motion.span>
        )}
      </div>
    </div>
  );
});

PlayerAvatarItem.displayName = 'PlayerAvatarItem';

export const InGamePlayerDisplay: React.FC<InGamePlayerDisplayProps> = memo(({
  players,
  activePlayerIndex,
  activePlayerId,
  shieldsMap,
  currentUserId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-switch to grid mode default if > 8 players for optimal multi-player readability
  const [viewMode, setViewMode] = useState<'strip' | 'grid'>(() => (players && players.length > 8 ? 'grid' : 'strip'));

  const foundIndex = activePlayerId ? players.findIndex((p) => p.id === activePlayerId) : -1;
  const activeIndex = foundIndex >= 0 ? foundIndex : players && players.length > 0 ? activePlayerIndex % players.length : 0;

  // Auto-scroll active player avatar into view centered in strip mode.
  //
  // IMPORTANT: we intentionally do NOT use `element.scrollIntoView()` here.
  // scrollIntoView() walks up every scrollable ancestor in the chain (any
  // element with overflow: hidden/auto/scroll counts as a "scroll container"
  // per the CSSOM View spec, even though overflow:hidden hides scrollbars
  // and blocks user-driven scrolling). During an active game this strip is
  // nested inside `.app-scroll`, the single scroll container that the whole
  // app shell re-uses for every screen (Home included) -- it is never
  // unmounted between views. If scrollIntoView ever nudges that shared
  // ancestor horizontally, the leftover scrollLeft offset survives the
  // transition back to Home (nothing resets it there), producing a
  // horizontally-shifted/clipped Home layout that "just appears" after
  // leaving certain games.
  //
  // Scrolling `containerRef` directly via `scrollTo` keeps the effect fully
  // contained to this strip and can never leak into an ancestor container.
  useEffect(() => {
    if (viewMode !== 'strip' || !players || players.length === 0 || !containerRef.current) return;
    const container = containerRef.current;
    const activeElement = container.children[activeIndex] as HTMLElement | undefined;
    if (activeElement) {
      const containerCenter = container.clientWidth / 2;
      const elementCenter = activeElement.offsetLeft + activeElement.offsetWidth / 2;
      const targetScrollLeft = elementCenter - containerCenter;

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }
  }, [activeIndex, players, viewMode]);

  if (!players || players.length === 0) return null;

  const totalPlayersCount = players.length;

  return (
    <div className="w-full py-1.5 space-y-1.5 select-none">
      {/* Player Count & View Toggle Header */}
      <div className="flex items-center justify-between px-2 text-[10px] font-mono text-[#75552D] dark:text-[#D5B585] uppercase">
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>PLAYERS ({totalPlayersCount})</span>
          {totalPlayersCount > 8 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#FF8600]/20 text-[#FF8600] text-[8px] font-bold">
              LARGE ROOM
            </span>
          )}
        </div>

        {/* View Layout Toggle Pill */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 p-0.5 rounded-full border border-black/10 dark:border-white/10">
          <button
            onClick={() => setViewMode('strip')}
            className={`p-1 rounded-full transition-all cursor-pointer ${
              viewMode === 'strip'
                ? 'bg-[#FF8600] text-white shadow-xs'
                : 'text-[#75552D] dark:text-[#D5B585] hover:text-[#040403] dark:hover:text-white'
            }`}
            title="Compact Strip View"
          >
            <Rows size={11} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded-full transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#FF8600] text-white shadow-xs'
                : 'text-[#75552D] dark:text-[#D5B585] hover:text-[#040403] dark:hover:text-white'
            }`}
            title="Multi-Column Grid View"
          >
            <LayoutGrid size={11} />
          </button>
        </div>
      </div>

      {/* View Mode 1: Horizontal Strip View */}
      {viewMode === 'strip' ? (
        <div
          ref={containerRef}
          className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto py-2 px-1 scrollbar-none snap-x"
        >
          {players.map((player, idx) => {
            const isActive = idx === activeIndex;
            const shields = (shieldsMap || {})[player.id] || 0;
            const isMe = player.id === currentUserId;

            return (
              <PlayerAvatarItem
                key={`strip-player-${player.id}-${idx}`}
                player={player}
                idx={idx}
                isActive={isActive}
                shields={shields}
                isMe={isMe}
                layoutMode="strip"
              />
            );
          })}
        </div>
      ) : (
        /* View Mode 2: Multi-Column Responsive Grid View (Perfect for 8 - 20 players) */
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 p-1 max-h-[180px] overflow-y-auto scrollbar-thin"
        >
          {players.map((player, idx) => {
            const isActive = idx === activeIndex;
            const shields = (shieldsMap || {})[player.id] || 0;
            const isMe = player.id === currentUserId;

            return (
              <PlayerAvatarItem
                key={`grid-player-${player.id}-${idx}`}
                player={player}
                idx={idx}
                isActive={isActive}
                shields={shields}
                isMe={isMe}
                layoutMode="grid"
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
});

InGamePlayerDisplay.displayName = 'InGamePlayerDisplay';
