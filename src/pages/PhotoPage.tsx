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

  return (
    <Box>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/gallery')}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Foto-Ansicht</Typography>
        </Toolbar>
      </AppBar>
      <Box p={2} display="flex" flexDirection="column" alignItems="center">
        {branding.type === 'logo' && branding.logo && (
          <img src={branding.logo} alt="Branding Logo" style={{ maxHeight: 60, marginBottom: 8 }} />
        )}
        {branding.type === 'text' && branding.text && (
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>{branding.text}</Typography>
        )}
        <Box
          sx={{
            overflow: 'hidden',
            touchAction: 'none',
            borderRadius: 2,
            maxWidth: '100%',
            maxHeight: 400,
            position: 'relative',
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
              maxWidth: '100%',
              maxHeight: 400,
              borderRadius: 16,
              transform: `scale(${zoom}) translateX(${swipeOffset}px)` ,
              transition: swipeAnimating ? 'transform 0.15s' : isZoomed ? 'none' : 'transform 0.2s',
              touchAction: 'none',
            }}
            draggable={false}
            onWheel={e => {
              // Optional: Zoom per Mausrad für Desktop
              if (e.ctrlKey) {
                setZoom(z => Math.max(1, Math.min(3, z + (e.deltaY < 0 ? 0.1 : -0.1))));
                setIsZoomed(true);
              }
            }}
          />
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
