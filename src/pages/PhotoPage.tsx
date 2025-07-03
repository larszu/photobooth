import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, AppBar, Toolbar, IconButton, Button, CircularProgress, Dialog } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeIcon from '@mui/icons-material/QrCode';

const PhotoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchMove, setTouchMove] = useState<{ x: number; y: number } | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeAnimating, setSwipeAnimating] = useState(false);
  const [branding, setBranding] = useState<{ type: 'logo' | 'text', logo?: string, text?: string }>({ type: 'logo' });
  // Selbstauslöser-Logik
  const [timerMode, setTimerMode] = useState<3 | 5 | 10>(3);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shooting, setShooting] = useState(false);
  const [timerDialog, setTimerDialog] = useState(false);
  const navigate = useNavigate();
  const imgRef = useRef<HTMLImageElement>(null);

  // Lade QR-Code
  useEffect(() => {
    fetch(`/api/qrcode?mode=single&photo=${id}`)
      .then(res => res.json())
      .then(data => setQr(data.qr))
      .finally(() => setLoading(false));
  }, [id]);

  // Lade alle Fotos und setze aktuellen Index
  useEffect(() => {
    fetch('/api/photos')
      .then(res => res.json())
      .then(data => {
        setAllPhotos(data.photos);
        const idx = data.photos.findIndex((p: string) => p === id);
        setCurrentIndex(idx);
      });
  }, [id]);

  // Lade Branding-Daten
  useEffect(() => {
    fetch('/api/branding')
      .then(res => res.json())
      .then(data => setBranding(data));
  }, [id]);

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
    setShowDialog(true);
  };

  // Foto aufnehmen (direkt oder mit Timer)
  const handleShoot = async () => {
    setShooting(true);
    try {
      const res = await fetch('/api/camera/shoot', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.filename) {
        // Nach Aufnahme zur neuen Foto-Seite navigieren
        navigate(`/photo/${data.filename}`);
      } else {
        alert('Fehler beim Aufnehmen des Fotos');
      }
    } catch (e) {
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
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/gallery')}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Foto-Ansicht</Typography>
        </Toolbar>
      </AppBar>
      <Box p={2} display="flex" flexDirection="column" alignItems="center" sx={{
        width: '100vw',
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
            maxHeight: 900,
            aspectRatio: '16/10',
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
          <img
            ref={imgRef}
            src={`/photos/${id}`}
            alt={id}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: 16,
              transform: `scale(${zoom}) translateX(${swipeOffset}px)` ,
              transition: swipeAnimating ? 'transform 0.15s' : isZoomed ? 'none' : 'transform 0.2s',
              touchAction: 'none',
              background: '#222',
            }}
            draggable={false}
            onWheel={e => {
              if (e.ctrlKey) {
                setZoom(z => Math.max(1, Math.min(3, z + (e.deltaY < 0 ? 0.1 : -0.1))));
                setIsZoomed(true);
              }
            }}
          />
          {/* iPhone-Style Auslöse-Button und Selbstauslöser */}
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
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#222',
                border: '3px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: shooting || countdown !== null ? 'none' : 'auto',
                cursor: shooting || countdown !== null ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 8px #0008',
                mr: 2,
                position: 'relative',
                transition: 'background 0.2s',
                opacity: countdown !== null ? 0.3 : 1,
              }}
              onClick={() => !shooting && countdown === null && handleTimerShoot()}
            >
              <Typography variant="h6" color="#fff" fontWeight={700}>
                ⏱
              </Typography>
            </Box>
            {/* Auslöse-Button (zeigt Countdown, wenn aktiv) */}
            <Box
              sx={{
                width: countdown !== null ? 120 : 72,
                height: countdown !== null ? 120 : 72,
                borderRadius: '50%',
                background: countdown !== null ? 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)' : (shooting ? '#bbb' : 'radial-gradient(circle at 50% 50%, #fff 70%, #eee 100%)'),
                border: countdown !== null ? '10px solid #fff' : '6px solid #fff',
                boxShadow: countdown !== null ? '0 0 32px #1976d2cc' : '0 0 16px #000a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: shooting || countdown !== null ? 'none' : 'auto',
                cursor: shooting || countdown !== null ? 'not-allowed' : 'pointer',
                transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
                ':active': { background: '#ddd' },
                position: 'relative',
              }}
              onClick={() => !shooting && countdown === null && handleShoot()}
            >
              {countdown !== null ? (
                <Typography variant="h1" color="#fff" fontWeight={900} sx={{ fontSize: 72, transition: 'all 0.2s', userSelect: 'none', textShadow: '0 4px 24px #000a' }}>{countdown}</Typography>
              ) : (
                <Box sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid #ccc',
                }} />
              )}
            </Box>
          </Box>
          {/* Timer-Auswahl-Dialog */}
          <Dialog open={timerDialog} onClose={() => setTimerDialog(false)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>
            <Box p={2} display="flex" flexDirection="column" alignItems="center">
              <Typography variant="h6" sx={{ mb: 2 }}>Selbstauslöser</Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton
                  size="large"
                  sx={{ color: '#1976d2', opacity: timerMode === 3 ? 0.3 : 1 }}
                  disabled={timerMode === 3}
                  onClick={() => setTimerMode(timerOptions[Math.max(0, timerOptions.indexOf(timerMode) - 1)])}
                >
                  &#8592;
                </IconButton>
                <Typography variant="h2" color="primary" fontWeight={700} sx={{ minWidth: 60, textAlign: 'center' }}>{timerMode}s</Typography>
                <IconButton
                  size="large"
                  sx={{ color: '#1976d2', opacity: timerMode === 10 ? 0.3 : 1 }}
                  disabled={timerMode === 10}
                  onClick={() => setTimerMode(timerOptions[Math.min(timerOptions.length - 1, timerOptions.indexOf(timerMode) + 1)])}
                >
                  &#8594;
                </IconButton>
              </Box>
              <Button variant="contained" color="primary" sx={{ mt: 3, minWidth: 120, fontSize: 20 }} onClick={startTimer}>
                Start
              </Button>
            </Box>
          </Dialog>
          </Box>
        </Box>
        {loading ? <CircularProgress sx={{ mt: 2 }} /> : qr && (
          <Box mt={2}>
            <img src={qr} alt="QR-Code" style={{ width: 180, height: 180 }} />
            <Typography variant="body2" align="center" mt={1}>QR-Code zum Teilen</Typography>
          </Box>
        )}
        <Button variant="outlined" color="primary" sx={{ mt: 3 }} onClick={() => navigate('/gallery')}>Zurück zur Galerie</Button>
      </Box>
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md">
        <Box p={2} display="flex" flexDirection="column" alignItems="center">
          <img src={`/photos/${id}`} alt={id} style={{ maxWidth: '90vw', maxHeight: '80vh' }} />
        </Box>
      </Dialog>
    </Box>
  );
};

export default PhotoPage;
