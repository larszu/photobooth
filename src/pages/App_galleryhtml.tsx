import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AlwaysAuthenticateRoute from './components/AlwaysAuthenticateRoute';
import GalleryPage from './pages/GalleryPage';
import FoldersOverviewPage from './pages/FoldersOverviewPage';
import FolderGalleryPage from './pages/FolderGalleryPage';
import PhotoPage from './pages/PhotoPage';
import PhotoViewPage from './pages/PhotoViewPage';
import AdminPage from './pages/AdminPage';
import TrashPage from './pages/TrashPage';
import useGPIOWebSocket from './hooks/useGPIOWebSocket';

// Komponente für GPIO-WebSocket-Verbindung
const GPIOWebSocketWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useGPIOWebSocket();
  
  // Optional: Anzeige des Verbindungsstatus in der Konsole
  React.useEffect(() => {
    console.log(`🔘 GPIO WebSocket: ${isConnected ? 'Connected' : 'Disconnected'}`);
  }, [isConnected]);
  
  return <>{children}</>;
};

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppProvider>
        <Router>
          <GPIOWebSocketWrapper>
            <Routes>
              <Route path="/" element={<Navigate to="/gallery" />} />
              <Route path="/gallery" element={<FoldersOverviewPage />} />
              <Route path="/gallery/all" element={<GalleryPage />} />
              <Route path="/gallery/folder/:folderName" element={<FolderGalleryPage />} />
              <Route path="/photo/new" element={<PhotoPage />} />
              <Route path="/view/:id" element={<PhotoViewPage />} />
              <Route path="/admin" element={
                <AlwaysAuthenticateRoute>
                  <AdminPage />
                </AlwaysAuthenticateRoute>
              } />
              <Route path="/trash" element={
                <AlwaysAuthenticateRoute>
                  <TrashPage />
                </AlwaysAuthenticateRoute>
              } />
            </Routes>
          </GPIOWebSocketWrapper>
        </Router>
      </AppProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;

