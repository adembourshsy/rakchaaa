import React from 'react';
import type { UnoPlayer } from './UnoGameView';

interface UnoPlayerControlsProps {
  userProfile: { avatarUrl: string; name: string };
  myPlayer?: UnoPlayer;
  isMyTurn: boolean;
  getOrdinal: (n: number) => string;
  unoWindow: { active: boolean; playerId: string } | null;
  counterUnoWindow: { active: boolean; playerId: string } | null;
  myPlayerId: string;
  onUnoClick: () => void;
  onCounterUnoClick: () => void;
}

/**
 * Bottom action row: user avatar pod, turn-status pill, and the UNO / Counter-UNO
 * buttons. Extracted from UnoGameView as a pure presentational component (§17) —
 * all game state and handlers are passed in as props, no logic lives here.
 */
export const UnoPlayerControls: React.FC<UnoPlayerControlsProps> = ({
  userProfile,
  myPlayer,
  isMyTurn,
  getOrdinal,
  unoWindow,
  counterUnoWindow,
  myPlayerId,
  onUnoClick,
  onCounterUnoClick,
}) => {
  return (
    <div className="w-full max-w-xl flex items-center justify-between px-2 sm:px-4">

      {/* User Avatar Pod */}
      <div className="flex items-center gap-2">
        <div className={`relative w-9 sm:w-11 h-9 sm:h-11 rounded-full border-2 ${
          myPlayer?.finishedRank
            ? 'border-amber-400 ring-2 ring-amber-400/50'
            : isMyTurn
              ? 'border-amber-400 ring-3 ring-amber-400/80 shadow-[0_0_16px_rgba(251,191,36,0.8)] scale-105'
              : 'border-white/15'
        } bg-slate-950 shadow-xl overflow-hidden flex items-center justify-center`}>
          <img loading="lazy" decoding="async" src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          {myPlayer?.finishedRank && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[8px] px-1 py-0.2 rounded-full shadow-md">
              {myPlayer.finishedRank === 1 ? '🥇 1st' : myPlayer.finishedRank === 2 ? '🥈 2nd' : myPlayer.finishedRank === 3 ? '🥉 3rd' : `${myPlayer.finishedRank}th`}
            </span>
          )}
        </div>
        <span className="text-slate-300 font-bold text-xs max-w-[70px] truncate hidden sm:inline">
          {userProfile.name}
        </span>
      </div>

      {/* Turn Status Indicator Pill */}
      <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full shadow-lg transition-all duration-300 ${
        myPlayer?.finishedRank
          ? 'bg-emerald-400 text-slate-950'
          : isMyTurn
            ? 'bg-amber-400 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.6)] animate-[pulse_1.8s_ease-in-out_infinite]'
            : 'bg-white/5 border border-white/10 text-slate-400'
      }`}>
        <span className="text-xs sm:text-sm font-black tracking-wide">
          {myPlayer?.finishedRank
            ? `🎉 FINISHED (${getOrdinal(myPlayer.finishedRank).toUpperCase()} PLACE)`
            : isMyTurn ? 'YOUR TURN' : `OPPONENT TURN...`}
        </span>
        {isMyTurn && !myPlayer?.finishedRank && (
          <span aria-hidden className="text-sm leading-none">→</span>
        )}
      </div>

      {/* Glowing UNO & Counter UNO Action Buttons */}
      <div className="flex items-center gap-2">
        {counterUnoWindow?.active && counterUnoWindow.playerId !== myPlayerId && !myPlayer?.finishedRank && (
          <button
            onClick={onCounterUnoClick}
            className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-mono font-black text-xs uppercase shadow-[0_0_16px_rgba(251,191,36,0.8)] animate-bounce cursor-pointer active:scale-95"
          >
            ⚡ COUNTER!
          </button>
        )}

        <button
          onClick={onUnoClick}
          disabled={!unoWindow?.active || unoWindow.playerId !== myPlayerId || !!myPlayer?.finishedRank}
          className={`px-3 sm:px-4 py-2.5 min-h-[38px] rounded-full font-black text-xs uppercase tracking-wide transition-all flex items-center gap-1 ${
            unoWindow?.active && unoWindow.playerId === myPlayerId && !myPlayer?.finishedRank
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse cursor-pointer active:scale-95'
              : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
          }`}
        >
          <span>✨ UNO! ✨</span>
        </button>
      </div>

    </div>
  );
};
