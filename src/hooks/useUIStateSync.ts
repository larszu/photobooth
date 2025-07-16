import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook der den aktuellen UI-Status an das Backend sendet
 * Damit der GPIO-Button nur auf der Photo-Seite funktioniert
 */
export const useUIStateSync = () => {
  const location = useLocation();

  useEffect(() => {
    // Route zu UI-State mapping
    const getUIStateFromPath = (pathname: string): string => {
      if (pathname.startsWith('/photo/new')) return 'photo';
      if (pathname.startsWith('/admin')) return 'admin';
      if (pathname.startsWith('/trash')) return 'admin'; // Trash ist auch Admin-Bereich
      if (pathname.startsWith('/gallery') || pathname.startsWith('/view/') || pathname.startsWith('/')) return 'gallery';
      return 'home';
    };

    const currentState = getUIStateFromPath(location.pathname);

    // Status an Backend senden
    const syncUIState = async () => {
      try {
        const response = await fetch('/api/ui-state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ state: currentState }),
        });

        if (response.ok) {
          console.log(`📱 UI State synced: ${currentState} (${location.pathname})`);
        } else {
          console.warn('Failed to sync UI state:', await response.text());
        }
      } catch (error) {
        console.error('Error syncing UI state:', error);
      }
    };

    // Kurze Verzögerung damit die Route sich vollständig geändert hat
    const timeoutId = setTimeout(syncUIState, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
};

export default useUIStateSync;
