import { useState, useEffect } from 'react';

const PWABanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // 1. Install Banner Listener
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);

    // 2. Offline Listeners
    const goOff = () => setIsOffline(true);
    const goOn = () => setIsOffline(false);
    window.addEventListener('offline', goOff);
    window.addEventListener('online', goOn);

    // 3. Service Worker Update Listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setHasUpdate(true);
              }
            });
          }
        });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('offline', goOff);
      window.removeEventListener('online', goOn);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleUpdate = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('SKIP_WAITING');
      window.location.reload();
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-md">
      {isOffline && (
        <div className="bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
          <span>📡 You are currently offline.</span>
          <span className="text-[10px] opacity-75">Shell mode active</span>
        </div>
      )}
      
      {hasUpdate && (
        <div className="bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between">
          <span>🔄 Update available!</span>
          <button onClick={handleUpdate} className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded hover:bg-gray-100">Refresh</button>
        </div>
      )}

      {deferredPrompt && !hasUpdate && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between">
          <span>📱 Install UniConnect</span>
          <div className="flex gap-2">
            <button onClick={() => setDeferredPrompt(null)} className="text-xs opacity-75 hover:opacity-100">Later</button>
            <button onClick={handleInstall} className="bg-white text-purple-600 text-xs font-bold px-2 py-1 rounded hover:bg-gray-100">Install</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWABanner;