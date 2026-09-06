import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Share2, UserPlus, LogOut, Crown, Play, BookOpen, ShieldAlert, Settings2, Globe, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InviteFriendsModal } from '../modals/InviteFriendsModal';
import { GameRulesBottomSheet } from '../game/GameRulesBottomSheet';
import { MecanqueSetupModal } from '../modals/MecanqueSetupModal';
import { UnoSetupModal } from '../modals/UnoSetupModal';
import { GameModeModal } from '../modals/GameModeModal';
import { getAvatarUrl, INITIAL_GAMES } from '../../data/mockData';
import { getUnoRules } from '../../data/localizedRules';
import { RoomChat } from '../game/RoomChat';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { audioManager } from '../../services/audioManager';
import { PlayerAvatarBadge } from '../ui/PlayerAvatarBadge';

export const WaitingRoomView: React.FC = () => {
  const { joinedRoom, userProfile, currentUid, requestLeaveRoom, toggleReady, startGame, resetCardGame, viewUserProfile, multiplayerError, t, language } = useApp();
  const { copied, copy: copyCode } = useCopyToClipboard();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [showUnoRules, setShowUnoRules] = useState(false);
  const [showChessRules, setShowChessRules] = useState(false);

  // Game-specific parameter edit modals for Host
  const [isEditMecanqueOpen, setIsEditMecanqueOpen] = useState(false);
  const [isEditUnoOpen, setIsEditUnoOpen] = useState(false);
  const [isEditActionVeriteOpen, setIsEditActionVeriteOpen] = useState(false);

  const startBtnRef = React.useRef<HTMLButtonElement>(null);

  // Identity comes from Firebase Auth (players[].id / hostId are uids).
  const authUid = currentUid || userProfile?.id;
  const myPlayer = joinedRoom?.players?.find(
    (p) =>
      (authUid && p.id === authUid) ||
      (currentUid && p.id === currentUid) ||
      (userProfile?.id && p.id === userProfile.id) ||
      (userProfile?.username && p.username === userProfile.username) ||
      (userProfile?.name && p.name.trim().toLowerCase() === userProfile.name.trim().toLowerCase())
  );
  const isHost = Boolean(
    joinedRoom && (
      (Boolean(authUid) && joinedRoom.hostId === authUid) ||
      (Boolean(userProfile?.id) && joinedRoom.hostId === userProfile.id)
    )
  );
  const isReady = myPlayer?.isReady ?? isHost;

  const isActionVerite = joinedRoom?.gameId === 'mind-rally' || joinedRoom?.gameId === 'action-verite';
  const selectedGameInfo = INITIAL_GAMES.find((g) => g.id === joinedRoom?.gameId);
  const minPlayersNeeded = isActionVerite ? 2 : (selectedGameInfo?.minPlayers ?? 2);
  const isNotEnough = Boolean(joinedRoom && joinedRoom.players.length < minPlayersNeeded);

  const otherPlayers = joinedRoom?.players ? joinedRoom.players.filter((p) => p.id !== userProfile?.id && !p.isHost) : [];
  const readyPlayersCount = otherPlayers.filter((p) => p.isReady).length;
  const areAllOthersReady = otherPlayers.length === 0 || otherPlayers.every((p) => Boolean(p.isReady));
  const canHostStart = !isNotEnough && areAllOthersReady;

  if (!joinedRoom) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-10 h-10 border-4 border-[#FF8600] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono text-[#989277] dark:text-[#B8B5A5]">
          {t('loadingRoom') || 'Loading room...'}
        </p>
      </div>
    );
  }

  const handleStart = async () => {
    audioManager.playSonicSignature();
    resetCardGame();
    await startGame();
  };

  const handleCopyCode = () => copyCode(joinedRoom.code);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join my RAKCHA game: ${joinedRoom.gameTitle}`,
        text: `Use room code ${joinedRoom.code} to join my game on RAKCHA GAME!`,
      }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  const openGameParametersEditor = () => {
    if (!isHost || joinedRoom.status !== 'waiting' || joinedRoom.gameId === 'intrus') return;
    if (joinedRoom.gameId === 'mecanque') {
      setIsEditMecanqueOpen(true);
    } else if (joinedRoom.gameId === 'uno-game') {
      setIsEditUnoOpen(true);
    } else {
      setIsEditActionVeriteOpen(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5 pb-8 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))] pt-1 sm:pt-2 select-none"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EEF0F4] dark:border-[#B8B5A5]/20">
        <button
          onClick={requestLeaveRoom}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EEF0F4] dark:bg-[#11110F] text-[11px] font-mono text-[#525866] dark:text-[#B8B5A5] hover:bg-[#E2E4E9] dark:hover:bg-[#11110F]/80 transition-colors"
        >
          <LogOut size={12} />
          <span>{t('leaveRoom')}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            joinedRoom.isPrivate
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
          }`}>
            {joinedRoom.isPrivate ? <Lock size={11} /> : <Globe size={11} />}
            <span>{joinedRoom.isPrivate ? 'PRIVATE 🔒' : 'PUBLIC 🌐'}</span>
          </span>
          <span className="text-xs font-mono font-semibold tracking-widest text-[#121316] dark:text-[#F8F7E8] uppercase">
            LOBBY • {joinedRoom.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Prominent Room Code Section */}
      <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#E2E4E9] dark:border-[#B8B5A5]/20 p-5 space-y-4 shadow-sm text-center">
        <h3 className="text-[11px] font-mono tracking-widest text-[#868C98] dark:text-[#B8B5A5] uppercase">
          {t('roomCode', 'ROOM CODE')}
        </h3>
        <div className="text-4xl font-black text-[#121316] dark:text-[#F8F7E8] tracking-[0.2em] font-mono">
          {joinedRoom.code}
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EEF0F4] dark:bg-[#11110F] text-[#121316] dark:text-[#F8F7E8] hover:bg-[#E2E4E9] dark:hover:bg-[#2A2A26] transition-colors text-xs font-mono font-bold uppercase tracking-wider"
          >
            {copied ? <Check size={16} className="text-[#FF8600]" /> : <Copy size={16} />}
            <span>{copied ? t('codeCopied', 'COPIED') : t('copy', 'COPY')}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF8600] text-white hover:opacity-90 transition-opacity text-xs font-mono font-bold uppercase tracking-wider shadow-sm shadow-[#FF8600]/20"
          >
            <Share2 size={16} />
            <span>{t('share', 'SHARE')}</span>
          </button>
        </div>
      </div>

      {/* Room Details & Host Parameters Card */}
      <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#E2E4E9] dark:border-[#B8B5A5]/20 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#868C98] dark:text-[#B8B5A5] uppercase">
                {joinedRoom.gameTitle}
              </span>
              {joinedRoom.mode && (
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#EEF0F4] dark:bg-[#11110F] text-[#525866] dark:text-[#B8B5A5] uppercase">
                  {joinedRoom.mode} MODE
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-[#121316] dark:text-[#F8F7E8] mt-0.5">
              {joinedRoom.title}
            </h2>
          </div>

          {/* Host Parameter Editing Button */}
          {isHost && joinedRoom.status === 'waiting' && joinedRoom.gameId !== 'intrus' && (
            <button
              type="button"
              onClick={openGameParametersEditor}
              className="px-3.5 py-2 rounded-xl bg-[#FF8600]/15 text-[#FF8600] border border-[#FF8600]/30 hover:bg-[#FF8600]/25 transition-all text-xs font-mono font-bold uppercase flex items-center gap-1.5 shrink-0"
            >
              <Settings2 size={14} />
              <span>{t('parameters')}</span>
            </button>
          )}
        </div>

        {/* Dynamic Game-Specific Parameter Pills */}
        {joinedRoom.gameId === 'mecanque' && (
          <div className="p-3.5 rounded-xl bg-[#FF8600]/10 border border-[#FF8600]/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#FF8600] uppercase tracking-wider flex items-center gap-1.5">
                <span>⚙️ MECANQUE PARAMETERS</span>
              </span>
              <span className="text-[9px] font-mono text-[#868C98] dark:text-[#B8B5A5]">
                {isHost ? t('hostCanEdit') : t('hostConfigured')}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="p-2 rounded-lg bg-black/10 dark:bg-black/30 border border-[#FF8600]/20">
                <span className="block text-[8px] text-[#868C98] dark:text-[#B8B5A5] uppercase font-bold">LEVEL</span>
                <span className="text-xs font-bold text-[#FF8600] capitalize">
                  {joinedRoom.mecanqueSettings?.difficulty === 'expert' ? '🔴 Expert' :
                   joinedRoom.mecanqueSettings?.difficulty === 'intermediate' ? '🟡 Interm.' : '🟢 Beginner'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-black/10 dark:bg-black/30 border border-[#FF8600]/20">
                <span className="block text-[8px] text-[#868C98] dark:text-[#B8B5A5] uppercase font-bold">CARS</span>
                <span className="text-xs font-bold text-[#FF8600]">
                  🏎️ {joinedRoom.mecanqueSettings?.carCount || 5} Cars
                </span>
              </div>
              <div className="p-2 rounded-lg bg-black/10 dark:bg-black/30 border border-[#FF8600]/20">
                <span className="block text-[8px] text-[#868C98] dark:text-[#B8B5A5] uppercase font-bold">TIME</span>
                <span className="text-xs font-bold text-[#FF8600]">
                  ⏱️ {joinedRoom.mecanqueSettings?.thinkingTime || 30}s
                </span>
              </div>
            </div>
          </div>
        )}

        {joinedRoom.gameId === 'belote' && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🃏 BELOTE PARAMETERS</span>
              </span>
              <span className="text-[9px] font-mono text-[#868C98] dark:text-[#B8B5A5]">
                {joinedRoom.beloteSettings?.preset || 'Classique'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="p-2 rounded-lg bg-black/10 dark:bg-black/30 border border-emerald-500/20">
                <span className="block text-[8px] text-[#868C98] dark:text-[#B8B5A5] uppercase font-bold">TARGET</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {joinedRoom.beloteSettings?.winningScore || 1001} Pts
                </span>
              </div>
              <div className="p-2 rounded-lg bg-black/10 dark:bg-black/30 border border-emerald-500/20">
                <span className="block text-[8px] text-[#868C98] dark:text-[#B8B5A5] uppercase font-bold">TALBA</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {joinedRoom.beloteSettings?.biddingType === 'with_announcements' ? 'Annonces' : 'Standard'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-black/10 dark:bg-black/30 border border-emerald-500/20">
                <span className="block text-[8px] text-[#868C98] dark:text-[#B8B5A5] uppercase font-bold">SANS ATOUT</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {joinedRoom.beloteSettings?.sansAtout !== false ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Players Slots Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-[#868C98] dark:text-[#B8B5A5] uppercase">
              {t('players')}: {joinedRoom.currentPlayers} / {joinedRoom.maxPlayers}
            </span>
            {joinedRoom.gameId === 'uno-game' && (
              <span className="px-2 py-0.5 rounded bg-[#FF8600]/10 text-[#FF8600] text-[9px] font-mono font-bold uppercase tracking-wider">
                2–4 PLAYERS
              </span>
            )}
            {joinedRoom.currentPlayers >= joinedRoom.maxPlayers && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-mono font-bold uppercase">
                {t('roomFull') || 'Room Full'}
              </span>
            )}
          </div>

          {joinedRoom.currentPlayers < joinedRoom.maxPlayers && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#121316] dark:text-[#F8F7E8] hover:underline underline-offset-4"
            >
              <UserPlus size={13} />
              <span>{t('inviteFriends')}</span>
            </button>
          )}
        </div>

        {/* Players Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {joinedRoom.players.map((player, idx) => (
            <div
              key={`waiting-room-player-${player.id || 'p'}-${idx}`}
              onClick={() => viewUserProfile(player)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#E2E4E9] dark:border-[#B8B5A5]/20 shadow-xs cursor-pointer hover:border-[#FF8600]/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <PlayerAvatarBadge
                    avatarUrl={getAvatarUrl(player.avatarUrl)}
                    name={player.name}
                    wins={player.wins ?? 0}
                    size="sm"
                    equippedFrame={player.equippedFrame || (player.id === userProfile.id ? userProfile.equippedFrame : undefined)}
                  />
                  {player.isHost && (
                    <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-[#121316] dark:bg-[#FF8600] text-white ring-2 ring-white dark:ring-[#1B1B18] z-10">
                      <Crown size={10} />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#121316] dark:text-[#F8F7E8] truncate">
                    {player.name} {player.id === userProfile.id && '(You)'}
                  </p>
                  <p className="text-[10px] font-mono text-[#868C98] dark:text-[#B8B5A5]">
                    {player.username}
                  </p>
                </div>
              </div>

              {/* Ready Status Chip */}
              <span
                className={`text-[10px] font-mono font-medium uppercase px-2.5 py-1 rounded-full ${
                  player.isReady
                    ? 'bg-[#FF8600]/15 text-[#FF8600] font-semibold'
                    : 'bg-[#EEF0F4] dark:bg-[#11110F] text-[#868C98] dark:text-[#B8B5A5]'
                }`}
              >
                {player.isReady ? t('ready') : t('waiting')}
              </span>
            </div>
          ))}

          {/* Room Full Banner if max reached */}
          {joinedRoom.currentPlayers >= joinedRoom.maxPlayers ? (
            <div className="col-span-full p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
              <span className="text-xs font-mono font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                {t('roomFull')} ({joinedRoom.currentPlayers} / {joinedRoom.maxPlayers}) • {t('maxCapacityReached')}
              </span>
            </div>
          ) : (
            /* Compact Empty Slot Placeholders */
            <>
              {Array.from({ length: Math.min(2, joinedRoom.maxPlayers - joinedRoom.currentPlayers) }).map((_, idx) => (
                <div
                  key={`waiting-room-empty-slot-${idx}`}
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center justify-center p-3.5 rounded-2xl border border-dashed border-[#D5D8DF] dark:border-[#B8B5A5]/20 cursor-pointer hover:bg-[#F4F5F7] dark:hover:bg-[#11110F] transition-colors text-center"
                >
                  <span className="text-xs font-mono text-[#868C98] dark:text-[#B8B5A5] flex items-center gap-1.5">
                    <UserPlus size={13} />
                    <span>{t('slotAvailable')}</span>
                  </span>
                </div>
              ))}
              {joinedRoom.maxPlayers - joinedRoom.currentPlayers > 2 && (
                <div
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center justify-center p-3.5 rounded-2xl border border-dashed border-[#D5D8DF] dark:border-[#B8B5A5]/20 cursor-pointer hover:bg-[#F4F5F7] dark:hover:bg-[#11110F] transition-colors text-center"
                >
                  <span className="text-xs font-mono text-[#FF8600] font-semibold flex items-center gap-1.5">
                    <UserPlus size={13} />
                    <span>+ {joinedRoom.maxPlayers - joinedRoom.currentPlayers - 2} {t('moreSlotsAvailable')}</span>
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Real-time Room Chat */}
      <RoomChat />

      {/* Primary Game Controls */}
      <div className="pt-1 flex flex-col items-center justify-between gap-2 w-full">
        {multiplayerError && multiplayerError.code !== 'CHAT_PERMISSION_DENIED' && (
          <div className="w-full flex items-start gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-left">
            <ShieldAlert size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[11px] font-mono text-red-600 dark:text-red-400 break-words">
              {multiplayerError.code}: {multiplayerError.message}
            </p>
          </div>
        )}
        {isHost ? (
          <div className="w-full space-y-2">
            <button
              id="host-start-game-btn"
              ref={startBtnRef}
              onClick={handleStart}
              disabled={!canHostStart}
              className="w-full py-4 rounded-full bg-[#FF8600] text-white text-xs sm:text-sm font-mono font-bold tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#FF8600]/25 hover:bg-[#E67800] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
            >
              <Play size={16} fill="currentColor" />
              <span>{t('startGame')}</span>
            </button>
            {isNotEnough ? (
              <p className="text-center text-[11px] font-mono text-[#FF8600] dark:text-[#FFA040]">
                {minPlayersNeeded > 1 ? t('minPlayersReq').replace('{count}', minPlayersNeeded.toString()).replace('{ready}', joinedRoom.players.length.toString()) : t('minPlayerReqSingular').replace('{count}', minPlayersNeeded.toString()).replace('{ready}', joinedRoom.players.length.toString())}
              </p>
            ) : !areAllOthersReady ? (
              <p className="text-center text-[11px] font-mono text-amber-500 dark:text-amber-400 font-semibold">
                {t('waitingForAllPlayersReady').replace('{ready}', readyPlayersCount.toString()).replace('{total}', otherPlayers.length.toString())}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="w-full space-y-2">
            <button
              id="player-toggle-ready-btn"
              onClick={toggleReady}
              className={`w-full py-3.5 rounded-full text-xs font-mono font-medium tracking-wider uppercase transition-all active:scale-95 shadow-xs ${
                isReady
                  ? 'bg-[#FF8600]/15 text-[#FF8600] border border-[#FF8600]/30'
                  : 'bg-[#040403] dark:bg-[#F8F7E8] text-white dark:text-[#11110F]'
              }`}
            >
              {isReady ? `✓ ${t('ready')} (${t('notReady')})` : t('ready')}
            </button>
            <div className="text-center text-[11px] font-mono text-[#868C98] dark:text-[#B8B5A5] flex items-center justify-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-[#FF8600] animate-pulse" />
              <span>
                {t('waitingForHostToStart')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Game Rules Section */}
      {joinedRoom.gameId === 'uno-game' ? (
        (() => {
          const unoRules = getUnoRules(language);
          const isAr = language === 'ar';
          const btnView = t('viewRulesBtn');
          const btnClose = t('closeRulesBtn');
          const titleLabel = t('gameRules');

          return (
            <div className="w-full rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 overflow-hidden shadow-xs transition-all" dir={isAr ? 'rtl' : 'ltr'}>
              <button
                onClick={() => setShowUnoRules(!showUnoRules)}
                className={`w-full p-4 flex items-center justify-between hover:bg-[#FF8600]/10 hover:border-[#FF8600]/30 transition-all ${isAr ? 'text-right' : 'text-left'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#FF8600]/15 text-[#FF8600]">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                      {titleLabel}
                    </p>
                    <p className="text-[10px] text-[#989277] dark:text-[#B8B5A5]">
                      {unoRules.howToPlayDesc}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#FF8600] font-bold">
                  {showUnoRules ? btnClose : btnView}
                </span>
              </button>

              <AnimatePresence>
                {showUnoRules && (
                  <motion.div
                    key="uno-rules-accordion"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-[#989277]/15 dark:border-[#B8B5A5]/10 p-4 bg-[#EDF0C2]/30 dark:bg-[#11110F]/60"
                  >
                    <div className="space-y-3 font-mono text-xs text-[#040403] dark:text-[#F8F7E8]">
                      {/* Players & Starting Setup */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/10 flex justify-between items-center">
                        <div>
                          <span className="block text-[9px] font-mono text-[#FF8600] uppercase font-bold">{unoRules.playersLabel}</span>
                          <span className="text-xs text-[#525866] dark:text-[#B8B5A5]">{unoRules.playersValue}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] font-mono text-[#FF8600] uppercase font-bold">{unoRules.startingCardsLabel}</span>
                          <span className="text-xs text-[#525866] dark:text-[#B8B5A5]">{unoRules.startingCardsValue}</span>
                        </div>
                      </div>

                      {/* How to Play */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/10 space-y-1">
                        <span className="block text-[9px] font-mono text-[#FF8600] uppercase font-bold">{unoRules.howToPlayLabel}</span>
                        <p className="text-xs">
                          {unoRules.howToPlayDesc}
                        </p>
                        <ul className="list-disc list-inside text-xs pl-1 space-y-0.5 text-[#525866] dark:text-[#B8B5A5]">
                          {unoRules.howToPlayItems.map((item, i) => (
                            <li key={`rule-item-${i}`}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Cards */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/10 space-y-2">
                        <span className="block text-[9px] font-mono text-[#FF8600] uppercase font-bold">{unoRules.actionCardsLabel}</span>
                        <div className="space-y-2 font-sans text-[11px]">
                          {unoRules.actionCards.map((card, i) => (
                            <div key={`act-card-${card.name}-${i}`} className={`pb-1 flex justify-between gap-1 ${i < unoRules.actionCards.length - 1 ? 'border-b border-[#989277]/5' : ''}`}>
                              <span className={`font-mono font-bold shrink-0 ${card.colorClass || 'text-[#FF8600]'}`}>{card.name}</span>
                              <span className={`${isAr ? 'text-left' : 'text-right'} text-[#717784] dark:text-[#B8B5A5]`}>{card.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Drawing */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/10">
                        <span className="block text-[9px] font-mono text-[#FF8600] uppercase font-bold">{unoRules.drawingLabel}</span>
                        <p className="mt-0.5 text-xs text-[#525866] dark:text-[#B8B5A5]">
                          {unoRules.drawingDesc}
                        </p>
                      </div>

                      {/* UNO */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/10 space-y-1">
                        <span className="block text-[9px] font-mono text-[#FF8600] uppercase font-bold">{unoRules.unoLabel}</span>
                        <p className="text-xs text-[#525866] dark:text-[#B8B5A5] leading-relaxed">
                          {unoRules.unoDesc}
                        </p>
                      </div>

                      {/* Counter UNO */}
                      <div className="p-3 rounded-xl bg-[#FF8600]/5 border border-[#FF8600]/25 space-y-1">
                        <span className="block text-[9px] font-mono text-[#FF8600] uppercase font-bold">{unoRules.counterUnoLabel}</span>
                        <p className="text-xs text-[#525866] dark:text-[#B8B5A5] leading-relaxed">
                          {unoRules.counterUnoDesc}
                        </p>
                      </div>

                      {/* Winning */}
                      <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 space-y-1">
                        <span className="block text-[9px] font-mono text-green-600 uppercase font-bold">{unoRules.winningLabel}</span>
                        <p className="text-xs text-[#525866] dark:text-[#B8B5A5] leading-relaxed">
                          {unoRules.winningDesc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()
      ) : joinedRoom.gameId === 'chess' ? (
        (() => {
          const btnView = t('viewRulesBtn');
          const btnClose = t('closeRulesBtn');
          
          return (
            <div className="w-full rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 overflow-hidden shadow-xs transition-all" dir="rtl">
              <button
                onClick={() => setShowChessRules(!showChessRules)}
                className="w-full p-4 flex items-center justify-between hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-500">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                      قوانين الشطرنج
                    </p>
                    <p className="text-[10px] text-[#989277] dark:text-[#B8B5A5]">
                      تعرف على القواعد الأساسية، حركة القطع وقوانين التبييت والأسر بالتجاوز.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-indigo-500 font-bold">
                  {showChessRules ? btnClose : btnView}
                </span>
              </button>

              <AnimatePresence>
                {showChessRules && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-[#989277]/15 dark:border-[#B8B5A5]/10 p-4 bg-[#EDF0C2]/30 dark:bg-[#11110F]/60"
                  >
                    <div className="space-y-3 font-mono text-xs text-[#040403] dark:text-[#F8F7E8]">
                      
                      {/* Basic Rules */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/10 space-y-1">
                        <span className="block text-[9px] font-mono text-indigo-500 uppercase font-bold">الهدف الأساسي</span>
                        <p className="text-xs text-[#525866] dark:text-[#B8B5A5]">
                          الهدف هو "كش مات" لملك الخصم، أي وضعه تحت التهديد بحيث لا يمكنه الهروب أو الحماية.
                        </p>
                      </div>

                      {/* Movement */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/10 space-y-2">
                        <span className="block text-[9px] font-mono text-indigo-500 uppercase font-bold">حركة القطع</span>
                        <div className="space-y-2 font-sans text-[11px]">
                          <div className="pb-1 flex justify-between gap-1 border-b border-[#989277]/5 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">البيدق</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">يتحرك للأمام مربعاً واحداً (أو مربعين في حركته الأولى)، ويأسر بشكل قطري.</span>
                          </div>
                          <div className="pb-1 flex justify-between gap-1 border-b border-[#989277]/5 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">الحصان</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">يتحرك بشكل حرف "L" وهو القطعة الوحيدة التي تقفز فوق القطع الأخرى.</span>
                          </div>
                          <div className="pb-1 flex justify-between gap-1 border-b border-[#989277]/5 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">الفيل</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">يتحرك بشكل قطري لأي عدد من المربعات المفتوحة.</span>
                          </div>
                          <div className="pb-1 flex justify-between gap-1 border-b border-[#989277]/5 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">الرخ (القلعة)</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">يتحرك أفقياً أو عمودياً لأي عدد من المربعات المفتوحة.</span>
                          </div>
                          <div className="pb-1 flex justify-between gap-1 border-b border-[#989277]/5 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">الوزير (الملكة)</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">أقوى قطعة، يتحرك أفقياً، عمودياً، وقطرياً.</span>
                          </div>
                          <div className="pb-1 flex justify-between gap-1 text-right">
                            <span className="font-mono font-bold text-indigo-500 shrink-0">الملك</span>
                            <span className="text-[#717784] dark:text-[#B8B5A5] text-left" dir="rtl">يتحرك مربعاً واحداً في أي اتجاه.</span>
                          </div>
                        </div>
                      </div>

                      {/* Special Rules */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/10 space-y-1">
                        <span className="block text-[9px] font-mono text-indigo-500 uppercase font-bold">قوانين خاصة</span>
                        <ul className="list-disc list-inside text-xs pl-1 space-y-0.5 text-[#525866] dark:text-[#B8B5A5]">
                          <li><span className="font-bold text-indigo-500">التبييت:</span> حركة مشتركة بين الملك والرخ لحماية الملك.</li>
                          <li><span className="font-bold text-indigo-500">الأسر بالتجاوز:</span> حركة أسر خاصة بالبيدق (En Passant).</li>
                          <li><span className="font-bold text-indigo-500">ترقية البيدق:</span> عندما يصل البيدق لآخر رقعة الخصم يترقى لقطعة أكبر.</li>
                        </ul>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()
      ) : joinedRoom.gameId === 'belote' ? (
        <div className="p-4 rounded-2xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#10B981]/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#10B981]/15 text-[#10B981]">
                <BookOpen size={16} />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                  {t('beloteGameGuideTitle')}
                </p>
                <p className="text-[10px] text-[#989277]">
                  {t('beloteGameGuideDesc')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="text-xs font-mono text-[#10B981] font-bold hover:underline"
            >
              {t('guideBtn')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsRulesOpen(true)}
          className="w-full p-4 rounded-2xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 dark:border-[#B8B5A5]/20 flex items-center justify-between hover:bg-[#FF8600]/10 hover:border-[#FF8600]/30 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF8600]/15 text-[#FF8600]">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase group-hover:text-[#FF8600]">
                {joinedRoom.gameId === 'mecanque'
                  ? t('mecanqueGameRulesTitle')
                  : t('gameRulesAndCardTypesTitle')}
              </p>
              <p className="text-[10px] text-[#989277]">
                {joinedRoom.gameId === 'mecanque'
                  ? t('mecanqueGameRulesDesc')
                  : t('tapToViewGameGuide')}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-[#FF8600] font-bold">VIEW →</span>
        </button>
      )}

      {/* Invite Friends Slide-up Modal */}
      <InviteFriendsModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      {/* Game Rules Animated Bottom Sheet */}
      <GameRulesBottomSheet
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Edit Mecanque Parameters Modal for Host */}
      <MecanqueSetupModal
        isOpen={isEditMecanqueOpen}
        onClose={() => setIsEditMecanqueOpen(false)}
        isEditMode={true}
      />

      {/* Edit Uno Parameters Modal for Host */}
      <UnoSetupModal
        isOpen={isEditUnoOpen}
        onClose={() => setIsEditUnoOpen(false)}
        isEditMode={true}
      />

      {/* Edit Action Verite Parameters Modal for Host */}
      <GameModeModal
        game={selectedGameInfo || null}
        isOpen={isEditActionVeriteOpen}
        onClose={() => setIsEditActionVeriteOpen(false)}
        isEditMode={true}
      />
    </motion.div>
  );
};
