import React, { Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { useAndroidBackButton } from './native/useAndroidBackButton';
import { useScreenOrientation } from './native/useScreenOrientation';
import { useImmersiveMode } from './native/useImmersiveMode';
import { FirstOpen } from './components/FirstOpen';
import { SplashScreen } from './components/SplashScreen';
import { MainHeader } from './components/MainHeader';
import { ConnectionStatusIndicator } from './components/ConnectionStatusIndicator';
import { FloatingNav } from './components/FloatingNav';
import { MobileContainer } from './components/MobileContainer';

const HomeView = React.lazy(() => import('./components/views/HomeView').then(m => ({ default: m.HomeView })));
const RoomsView = React.lazy(() => import('./components/views/RoomsView').then(m => ({ default: m.RoomsView })));
const SettingsView = React.lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const ProfileView = React.lazy(() => import('./components/views/ProfileView').then(m => ({ default: m.ProfileView })));
const FriendsView = React.lazy(() => import('./components/views/FriendsView').then(m => ({ default: m.FriendsView })));
const WaitingRoomView = React.lazy(() => import('./components/views/WaitingRoomView').then(m => ({ default: m.WaitingRoomView })));
const GameView = React.lazy(() => import('./components/views/GameView').then(m => ({ default: m.GameView })));
const AdminView = React.lazy(() => import('./components/admin/AdminView').then(m => ({ default: m.AdminView })));
const IntrusAdminView = React.lazy(() => import('./components/admin/IntrusAdminView').then(m => ({ default: m.IntrusAdminView })));
const MecanqueAdminView = React.lazy(() => import('./components/admin/MecanqueAdminView').then(m => ({ default: m.MecanqueAdminView })));
const AiLearningAdminDashboard = React.lazy(() => import('./components/admin/AiLearningAdminDashboard').then(m => ({ default: m.AiLearningAdminDashboard })));
const PrivacyView = React.lazy(() => import('./components/views/PrivacyView').then(m => ({ default: m.PrivacyView })));
const HelpView = React.lazy(() => import('./components/views/HelpView').then(m => ({ default: m.HelpView })));
const AboutView = React.lazy(() => import('./components/views/AboutView').then(m => ({ default: m.AboutView })));
import { SkeletonLoader } from './components/SkeletonLoader';
const RoomInvitationPopup = React.lazy(() => import('./components/modals/RoomInvitationPopup').then(m => ({ default: m.RoomInvitationPopup })));
const UnifiedNotificationCenterModal = React.lazy(() => import('./components/modals/UnifiedNotificationCenterModal').then(m => ({ default: m.UnifiedNotificationCenterModal })));
const FriendsNotificationsModal = React.lazy(() => import('./components/modals/FriendsNotificationsModal').then(m => ({ default: m.FriendsNotificationsModal })));
const RoomsNotificationsModal = React.lazy(() => import('./components/modals/RoomsNotificationsModal').then(m => ({ default: m.RoomsNotificationsModal })));
const LeaveRoomConfirmModal = React.lazy(() => import('./components/modals/LeaveRoomConfirmModal').then(m => ({ default: m.LeaveRoomConfirmModal })));
const CoinsModal = React.lazy(() => import('./components/modals/CoinsModal').then(m => ({ default: m.CoinsModal })));
const GuestTrialLimitModal = React.lazy(() => import('./components/modals/GuestTrialLimitModal').then(m => ({ default: m.GuestTrialLimitModal })));
const RankUnlockModal = React.lazy(() => import('./components/modals/RankUnlockModal').then(m => ({ default: m.RankUnlockModal })));
const EmojiShopModal = React.lazy(() => import('./components/modals/EmojiShopModal').then(m => ({ default: m.EmojiShopModal })));
const AvatarFrameShopModal = React.lazy(() => import('./components/modals/AvatarFrameShopModal').then(m => ({ default: m.AvatarFrameShopModal })));
const MatchResultModal = React.lazy(() => import('./components/modals/MatchResultModal').then(m => ({ default: m.MatchResultModal })));
const GameThemePickerModal = React.lazy(() => import('./components/theme/GameThemePickerModal').then(m => ({ default: m.GameThemePickerModal })));
const EmojiReactionLayer = React.lazy(() => import('./components/game/EmojiReactionLayer').then(m => ({ default: m.EmojiReactionLayer })));
import { preloadInterstitial } from './services/adService';
import { useAppAudioLifecycle } from './hooks/useAudio';

function AppContent() {
  const {
    hasOpened,
    activeTab,
    activeView,
    reducedMotion,
    joinedRoom,
    isCoinsModalOpen,
    setIsCoinsModalOpen,
    rankUnlockModalData,
    setRankUnlockModalData,
    isThemePickerOpen,
    setIsThemePickerOpen,
    selectedGameTheme,
    setSelectedGameTheme,
    userProfile,
    unoAiConfig,
    chessAiConfig,
  } = useApp();
  const [showSplash, setShowSplash] = React.useState(true);
  // Centralized RAKCHA audio lifecycle (Global SFX state sync).
  useAppAudioLifecycle();
  // Android hardware back button -> in-app navigation (native builds only).
  useAndroidBackButton();
  // Dynamic screen orientation (portrait outside games, auto-rotate enabled in game).
  useScreenOrientation();
  // Android immersive fullscreen mode during active gameplay.
  useImmersiveMode();

  const isInProtectedSession =
    joinedRoom != null &&
    (joinedRoom.status === 'waiting' || joinedRoom.status === 'in_progress');

  const isGameActive =
    activeView === 'game' ||
    joinedRoom?.status === 'in_progress' ||
    Boolean(unoAiConfig?.isAiMode) ||
    Boolean(chessAiConfig?.isAiMode);

  React.useEffect(() => {
    void preloadInterstitial();
  }, []);
  const [viewLoading, setViewLoading] = React.useState(false);
  const [loadType, setLoadType] = React.useState<'home' | 'rooms' | 'waiting_room' | 'game' | 'profile' | 'friends'>('home');

  React.useEffect(() => {
    let targetType: 'home' | 'rooms' | 'waiting_room' | 'game' | 'profile' | 'friends' = 'home';
    if (activeView === 'game') targetType = 'game';
    else if (activeView === 'waiting_room') targetType = 'waiting_room';
    else if (activeView === 'profile') targetType = 'profile';
    else if (activeView === 'friends') targetType = 'friends';
    else if (activeTab === 'rooms') targetType = 'rooms';
    else if (activeTab === 'home') targetType = 'home';

    setLoadType(targetType);
    setViewLoading(true);

    const delay = reducedMotion ? 200 : 500;
    const timer = setTimeout(() => {
      setViewLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [activeTab, activeView, reducedMotion]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen durationMs={2800} onFinish={() => setShowSplash(false)} />}
      </AnimatePresence>

      <AnimatePresence>{!showSplash && !hasOpened && <FirstOpen />}</AnimatePresence>

      <MobileContainer>
        {/* Connection Quality & Status Alert Bar */}
        <ConnectionStatusIndicator />

        {/* Main Minimal Header */}
        {!isGameActive && <MainHeader />}

        {/* Dynamic View Content */}
        <main className={`w-full ${isGameActive ? 'h-full flex-1 flex flex-col min-h-0' : ''}`}>
          {viewLoading ? (
            <SkeletonLoader type={loadType} />
          ) : (
            <AnimatePresence mode="wait">
              <Suspense fallback={<SkeletonLoader type={loadType} />}>
                {activeView === 'game' ? (
                  <GameView key="game" />
                ) : activeView === 'admin' || activeView === 'admin_action_verite' ? (
                  <AdminView key="admin_av" />
                ) : activeView === 'admin_ai_dashboard' ? (
                  <AiLearningAdminDashboard key="admin_ai_dashboard" />
                ) : activeView === 'admin_intrus' ? (
                  <IntrusAdminView key="admin_intrus" />
                ) : activeView === 'admin_mecanque' ? (
                  <MecanqueAdminView key="admin_mecanque" />
                ) : activeView === 'settings_privacy' ? (
                  <PrivacyView key="settings_privacy" />
                ) : activeView === 'settings_help' ? (
                  <HelpView key="settings_help" />
                ) : activeView === 'settings_about' ? (
                  <AboutView key="settings_about" />
                ) : activeView === 'waiting_room' ? (
                  <WaitingRoomView key="waiting_room" />
                ) : activeView === 'profile' ? (
                  <ProfileView key="profile" />
                ) : activeView === 'friends' ? (
                  <FriendsView key="friends" />
                ) : activeTab === 'settings' ? (
                  <SettingsView key="settings" />
                ) : isInProtectedSession ? (
                  joinedRoom.status === 'in_progress' ? (
                    <GameView key="game_protected" />
                  ) : (
                    <WaitingRoomView key="waiting_room_protected" />
                  )
                ) : activeTab === 'home' ? (
                  <HomeView key="home" />
                ) : activeTab === 'rooms' ? (
                  <RoomsView key="rooms" />
                ) : (
                  <HomeView key="home_default" />
                )}
              </Suspense>
            </AnimatePresence>
          )}
        </main>


        {/* Floating Opal-inspired Dock Navigation */}
        {hasOpened && !isInProtectedSession && !isGameActive && activeView !== 'waiting_room' && <FloatingNav />}
      </MobileContainer>

      <Suspense fallback={null}>
        <RoomInvitationPopup />
        <UnifiedNotificationCenterModal />
        <FriendsNotificationsModal />
        <RoomsNotificationsModal />
        <LeaveRoomConfirmModal />
        <CoinsModal isOpen={isCoinsModalOpen} onClose={() => setIsCoinsModalOpen(false)} />
        <GuestTrialLimitModal />
        <EmojiShopModal />
        <AvatarFrameShopModal />
        <MatchResultModal />
        <EmojiReactionLayer />
        <RankUnlockModal
          isOpen={rankUnlockModalData.isOpen}
          wins={rankUnlockModalData.wins}
          rankTitle={rankUnlockModalData.rankTitle}
          tier={rankUnlockModalData.tier}
          onClose={() => setRankUnlockModalData((prev) => ({ ...prev, isOpen: false }))}
        />
        <GameThemePickerModal
          isOpen={isThemePickerOpen}
          onClose={() => setIsThemePickerOpen(false)}
          playerLevel={userProfile?.level || 1}
          currentThemeId={selectedGameTheme}
          onSelectTheme={(themeId) => setSelectedGameTheme(themeId)}
        />
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
