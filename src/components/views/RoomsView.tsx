import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  ArrowRight,
  Users,
  Key,
  Play,
  Radio,
  UserCheck,
  Globe,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreateRoomModal } from '../modals/CreateRoomModal';
import { GameModeModal } from '../modals/GameModeModal';
import { MecanqueSetupModal } from '../modals/MecanqueSetupModal';
import { UnoSetupModal } from '../modals/UnoSetupModal';
import { IntrusSetupModal } from '../modals/IntrusSetupModal';
import { ChessSetupModal } from '../modals/ChessSetupModal';
import { getAvatarUrl, INITIAL_GAMES } from '../../data/mockData';
import { GameInfo } from '../../types';
import { ThreeDEmptyState } from '../ui/ThreeDEmptyState';
import rooms3DImage from '../../assets/images/rakcha_rooms_3d_1787235507330.jpg';

export const RoomsView: React.FC = () => {
  const {
    rooms,
    joinRoom,
    joinedRoom,
    setActiveView,
    t,
    roomsFilterGameId,
    setRoomsFilterGameId,
    createRoom,
    userProfile,
  } = useApp();

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTabType, setActiveTabType] = useState<'public' | 'my'>('public');

  // Setup modals state
  const [selectedGameForMode, setSelectedGameForMode] = useState<GameInfo | null>(null);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isMecanqueSetupOpen, setIsMecanqueSetupOpen] = useState(false);
  const [isUnoSetupOpen, setIsUnoSetupOpen] = useState(false);
  const [isIntrusSetupOpen, setIsIntrusSetupOpen] = useState(false);
  const [isChessSetupOpen, setIsChessSetupOpen] = useState(false);

  const handleSelectGame = async (game: GameInfo) => {
    setIsCreateModalOpen(false);
    if (game.id === 'belote' || game.id === 'coming-soon') {
      alert(t('comingSoonAlert'));
      return;
    }
    if (game.id === 'intrus') {
      setIsIntrusSetupOpen(true);
    } else if (game.id === 'mecanque') {
      setIsMecanqueSetupOpen(true);
    } else if (game.id === 'uno-game') {
      setIsUnoSetupOpen(true);
    } else if (game.id === 'chess') {
      setIsChessSetupOpen(true);
    } else {
      setSelectedGameForMode(game);
      setIsModeModalOpen(true);
    }
  };

  // Filter public rooms
  const publicRooms = rooms.filter(
    (r) =>
      !r.isPrivate &&
      r.status === 'waiting' &&
      r.currentPlayers > 0 &&
      r.players &&
      r.players.length > 0 &&
      (!roomsFilterGameId || r.gameId === roomsFilterGameId)
  );

  // Filter my rooms (where user is host or participant)
  const myRooms = rooms.filter((r) => {
    const isHost = r.hostId === userProfile.id || r.hostName === userProfile.name;
    const isParticipant = r.players?.some(
      (p) => p.id === userProfile.id || p.name === userProfile.name
    );
    const matchesFilter = !roomsFilterGameId || r.gameId === roomsFilterGameId;
    return (isHost || isParticipant) && matchesFilter;
  });

  const displayedRooms = activeTabType === 'public' ? publicRooms : myRooms;

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim() || isJoining) return;

    setIsJoining(true);
    setErrorMessage('');
    const result = await joinRoom(roomCodeInput);
    if (!result.success) {
      setErrorMessage(result.message || t('invalidCode') || 'Invalid room code');
      setIsJoining(false);
    } else {
      setRoomCodeInput('');
      setIsJoining(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))] pt-1 sm:pt-2 select-none"
    >
      {/* Header Banner with 3D Graphic Accent */}
      <div className="relative rounded-[16px] bg-white dark:bg-[#1E293B] text-[#000000] dark:text-[#F8FAFC] p-5 sm:p-6 border border-[#D5E5F7] dark:border-[#334155] shadow-sm flex items-center justify-between gap-4 overflow-hidden">
        {/* Subtle background blend */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-15 pointer-events-none">
          <img loading="lazy" decoding="async" src={rooms3DImage} alt="3D Rooms Emblem" className="w-full h-full object-cover object-right" />
        </div>

        <div className="space-y-1 relative z-10 max-w-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0F6FF] dark:bg-[#0F172A] text-[10px] font-mono text-[#FF8F00] uppercase tracking-wider font-bold border border-[#D5E5F7] dark:border-[#334155]">
            <span>{t('multiplayerLounge')}</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#000000] dark:text-[#F8FAFC]">
            {t('gameRooms')}
          </h2>
          <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] font-normal">
            {t('socialLobbyDesc')}
          </p>
        </div>

        {/* Primary CTA: CREATE ROOM */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="relative z-10 shrink-0 inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-[11px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>{t('createRoom')}</span>
        </button>
      </div>

      {/* Prominent, Elevated Room Code Input Card */}
      <div className="p-4 sm:p-5 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="roomCodeInput"
            className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#FF8F00] uppercase"
          >
            <Key size={14} strokeWidth={2} className="text-[#FF8F00]" />
            <span>{t('enterPrivateRoomCode')}</span>
          </label>
          <span className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8] font-bold uppercase">6 DIGIT CODE</span>
        </div>

        <form onSubmit={handleJoinByCode} className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <input
              id="roomCodeInput"
              type="text"
              value={roomCodeInput}
              onChange={(e) => {
                setRoomCodeInput(e.target.value.toUpperCase());
                setErrorMessage('');
              }}
              placeholder={t('enterCodePlaceholder')}
              maxLength={10}
              className="w-full px-4 py-3 rounded-[12px] bg-[#F4F8FC] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] focus:border-[#47A5FF] text-sm sm:text-base font-mono font-bold uppercase tracking-widest text-[#000000] dark:text-[#F8FAFC] placeholder-[#4C5055] dark:placeholder-[#64748B] outline-none transition-colors shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!roomCodeInput.trim() || isJoining}
            className="px-6 py-3 rounded-[12px] bg-[#47A5FF] hover:bg-[#3A92EE] disabled:opacity-40 disabled:pointer-events-none text-white text-xs sm:text-sm font-mono font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <span>{isJoining ? 'JOINING...' : t('join')}</span>
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </form>

        {errorMessage && (
          <p className="text-xs font-mono text-[#EF4444] font-semibold flex items-center gap-1.5 pt-1">
            <span>•</span>
            <span>{errorMessage}</span>
          </p>
        )}
      </div>

      {/* Active Joined Room Resume Banner */}
      {joinedRoom && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-[14px] bg-[#F0F6FF] dark:bg-[#0F172A] text-[#000000] dark:text-[#F8FAFC] border border-[#47A5FF] shadow-md flex items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[#FF8F00] flex items-center gap-1.5">
              <Radio size={12} className="text-[#10B981] animate-pulse" />
              Active Session in Progress
            </h3>
            <p className="text-xs font-normal text-[#4C5055] dark:text-[#94A3B8]">
              {joinedRoom.gameTitle} • {joinedRoom.currentPlayers}/{joinedRoom.maxPlayers} Players
            </p>
          </div>
          <button
            onClick={() =>
              setActiveView(joinedRoom.status === 'in_progress' ? 'game' : 'waiting_room')
            }
            className="flex items-center gap-2 px-4 py-2 bg-[#47A5FF] hover:bg-[#3A92EE] text-white rounded-[11px] font-mono text-xs font-bold uppercase tracking-widest active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Play size={14} strokeWidth={2.5} />
            <span>Resume</span>
          </button>
        </motion.div>
      )}

      {/* Dual Tab Navigation: Public Rooms vs My Rooms */}
      <div className="flex items-center justify-between border-b border-[#D5E5F7] dark:border-[#334155] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTabType('public')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-[10px] text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTabType === 'public'
                ? 'bg-white dark:bg-[#1E293B] text-[#47A5FF] border-t-2 border-t-[#47A5FF] shadow-xs'
                : 'text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <Globe size={14} />
            <span>PUBLIC ROOMS ({publicRooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTabType('my')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-[10px] text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTabType === 'my'
                ? 'bg-white dark:bg-[#1E293B] text-[#47A5FF] border-t-2 border-t-[#47A5FF] shadow-xs'
                : 'text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <UserCheck size={14} />
            <span>MY ROOMS ({myRooms.length})</span>
          </button>
        </div>

        <span className="text-[10px] font-mono text-[#10B981] flex items-center gap-1 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          LIVE LOBBY
        </span>
      </div>

      {/* Game Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setRoomsFilterGameId(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold tracking-wider uppercase transition-all whitespace-nowrap border cursor-pointer ${
            !roomsFilterGameId
              ? 'bg-[#47A5FF] text-white border-[#47A5FF] font-bold shadow-xs'
              : 'bg-white dark:bg-[#1E293B] text-[#4C5055] dark:text-[#94A3B8] border-[#D5E5F7] dark:border-[#334155] hover:text-[#000000] dark:hover:text-[#F8FAFC]'
          }`}
        >
          {t('allGames')}
        </button>
        {INITIAL_GAMES.filter(g => g.id !== 'coming-soon' && g.id !== 'belote').map((game, idx) => (
          <button
            key={`room-filter-${game.id}-${idx}`}
            onClick={() => setRoomsFilterGameId(game.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium tracking-wider uppercase transition-all whitespace-nowrap border cursor-pointer ${
              roomsFilterGameId === game.id
                ? 'bg-[#47A5FF] text-white border-[#47A5FF] font-bold shadow-xs'
                : 'bg-white dark:bg-[#1E293B] text-[#4C5055] dark:text-[#94A3B8] border-[#D5E5F7] dark:border-[#334155] hover:text-[#000000] dark:hover:text-[#F8FAFC]'
            }`}
          >
            {game.title}
          </button>
        ))}
      </div>

      {/* Room Cards List / Empty State */}
      <section className="space-y-3.5">
        {displayedRooms.length === 0 ? (
          <div className="p-8 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#F0F6FF] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] flex items-center justify-center mx-auto text-[#47A5FF]">
              {activeTabType === 'public' ? <Globe size={24} /> : <UserCheck size={24} />}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#000000] dark:text-[#F8FAFC]">
                {activeTabType === 'public' ? t('noPublicTablesOpen') : t('noActiveJoinedTables')}
              </h3>
              <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] max-w-sm mx-auto font-normal">
                {activeTabType === 'public' ? t('beFirstHost') : t('createRoomOrBrowse')}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-[11px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>{t('createRoom')}</span>
              </button>

              {activeTabType === 'my' && (
                <button
                  onClick={() => setActiveTabType('public')}
                  className="px-4 py-2.5 rounded-[11px] border-[1.5px] border-[#47A5FF] text-[#47A5FF] hover:bg-[#F0F6FF] dark:hover:bg-[#334155] font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Browse Public Rooms
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedRooms.map((room, idx) => (
              <div
                key={`room-${room.id}-${idx}`}
                className="group p-4 sm:p-5 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] hover:border-[#47A5FF] transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#000000] dark:text-[#F8FAFC] truncate">
                      {room.gameTitle}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F0F6FF] dark:bg-[#0F172A] text-[#47A5FF] border border-[#D5E5F7] dark:border-[#334155] font-bold uppercase tracking-wider">
                      {room.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#4C5055] dark:text-[#94A3B8]">
                    <div className="flex items-center gap-1.5">
                      <img loading="lazy" decoding="async" src={getAvatarUrl(room.hostAvatar)}
                        alt={room.hostName}
                        className="w-4 h-4 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                      />
                      <span className="font-semibold text-[#000000] dark:text-[#F8FAFC]">{room.hostName}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1 font-mono text-[#4C5055] dark:text-[#94A3B8] font-semibold">
                      <Users size={12} strokeWidth={1.75} />
                      <span>
                        {t('players')}: {room.currentPlayers} / {room.maxPlayers}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D5E5F7] dark:border-[#334155]">
                  <span
                    className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold ${
                      room.currentPlayers >= room.maxPlayers
                        ? 'bg-[#EF4444]/15 text-[#EF4444]'
                        : room.status === 'waiting'
                        ? 'bg-[#10B981]/15 text-[#10B981]'
                        : 'bg-[#F0F6FF] dark:bg-[#0F172A] text-[#4C5055] dark:text-[#94A3B8]'
                    }`}
                  >
                    {room.currentPlayers >= room.maxPlayers
                      ? t('roomFull')
                      : room.status === 'waiting'
                      ? t('waiting')
                      : t('inGame')}
                  </span>

                  <button
                    onClick={() => joinRoom(room.id)}
                    disabled={room.currentPlayers >= room.maxPlayers}
                    className="px-5 py-2 rounded-[11px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono font-bold uppercase tracking-wider transition-transform active:scale-95 shadow-xs cursor-pointer"
                  >
                    {room.currentPlayers >= room.maxPlayers ? t('roomFull') : t('join')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Room Selection Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSelectGame={handleSelectGame}
      />

      {/* Dispatched Setup Modals */}
      <GameModeModal
        game={selectedGameForMode}
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
      />

      <MecanqueSetupModal
        isOpen={isMecanqueSetupOpen}
        onClose={() => setIsMecanqueSetupOpen(false)}
      />

      <UnoSetupModal
        isOpen={isUnoSetupOpen}
        onClose={() => setIsUnoSetupOpen(false)}
      />

      <IntrusSetupModal
        isOpen={isIntrusSetupOpen}
        onClose={() => setIsIntrusSetupOpen(false)}
      />

      <ChessSetupModal
        isOpen={isChessSetupOpen}
        onClose={() => setIsChessSetupOpen(false)}
      />
    </motion.div>
  );
};
