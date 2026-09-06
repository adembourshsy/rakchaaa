import React, { useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { LogOut, Sliders } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InGamePlayerDisplay } from '../game/InGamePlayerDisplay';
import { MainGameCard } from '../game/MainGameCard';
import { UnoGameView } from '../game/UnoGameView';
import { MecanqueGameView } from '../game/MecanqueGameView';
import { IntrusGameView } from '../game/IntrusGameView';
import { ChessGameView } from '../game/ChessGameView';
import { preloadInterstitial } from '../../services/adService';
import { ThreeDToken, ThreeDDeckFan } from '../ui/ThreeDGameElements';
import { useNormalizedGameState } from '../../hooks/useNormalizedGameState';
import { getThemeById } from '../../theme/gameThemeEngine';
import { GameThemePickerModal } from '../theme/GameThemePickerModal';

export const GameView: React.FC = () => {
  const {
    joinedRoom,
    unoAiConfig,
    beloteAiConfig,
    chessAiConfig,
    userProfile,
    currentUid,
    cardTurn,
    getRandomCard,
    flipCard,
    useShield,
    selectSpecialChoice,
    advanceTurn,
    removePlayerFromRoom,
    setActiveView,
    selectedGameTheme,
    setSelectedGameTheme,
    isThemePickerOpen,
    setIsThemePickerOpen,
    batterySaver,
    t,
  } = useApp();

  const currentLeagueTheme = getThemeById(selectedGameTheme, userProfile?.level || 1);

  // Preload interstitial for game completion
  useEffect(() => {
    void preloadInterstitial();
  }, []);

  // State-normalization layer for 8+ concurrent players
  const myEffectiveId = currentUid || userProfile?.id || '';
  const normalizedState = useNormalizedGameState(joinedRoom, userProfile, currentUid, cardTurn);

  const {
    activePlayers,
    activePlayerObj,
    isActiveTurn,
    currentShields,
  } = normalizedState;

  // Memoized action handlers to preserve reference equality across rapid updates
  const handleFlipCard = useCallback(() => {
    flipCard();
  }, [flipCard]);

  const handleUseShield = useCallback(() => {
    useShield();
  }, [useShield]);

  const handleSelectSpecialChoice = useCallback(
    (choice: 'optionA' | 'optionB') => {
      selectSpecialChoice(choice);
    },
    [selectSpecialChoice]
  );

  const handleAdvanceTurn = useCallback(() => {
    advanceTurn();
  }, [advanceTurn]);

  const handleRemovePlayer = useCallback(
    (playerId: string) => {
      removePlayerFromRoom(playerId);
    },
    [removePlayerFromRoom]
  );

  const currentCard = useMemo(() => {
    return cardTurn.currentCard || getRandomCard();
  }, [cardTurn.currentCard, getRandomCard]);

  const aiGameView = useMemo(() => {
    if (unoAiConfig?.isAiMode) return <UnoGameView isAiMode={true} aiConfig={unoAiConfig} />;
    if (chessAiConfig?.isAiMode) return <ChessGameView isAiMode={true} aiConfig={chessAiConfig} />;
    return null;
  }, [unoAiConfig, chessAiConfig]);

  if (aiGameView) return aiGameView;

  const multiplayerGameView = useMemo(() => {
    if (joinedRoom?.gameId === 'chess') return <ChessGameView />;
    if (joinedRoom?.gameId === 'intrus') return <IntrusGameView />;
    if (joinedRoom?.gameId === 'uno-game') return <UnoGameView />;
    if (joinedRoom?.gameId === 'mecanque') return <MecanqueGameView />;
    return null;
  }, [joinedRoom?.gameId]);

  if (multiplayerGameView) return multiplayerGameView;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        style={{
          paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
          paddingLeft: 'max(10px, env(safe-area-inset-left, 10px))',
          paddingRight: 'max(10px, env(safe-area-inset-right, 10px))',
        }}
        className={`space-y-3 sm:space-y-4 rounded-3xl ${currentLeagueTheme.tableContainer} ${currentLeagueTheme.tableBorder} ${currentLeagueTheme.glowEffect} select-none relative overflow-hidden h-full max-h-full flex flex-col justify-between box-border`}
      >
        {/* Table Inner Stitched Oval Border Accent */}
        <div className={`absolute inset-2 sm:inset-3 rounded-2xl border-2 ${currentLeagueTheme.tableInnerAccent} pointer-events-none z-0`} />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono relative z-10">
          <button
            onClick={() => setActiveView('waiting_room')}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-full bg-black/30 text-white/80 hover:text-white transition-colors active:scale-95 touch-manipulation cursor-pointer"
          >
            <LogOut size={13} />
            <span>{t('exitMatch')}</span>
          </button>

          <div className="flex items-center gap-2 min-h-[38px]">
            <span className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-widest ${currentLeagueTheme.headerText} uppercase truncate max-w-[120px] sm:max-w-[180px]`}>
              {joinedRoom?.gameTitle || 'RAKCHA DECK'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8600] animate-pulse shrink-0" />
          </div>

          <div className="flex items-center gap-2">
            {/* League Theme Switcher Button */}
            <button
              onClick={() => setIsThemePickerOpen(true)}
              className={`px-2.5 py-1.5 min-h-[38px] rounded-xl border ${currentLeagueTheme.headerBadge} flex items-center gap-1 text-[11px] font-mono font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
              title="Change Table Aesthetic Theme"
            >
              <span>{currentLeagueTheme.badgeEmoji}</span>
              <span className="hidden sm:inline">{currentLeagueTheme.leagueName}</span>
            </button>

            {/* Admin Portal Shortcut */}
            <button
              onClick={() => setActiveView('admin')}
              className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full bg-[#FF8600]/15 text-[#FF8600] hover:bg-[#FF8600]/25 transition-colors active:scale-95 touch-manipulation cursor-pointer"
              title={t('adminCardManagement')}
            >
              <Sliders size={14} />
            </button>
          </div>
        </div>

      {/* 1. IN-GAME PLAYER DISPLAY (Normalized & Memoized Circular Profile Avatars) */}
      {useMemo(() => (
        <InGamePlayerDisplay
          players={activePlayers}
          activePlayerIndex={cardTurn.activePlayerIndex}
          activePlayerId={normalizedState.activePlayerId}
          shieldsMap={cardTurn.shieldsMap}
          currentUserId={myEffectiveId}
        />
      ), [activePlayers, cardTurn.activePlayerIndex, normalizedState.activePlayerId, cardTurn.shieldsMap, myEffectiveId])}

      {/* 2. MAIN GAME CARD & TURN SYSTEM */}
      <div className="pt-2 relative">
        {!batterySaver && (
          <>
            <div className="hidden sm:block absolute -left-12 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none z-0">
              {useMemo(() => <ThreeDDeckFan />, [])}
            </div>
            <div className="hidden sm:block absolute -right-10 top-1/3 opacity-70 pointer-events-none z-0">
              {useMemo(() => <ThreeDToken label="GOLD" size={44} />, [])}
            </div>
          </>
        )}

        <div className="relative z-10">
          {useMemo(() => (
            <MainGameCard
              card={currentCard}
              isFlipped={cardTurn.isFlipped}
              isActiveTurn={isActiveTurn}
              activePlayerName={isActiveTurn ? t('ready') : activePlayerObj.name}
              timerSeconds={cardTurn.timerSeconds}
              shieldsCount={currentShields}
              selectedSpecialChoice={cardTurn.selectedSpecialChoice || null}
              selectedTargetPlayerId={cardTurn.selectedTargetPlayerId || null}
              specialActionStep={cardTurn.specialActionStep || null}
              specialCardOwnerId={cardTurn.specialCardOwnerId || null}
              currentUserId={myEffectiveId || null}
              shieldUsedInTurn={cardTurn.shieldUsedInTurn || false}
              onFlipCard={handleFlipCard}
              onUseShield={handleUseShield}
              onSelectSpecialChoice={handleSelectSpecialChoice}
              onAdvanceTurn={handleAdvanceTurn}
              players={activePlayers}
              activePlayerId={activePlayerObj.id}
              onRemovePlayer={handleRemovePlayer}
            />
          ), [
            currentCard, cardTurn.isFlipped, isActiveTurn, activePlayerObj.name,
            cardTurn.timerSeconds, currentShields, cardTurn.selectedSpecialChoice,
            cardTurn.selectedTargetPlayerId, cardTurn.specialActionStep, cardTurn.specialCardOwnerId,
            myEffectiveId, cardTurn.shieldUsedInTurn, handleFlipCard, handleUseShield,
            handleSelectSpecialChoice, handleAdvanceTurn, activePlayers, activePlayerObj.id,
            handleRemovePlayer, t
          ])}
        </div>
      </div>

      {/* Turn Helper Footer Banner */}
      <div className="p-3 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-between text-[10px] font-mono text-white/70 uppercase relative z-10">
        <span>{t('activeTurn')}: {activePlayerObj.name}</span>
        <span>
          {cardTurn.isFlipped
            ? t('cardRevealedTimerRunning')
            : t('waitingToFlipCard')}
        </span>
      </div>
    </motion.div>

    <GameThemePickerModal
      isOpen={isThemePickerOpen}
      onClose={() => setIsThemePickerOpen(false)}
      playerLevel={userProfile?.level || 1}
      currentThemeId={selectedGameTheme}
      onSelectTheme={(themeId) => setSelectedGameTheme(themeId)}
    />
    </>
  );
};
