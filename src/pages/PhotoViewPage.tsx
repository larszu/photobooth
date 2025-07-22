import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, AppBar, Toolbar, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import SmartShareDialog from '../components/SmartShareDialog';
import SmartShareV2Dialog from '../components/SmartShareV2Dialog';

const PhotoViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const decodedId = id ? decodeURIComponent(id) : '';
  const location = useLocation();
  const navigate = useNavigate();
  
  const [qr, setQr] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchMove, setTouchMove] = useState<{ x: number; y: number } | null>(null);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeAnimating, setSwipeAnimating] = useState(false);
  const [branding, setBranding] = useState<{ type: 'logo' | 'text', logo?: string, text?: string }>({ type: 'text', text: '' });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareV2DialogOpen, setShareV2DialogOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intelligente Navigation: Bestimme die korrekte Zurück-URL
  const getBackUrl = () => {
    // Check if we came from a specific folder view based on the URL state
    const fromPath = (location.state as any)?.from;
    
    if (fromPath) {
      return fromPath;
    }
    
    // Fallback: Extract folder from photo path and determine back URL
    if (decodedId.includes('/')) {
      const folderName = decodedId.split('/')[0];
      // Check if this looks like a date folder (YYYYMMDD_Photobooth)
      if (/^\d{8}_Photobooth$/.test(folderName)) {
        return `/gallery/folder/${encodeURIComponent(folderName)}`;
      }
    }
    
    // Default fallback to main gallery overview
    return '/gallery';
  };

  const handleBackNavigation = () => {
    const backUrl = getBackUrl();
    console.log('Navigating back to:', backUrl);
    navigate(backUrl);
  };

  // Lade QR-Code für das Foto
  useEffect(() => {
    fetch(`http://localhost:3001/api/photos/${encodeURIComponent(decodedId)}/qr`)
      .then(res => res.json())
      .then(data => {
        console.log('QR response:', data);
        setQr(data.qr_code || data.qr);
      })
      .catch(err => console.error('Error loading QR code:', err));
  }, [decodedId]);

  // Lade alle Fotos und setze aktuellen Index
  useEffect(() => {
    fetch('http://localhost:3001/api/photos')
      .then(res => res.json())
      .then(data => {
        console.log('Photos response:', data);
        const photoArray = Array.isArray(data.photos) 
          ? data.photos.map((photo: any) => typeof photo === 'string' ? photo : photo.filename)
          : [];
        setAllPhotos(photoArray);
        const idx = photoArray.findIndex((p: string) => p === decodedId);
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
        handleBackNavigation();
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
          navigate(`/view/${encodeURIComponent(allPhotos[currentIndex - 1])}`);
        } else if (dx < -50 && currentIndex < allPhotos.length - 1) {
          // Swipe left: nächstes Bild
          navigate(`/view/${encodeURIComponent(allPhotos[currentIndex + 1])}`);
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
    // Bei existierenden Fotos nichts machen
  };

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
            onClick={handleBackNavigation}
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
            Foto: {decodedId}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
        maxWidth: 1000, // Reduziert von 1200 auf 1000
        margin: '0 auto',
        pt: { xs: 1, md: 2 }, // Reduziertes Padding oben
        pb: { xs: 1, md: 2 }, // Reduziertes Padding unten
        px: { xs: 1, md: 2 }, // Horizontales Padding hinzugefügt
      }}>
        {branding.type === 'logo' && branding.logo && (
          <img src={branding.logo} alt="Branding Logo" style={{ maxHeight: 120, marginBottom: 16 }} />
        )}
        {branding.type === 'text' && branding.text && (
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 700, fontSize: { xs: 28, md: 40 } }}>{branding.text}</Typography>
        )}
        
        {/* Foto-Anzeige im 3:2 Format */}
        <Box
          sx={{
            overflow: 'hidden',
            touchAction: 'none',
            borderRadius: 4,
            width: { 
              xs: '95%',
              sm: '90%',
              md: '80%',
              lg: '70%',
              xl: '60%'
            },
            maxWidth: 800, // Reduziert von 1000 auf 800
            aspectRatio: '3/2', // 3:2 Format für Einzelansicht
            background: '#222',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto', // Zentrieren
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          <img
            ref={imgRef}
            src={`http://localhost:3001/photos/${decodedId}`}
            alt={decodedId}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover', // Format-füllend
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
              target.src = `/photos/${decodedId}`;
            }}
            onWheel={e => {
              if (e.ctrlKey) {
                setZoom(z => Math.max(1, Math.min(3, z + (e.deltaY < 0 ? 0.1 : -0.1))));
                setIsZoomed(true);
              }
            }}
          />
          
          {/* Navigation Buttons als Overlay */}
          <Box sx={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            paddingX: 3, // Abstand von den Rändern
            pointerEvents: 'none',
          }}>
            {/* Zurück zur Galerie Button - links positioniert */}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                pointerEvents: 'auto',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': { 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s'
              }}
              onClick={handleBackNavigation}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </Box>
            
            {/* Weiteres Foto aufnehmen Button - perfekt mittig */}
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: 'rgba(25, 118, 210, 0.9)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                pointerEvents: 'auto',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': { 
                  backgroundColor: 'rgba(25, 118, 210, 1)',
                  transform: 'translateX(-50%) scale(1.05)'
                },
                transition: 'all 0.2s'
              }}
              onClick={() => navigate('/photo/new')}
            >
              📸 Neues Foto
            </Box>
            
            {/* Teilen Button - rechts positioniert */}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(76, 175, 80, 0.8)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                pointerEvents: 'auto',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'absolute',
                right: 24, // Abstand vom rechten Rand
                '&:hover': { 
                  backgroundColor: 'rgba(76, 175, 80, 1)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s'
              }}
              onClick={() => {
                setShareV2DialogOpen(true);
              }}
            >
              <ShareIcon sx={{ fontSize: 20 }} />
            </Box>
          </Box>
        </Box>
        
      </Box>
      
      {/* Smart Share Dialogs */}
      {decodedId && (
        <>
          <SmartShareDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            photoId={decodedId}
          />
          <SmartShareV2Dialog
            open={shareV2DialogOpen}
            onClose={() => setShareV2DialogOpen(false)}
            photoId={decodedId}
          />
        </>
      )}
    </Box>
  );
};

export default PhotoViewPage;
