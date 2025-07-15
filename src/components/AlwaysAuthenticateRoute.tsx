import React, { useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

interface AlwaysAuthenticateRouteProps {
  children: React.ReactNode;
}

/**
 * Komponente, die zwischen direkten Besuchen und internen Navigationen unterscheidet.
 * - Direkter Besuch (URL eingeben, Bookmark, etc.): Neue Authentifizierung erforderlich
 * - Interne Navigation (von Admin-Seite): Authentifizierung bleibt bestehen
 */
const AlwaysAuthenticateRoute: React.FC<AlwaysAuthenticateRouteProps> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    // Prüfe ob dies eine interne Navigation ist (state.fromInternal gesetzt)
    const isInternalNavigation = location.state?.fromInternal === true;
    
    if (isInternalNavigation) {
      console.log('🔓 AlwaysAuthenticateRoute: Interne Navigation erkannt - Authentifizierung bleibt bestehen');
      return;
    }
    
    // Bei direktem Besuch (keine interne Navigation) die Authentifizierung zurücksetzen
    if (authContext?.isAuthenticated) {
      console.log('🔒 AlwaysAuthenticateRoute: Direkter Besuch erkannt - Authentifizierung wird zurückgesetzt');
      authContext.logout();
    }
  }, []); // Nur beim ersten Rendern ausführen

  // Nach dem eventuellen Logout die normale ProtectedRoute verwenden
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
};

export default AlwaysAuthenticateRoute;
