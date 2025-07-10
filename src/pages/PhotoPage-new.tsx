import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, AppBar, Toolbar, IconButton, Button, CircularProgress, Snackbar, Alert, Card, CardMedia, Dialog } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useAppContext } from '../context/AppContext';

const PhotoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [zoom, setZoom] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchMove, setTouchMove] = useState<{ x: number; y: number } | null>(null);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeAnimating, setSwipeAnimating] = useState(false);
  const [branding, setBranding] = useState<{ type: 'logo' | 'text', logo?: string, text?: string }>({ type: 'text', text: '' });
  // Selbstauslöser-Logik
  const [timerMode, setTimerMode] = useState<3 | 5 | 10>(3);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shooting, setShooting] = useState(false);
  const [timerDialog, setTimerDialog] = useState(false);
  const navigate = useNavigate();
  const imgRef = useRef<HTMLImageElement>(null);

  // Prüfe ob es sich um eine neue Foto-Aufnahme handelt
  const isNewPhoto = id === 'new';

  // Lade alle Fotos und setze aktuellen Index
  useEffect(() => {
    fetch('http://localhost:3001/api/photos')
      .then(res => res.json())
      .then(data => {
        console.log('Photos response:', data);
        const photoArray = Array.isArray(data.photos) 
          ? data.photos.map(photo => typeof photo === 'string' ? photo : photo.filename)
          : [];
        setAllPhotos(photoArray);
        const idx = photoArray.findIndex((p: string) => p === id);
        setCurrentIndex(idx);
      })
      .catch(err => console.error('Error loading photos:', err));
  }, [id]);

  // Lade Branding-Daten
  useEffect(() => {
    fetch('http://localhost:3001/api/branding')
      .then(res => res.json())
      .then(data => {
        console.log('Branding response:', data);
        if (data.success) {
          setBranding(data);
          console.log('Branding data loaded:', data);
        }
      })
      .catch(err => console.error('Error loading branding:', err));
  }, []);

  // Touch-Events für Zoom und Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsZoomed(true);
    } else if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setSwipeOffset(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isZoomed) {
      // Pinch-Zoom
      const dist = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
      setZoom(Math.min(3, Math.max(1, dist / 150)));
    } else if (e.touches.length === 1 && touchStart) {
      const offset = e.touches[0].clientX - touchStart.x;
      setTouchMove({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (isZoomed) {
      if (zoom < 1.1) {
        // Rauszoomen: zurück zur Galerie
        navigate('/gallery');
      }
      setIsZoomed(false);
      setZoom(1);
      setSwipeOffset(0);
      return;
    }
    if (touchStart && touchMove && Math.abs(touchMove.x - touchStart.x) > 50) {
      const dx = touchMove.x - touchStart.x;
      setSwipeAnimating(true);
      setTimeout(() => {
        setSwipeAnimating(false);
        setSwipeOffset(0);
        if (dx > 50 && currentIndex > 0) {
          // Swipe right: vorheriges Bild
          navigate(`/photo/${allPhotos[currentIndex - 1]}`);
        } else if (dx < -50 && currentIndex < allPhotos.length - 1) {
          // Swipe left: nächstes Bild
          navigate(`/photo/${allPhotos[currentIndex + 1]}`);
        }
      }, 150);
    } else {
      setSwipeOffset(0);
    }
    setTouchStart(null);
    setTouchMove(null);
  };

  // Doppeltippen für Zoom
  const handleDoubleClick = () => {
    if (!isNewPhoto) {
      setShowDialog(true);
    }
  };

  // Foto aufnehmen (direkt oder mit Timer)
  const handleShoot = async () => {
    setShooting(true);
    try {
      const res = await fetch('http://localhost:3001/api/photo/take', { method: 'POST' });
      const data = await res.json();
      console.log('Photo take response:', data);
      if (data.success && data.filename) {
        // Nach Aufnahme zur neuen Foto-Seite navigieren
        navigate(`/photo/${data.filename}`);
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
      <AppBar position="static" color="primary">
        <Toolbar 
          sx={{ 
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2, md: 3 },
            width: '100%',
            maxWidth: '100vw'
          }}
        >
          <IconButton 
            color="inherit" 
            onClick={() => navigate('/gallery')}
            sx={{
              p: { xs: 1, sm: 1.5 },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {isNewPhoto ? 'Neues Foto' : `Foto: ${id}`}
          </Typography>
          {!isNewPhoto && (
            <IconButton 
              color="inherit"
              sx={{
                p: { xs: 1, sm: 1.5 },
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: '1.2rem', sm: '1.5rem' }
                }
              }}
            >
              <ShareIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
        maxWidth: 1200,
        margin: '0 auto',
        pt: { xs: 2, md: 4 },
        pb: { xs: 2, md: 4 },
      }}>
        {branding.type === 'logo' && branding.logo && (
          <img src={branding.logo} alt="Branding Logo" style={{ maxHeight: 120, marginBottom: 16 }} />
        )}
        {branding.type === 'text' && branding.text && (
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 700, fontSize: { xs: 28, md: 40 } }}>{branding.text}</Typography>
        )}
        <Box
          sx={{
            overflow: 'hidden',
            touchAction: 'none',
            borderRadius: 4,
            width: '100%',
            maxWidth: 1000,
            aspectRatio: isNewPhoto ? '16/10' : '3/2', // 3:2 für existierende Fotos, 16:10 für Kamera
            background: '#222',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          {isNewPhoto ? (
            // Kamera-Vorschau für neue Foto-Aufnahme
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
              📷 Kamera bereit
            </Box>
          ) : (
            // Existierendes Foto anzeigen
            <img
              ref={imgRef}
              src={`http://localhost:3001/photos/${id}`}
              alt={id}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover', // Format-füllend statt contain
                borderRadius: 16,
                transform: `scale(${zoom}) translateX(${swipeOffset}px)`,
                transition: swipeAnimating ? 'transform 0.15s' : isZoomed ? 'none' : 'transform 0.2s',
                touchAction: 'none',
                background: '#222',
              }}
              draggable={false}
              onError={(e) => {
                // Fallback zu lokalen Fotos wenn Backend nicht erreichbar
                const target = e.target as HTMLImageElement;
                target.src = `/photos/${id}`;
              }}
              onWheel={e => {
                if (e.ctrlKey) {
                  setZoom(z => Math.max(1, Math.min(3, z + (e.deltaY < 0 ? 0.1 : -0.1))));
                  setIsZoomed(true);
                }
              }}
            />
          )}
          
          {/* Auslöse-Buttons nur bei neuen Fotos anzeigen */}
          {isNewPhoto && (
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {/* Selbstauslöser-Button */}
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
                  }}
                  onClick={handleTimerShoot}
                >
                  ⏰
                </Box>
                {/* Haupt-Auslöser - iPhone-Style mit integriertem Countdown */}
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: countdown !== null ? '#1976d2' : (shooting ? '#1976d2' : '#fff'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    border: '4px solid #333',
                    fontSize: countdown !== null ? '2.5rem' : '2rem',
                    fontWeight: countdown !== null ? 700 : 400,
                    transform: shooting ? 'scale(0.9)' : 'scale(1)',
                    transition: 'all 0.1s',
                    '&:hover': { backgroundColor: countdown !== null ? '#1976d2' : (shooting ? '#1976d2' : '#f5f5f5') },
                    color: countdown !== null ? '#fff' : '#000'
                  }}
                  onClick={handleShoot}
                  disabled={shooting || countdown !== null}
                >
                  {countdown !== null ? countdown : (shooting ? '📸' : '')}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
        
        
        <Button variant="outlined" color="primary" sx={{ mt: 3 }} onClick={() => navigate('/gallery')}>
          Zurück zur Galerie
        </Button>
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
              ←
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
              →
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

export default PhotoPage;
