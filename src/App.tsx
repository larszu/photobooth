import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import GalleryPage from './pages/GalleryPage';
import FoldersOverviewPage from './pages/FoldersOverviewPage';
import FolderGalleryPage from './pages/FolderGalleryPage';
import PhotoPage from './pages/PhotoPage';
import PhotoViewPage from './pages/PhotoViewPage';
import AdminPage from './pages/AdminPage';
import TrashPage from './pages/TrashPage';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
  },
  shape: { borderRadius: 16 },
});

const App: React.FC = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/gallery" />} />
          <Route path="/gallery" element={<FoldersOverviewPage />} />
          <Route path="/gallery/all" element={<GalleryPage />} />
          <Route path="/gallery/folder/:folderName" element={<FolderGalleryPage />} />
          <Route path="/photo/new" element={<PhotoPage />} />
          <Route path="/view/:id" element={<PhotoViewPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/trash" element={<TrashPage />} />
        </Routes>
      </Router>
    </AppProvider>
  </ThemeProvider>
);

export default App;
