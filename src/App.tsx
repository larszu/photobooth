import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import GalleryPage from './pages/GalleryPage';
import PhotoPage from './pages/PhotoPage';
import AdminPage from './pages/AdminPage';
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
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/photo/:id" element={<PhotoPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </AppProvider>
  </ThemeProvider>
);

export default App;
