import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import SmartShareDialog from '../components/SmartShareDialog';
import SmartShareV2Dialog from '../components/SmartShareV2Dialog';

const PhotoViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const decodedId = id ? decodeURIComponent(id) : '';
  const location = useLocation();
  const navigate = useNavigate();
  
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
    const fromPath = (location.state as any)?.from;
    if (fromPath) {
      return fromPath;
    }
    
    if (decodedId.includes('/')) {
      const folderName = decodedId.split('/')[0];
      if (/^\d{8}_Photobooth$/.test(folderName)) {
        return `/gallery/folder/${encodeURIComponent(folderName)}`;
      }
    }
    
    return '/gallery';
  };

  const handleBackNavigation = () => {
    const backUrl = getBackUrl();
    console.log('Navigating back to:', backUrl);
    navigate(backUrl);
  };

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
          navigate(`/view/${encodeURIComponent(allPhotos[currentIndex - 1])}`);
        } else if (dx < -50 && currentIndex < allPhotos.length - 1) {
          navigate(`/view/${encodeURIComponent(allPhotos[currentIndex + 1])}`);
        }
      }, 150);
    } else {
      setSwipeOffset(0);
    }
    setTouchStart(null);
    setTouchMove(null);
  };

  const handleDoubleClick = () => {
    // Bei existierenden Fotos nichts machen
  };

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      backgroundColor: '#ff0000', // DEBUG: Roter Hintergrund
      border: '10px solid #00ff00' // DEBUG: Grüner Rand
    }}>
      {/* Zurück-Button */}
      <IconButton 
        onClick={handleBackNavigation}
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

      {/* Branding als festes Overlay */}
      {branding.type === 'logo' && branding.logo && (
        <Box sx={{ 
          position: 'fixed', 
          top: { xs: 80, md: 100 }, 
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1001,
          '& img': {
            maxHeight: '80px',
            display: 'block'
          }
        }}>
          <img src={branding.logo} alt="Branding Logo" />
        </Box>
      )}
      {branding.type === 'text' && branding.text && (
        <Typography 
          variant="h3" 
          sx={{ 
            position: 'fixed', 
            top: { xs: 80, md: 100 }, 
            left: '50%',
            transform: 'translateX(-50%)',
            fontWeight: 700, 
            fontSize: { xs: 24, md: 32 },
            zIndex: 1001,
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            textAlign: 'center'
          }}
        >
          {branding.text}
        </Typography>
      )}
      
      {/* Foto-Container - perfekt zentriert */}
      <Box
        sx={{
          overflow: 'hidden',
          touchAction: 'none',
          borderRadius: 4,
          width: { 
            xs: '90vw',
            sm: '85vw',
            md: '70vw',
            lg: '60vw',
            xl: '50vw'
          },
          maxWidth: 900,
          aspectRatio: '3/2',
          background: '#222',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
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
            objectFit: 'cover',
            borderRadius: '16px',
            background: '#222',
            transform: `scale(${zoom}) translateX(${swipeOffset}px)`,
            transition: swipeAnimating ? 'transform 0.15s' : isZoomed ? 'none' : 'transform 0.2s',
            touchAction: 'none',
          }}
          draggable={false}
          onError={(e) => {
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
        
        {/* Navigation Buttons */}
        <Box sx={{
          position: 'absolute',
          bottom: { xs: 16, md: 24 },
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingX: { xs: 2, md: 3 },
          pointerEvents: 'none',
        }}>
          <IconButton
            onClick={handleBackNavigation}
            sx={{
              width: { xs: 44, md: 48 },
              height: { xs: 44, md: 48 },
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              pointerEvents: 'auto',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': { 
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s'
            }}
          >
            <ArrowBackIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
          </IconButton>
          
          <Box
            sx={{
              padding: { xs: '6px 12px', md: '8px 16px' },
              borderRadius: '20px',
              backgroundColor: 'rgba(25, 118, 210, 0.9)',
              color: '#fff',
              fontSize: { xs: '13px', md: '14px' },
              fontWeight: 500,
              cursor: 'pointer',
              pointerEvents: 'auto',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
              minWidth: { xs: '100px', md: '120px' },
              '&:hover': { 
                backgroundColor: 'rgba(25, 118, 210, 1)',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s'
            }}
            onClick={() => navigate('/photo/new')}
          >
            📸 Neues Foto
          </Box>
          
          <IconButton
            onClick={() => setShareV2DialogOpen(true)}
            sx={{
              width: { xs: 44, md: 48 },
              height: { xs: 44, md: 48 },
              backgroundColor: 'rgba(76, 175, 80, 0.8)',
              color: '#fff',
              pointerEvents: 'auto',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': { 
                backgroundColor: 'rgba(76, 175, 80, 1)',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s'
            }}
          >
            <ShareIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
          </IconButton>
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
