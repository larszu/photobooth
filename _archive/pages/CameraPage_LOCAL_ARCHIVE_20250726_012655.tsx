import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Button, Dialog, Breadcrumbs, Link } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import TimerIcon from '@mui/icons-material/Timer';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

const CameraPage: React.FC = () => {
  const [branding, setBranding] = useState<{ type: 'logo' | 'text', logo?: string, text?: string }>({ type: 'text', text: '' });
  // Selbstauslöser-Logik
  const [timerMode, setTimerMode] = useState<3 | 5 | 10>(3);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shooting, setShooting] = useState(false);
  const [timerDialog, setTimerDialog] = useState(false);
  const navigate = useNavigate();

  // Lade Branding-Daten
  useEffect(() => {
    fetch('/api/branding')
      .then(res => res.json())
      .then(data => {
        console.log('Branding response:', data);
        if (data.success || data.type) {
          setBranding(data);
          console.log('Branding data loaded:', data);
        }
      })
      .catch(err => console.error('Error loading branding:', err));
  }, []);

  // Doppeltippen für Kamera-Einstellungen
  const handleDoubleClick = () => {
    // Hier könnten Kamera-Einstellungen geöffnet werden
  };

  // Foto aufnehmen (direkt oder mit Timer)
  const handleShoot = async () => {
    setShooting(true);
    try {
      const res = await fetch('/api/camera/shoot', { method: 'POST' });
      const data = await res.json();
      console.log('Photo take response:', data);
      if (data.success || data.filename) {
        // Zur Galerie navigieren und neu laden
        setTimeout(() => {
          navigate('/gallery');
          window.location.reload();
        }, 1000);
      } else {
        alert('Fehler beim Aufnehmen des Fotos');
      }
    } catch (e) {
      console.error('Error taking photo:', e);
      alert('Fehler beim Aufnehmen des Fotos');
    }
    setShooting(false);
  };

  // Selbstauslöser starten
  const handleTimerShoot = () => {
    setTimerDialog(true);
  };

  // Timer-Auswahl bestätigen
  const startTimer = () => {
    setTimerDialog(false);
    setCountdown(timerMode);
  };

  // Countdown runterzählen und dann auslösen
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      handleShoot();
      return;
    }
    const t = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Timer-Auswahl (Overlay)
  const timerOptions: (3 | 5 | 10)[] = [3, 5, 10];

  return (
    <Box>
      {/* Freistehender Zurück-Button oben links */}
      <IconButton 
        onClick={() => navigate('/gallery')}
        sx={{
          position: 'fixed',
          top: { xs: 16, sm: 20 },
          left: { xs: 16, sm: 20 },
          zIndex: 1000,
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          '&:hover': { 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.2s'
        }}
      >
        <ArrowBackIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
      </IconButton>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
        maxWidth: '2000px',
        margin: '0 auto',
        px: 0,
        pt: { xs: 0.5, sm: 1, md: 2 },
        pb: { xs: 6, sm: 7, md: 8 },
      }}>
        {/* Breadcrumb Navigation - versteckt für clean look */}
        <Breadcrumbs 
          aria-label="breadcrumb" 
          sx={{ 
            display: 'none',
            mb: { xs: 2, md: 3 }, 
            alignSelf: 'flex-start', 
            ml: { xs: 2, md: 2 } 
          }}
        >
          <Link 
            underline="hover" 
            color="inherit" 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/gallery');
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <HomeIcon fontSize="inherit" />
            Home
          </Link>
          <Typography 
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <PhotoCameraIcon fontSize="inherit" />
            Foto aufnehmen
          </Typography>
        </Breadcrumbs>

        {branding.type === 'logo' && branding.logo && (
          <img src={branding.logo} alt="Branding Logo" style={{ maxHeight: 120, marginBottom: 16 }} />
        )}
        {branding.type === 'text' && branding.text && (
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 700, fontSize: { xs: 28, md: 40 } }}>{branding.text}</Typography>
        )}

        {/* Kamera-Vorschau im 3:2 Format */}
        <Box
          sx={{
            overflow: 'hidden',
            touchAction: 'none',
            borderRadius: 4,
            width: { 
              xs: '99vw',
              sm: '98vw',
              md: '97vw',
              lg: '96vw',
              xl: '95vw'
            },
            maxWidth: '2000px',
            aspectRatio: '3/2',
            background: '#222',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
          }}
          onDoubleClick={handleDoubleClick}
        >
          {/* Kamera-Vorschau für neue Foto-Aufnahme */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              color: '#fff',
              fontSize: '2rem'
            }}
          >
            {countdown !== null ? `${countdown}` : 'Kamera bereit'}
          </Box>
          
          {/* Auslöse-Buttons */}
          <Box sx={{
            position: 'absolute',
            bottom: 32,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
          }}>
            {/* Haupt-Auslöser mittig positioniert */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
              {/* Selbstauslöser-Button - links positioniert */}
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  border: '2px solid #1976d2',
                  fontSize: '1.5rem',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
                  position: 'absolute',
                  left: 'calc(50% - 120px)',
                }}
                onClick={handleTimerShoot}
              >
                <TimerIcon sx={{ fontSize: '1.5rem' }} />
              </Box>

              {/* Haupt-Auslöser - iPhone-Style - mittig */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: countdown !== null ? '#1976d2' : (shooting ? '#1976d2' : '#fff'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (shooting || countdown !== null) ? 'not-allowed' : 'pointer',
                  pointerEvents: 'auto',
                  border: '4px solid #333',
                  fontSize: countdown !== null ? '2.5rem' : '2rem',
                  fontWeight: countdown !== null ? 700 : 400,
                  transform: shooting ? 'scale(0.9)' : 'scale(1)',
                  transition: 'all 0.1s',
                  '&:hover': { backgroundColor: countdown !== null ? '#1976d2' : (shooting ? '#1976d2' : '#f5f5f5') },
                  color: countdown !== null ? '#fff' : '#000',
                  opacity: (shooting || countdown !== null) ? 0.7 : 1
                }}
                onClick={(shooting || countdown !== null) ? undefined : handleShoot}
              >
                {countdown !== null ? countdown : ''}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* Timer-Auswahl-Dialog */}
      <Dialog open={timerDialog} onClose={() => setTimerDialog(false)} maxWidth="xs">
        <Box p={3} display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h6" sx={{ mb: 2 }}>Selbstauslöser</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              size="large"
              sx={{ color: '#1976d2', opacity: timerMode === 3 ? 0.3 : 1 }}
              disabled={timerMode === 3}
              onClick={() => setTimerMode(timerOptions[Math.max(0, timerOptions.indexOf(timerMode) - 1)])}
            >
              <RemoveIcon />
            </IconButton>
            <Typography variant="h2" color="primary" fontWeight={700} sx={{ minWidth: 60, textAlign: 'center' }}>
              {timerMode}s
            </Typography>
            <IconButton
              size="large"
              sx={{ color: '#1976d2', opacity: timerMode === 10 ? 0.3 : 1 }}
              disabled={timerMode === 10}
              onClick={() => setTimerMode(timerOptions[Math.min(timerOptions.length - 1, timerOptions.indexOf(timerMode) + 1)])}
            >
              <AddIcon />
            </IconButton>
          </Box>
          <Button variant="contained" color="primary" sx={{ mt: 3, minWidth: 120, fontSize: 20 }} onClick={startTimer}>
            Start
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default CameraPage;
