import React from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ConnectionStatusIndicator: React.FC = () => {
  const { connectionStatus, connectionQuality, t } = useApp();
  const [dismissed, setDismissed] = React.useState(false);

  // Reset dismissal when status changes to bad
  React.useEffect(() => {
    if (connectionStatus !== 'connected' || connectionQuality === 'weak' || connectionQuality === 'offline') {
      setDismissed(false);
    }
  }, [connectionStatus, connectionQuality]);

  const isBadConnection =
    connectionStatus !== 'connected' || connectionQuality === 'weak' || connectionQuality === 'offline';

  if (!isBadConnection || dismissed) {
    return null;
  }

  const isOffline = connectionQuality === 'offline' || connectionStatus === 'reconnecting';

  return (
    <div className="w-full px-3 sm:px-4 pt-2 pb-1 z-50 select-none">
      <div
        className={`w-full py-2 px-3.5 rounded-xl flex items-center justify-between gap-3 text-xs font-mono font-bold shadow-md transition-all backdrop-blur-md ${
          isOffline
            ? 'bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400'
            : 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isOffline ? (
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          ) : (
            <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
          )}
          <div className="flex flex-col text-left">
            <span className="tracking-tight font-black">
              {isOffline ? t('connectionLostTitle') : t('weakConnectionTitle')}
            </span>
            <span className="text-[10px] opacity-80 font-normal">
              {isOffline ? t('reconnectingAutoMsg') : t('gameSyncDelayedMsg')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="px-2.5 py-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-[10px] uppercase tracking-wider transition-all cursor-pointer shrink-0"
        >
          {t('dismiss')}
        </button>
      </div>
    </div>
  );
};
