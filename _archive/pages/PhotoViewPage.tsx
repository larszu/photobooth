import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  IconButton, 
  Typography, 
  Breadcrumbs, 
  Link,
  CircularProgress,
  Fade,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Home as HomeIcon,
  Photo as PhotoIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import SmartShareDialog from '../components/SmartShareDialog';
import SmartShareV2Dialog from '../components/SmartShareV2Dialog';
import BulkSmartShareDialog from '../components/BulkSmartShareDialog';

interface PhotoData {
  filename: string;
  url: string;
  thumbnailUrl: string;
  date: string;
  folder?: string;
}

const PhotoViewPage: React.FC = () => {
  const { filename, folder } = useParams<{ filename: string; folder?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [photo, setPhoto] = useState<PhotoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialog, setShareDialog] = useState(false);
  const [shareV2Dialog, setShareV2Dialog] = useState(false);
  const [bulkShareDialog, setBulkShareDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intelligente Navigation zurück
  const getBackUrl = useCallback(() => {
    const state = location.state as any;
    
    // Wenn wir aus der Trash-Seite kommen
    if (state?.from === 'trash') {
      return '/trash';
    }
    
    // Wenn wir aus einer spezifischen Ordner-Galerie kommen
    if (state?.from === 'folder' && state?.folder) {
      return `/gallery/folder/${state.folder}`;
    }
    
    // Wenn wir einen Ordner-Parameter haben
    if (folder) {
      return `/gallery/folder/${folder}`;
    }
    
    // Wenn wir aus der Hauptgalerie kommen oder Standard
    if (state?.from === 'gallery' || !state?.from) {
      return '/gallery';
    }
    
    // Fallback zur Galerie
    return '/gallery';
  }, [location.state, folder]);

  // Foto-Daten laden
  useEffect(() => {
    if (!filename) {
      setError('Kein Dateiname angegeben');
      setLoading(false);
      return;
    }

    const loadPhoto = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // API-Endpoint basierend auf Ordner bestimmen
        const endpoint = folder 
          ? `/api/photos/folder/${folder}/${filename}`
          : `/api/photos/${filename}`;
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Foto nicht gefunden');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.photo) {
          throw new Error(data.error || 'Foto konnte nicht geladen werden');
        }
        
        setPhoto(data.photo);
      } catch (err) {
        console.error('Error loading photo:', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden des Fotos');
      } finally {
        setLoading(false);
      }
    };

    loadPhoto();
  }, [filename, folder]);

  // Touch-Events für Zoom und Swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 500 && tapLength > 0) {
        // Double tap - Toggle zoom
        if (zoom === 1) {
          setZoom(2);
        } else {
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }
      }
      
      setLastTap(currentTime);
    }
  }, [lastTap, zoom]);

  // Foto löschen
  const handleDelete = async () => {
    if (!photo) return;

    try {
      const endpoint = folder 
        ? `/api/photos/folder/${folder}/${photo.filename}`
        : `/api/photos/${photo.filename}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Fotos');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Foto wurde gelöscht');
        // Nach kurzer Verzögerung zurück navigieren
        setTimeout(() => {
          navigate(getBackUrl());
        }, 1000);
      } else {
        throw new Error(data.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      setError(error instanceof Error ? error.message : 'Fehler beim Löschen des Fotos');
    }
    
    setDeleteDialog(false);
  };

  // Share-Dialog schließen und zurück navigieren
  const handleShareClose = () => {
    setShareDialog(false);
    setShareV2Dialog(false);
    setBulkShareDialog(false);
    // Nach dem Teilen zurück zur vorherigen Seite
    setTimeout(() => {
      navigate(getBackUrl());
    }, 300);
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <IconButton 
          onClick={() => navigate(getBackUrl())}
          sx={{ mb: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        
        <Button 
          variant="contained" 
          onClick={() => navigate(getBackUrl())}
        >
          Zurück zur Galerie
        </Button>
      </Box>
    );
  }

  if (!photo) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Foto nicht gefunden
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#000',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Freistehender Zurück-Button oben links */}
      <IconButton 
        onClick={() => navigate(getBackUrl())}
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

      {/* Action Buttons oben rechts */}
      <Box sx={{
        position: 'fixed',
        top: { xs: 16, sm: 20 },
        right: { xs: 16, sm: 20 },
        zIndex: 1000,
        display: 'flex',
        gap: 1
      }}>
        <IconButton 
          onClick={() => setShareV2Dialog(true)}
          sx={{
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
          <ShareIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        </IconButton>
        
        <IconButton 
          onClick={() => setDeleteDialog(true)}
          sx={{
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            backgroundColor: 'rgba(220, 53, 69, 0.7)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            '&:hover': { 
              backgroundColor: 'rgba(220, 53, 69, 0.8)',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.2s'
          }}
        >
          <DeleteIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        </IconButton>
      </Box>

      {/* Versteckte Breadcrumbs für Navigation-Context */}
      <Breadcrumbs 
        aria-label="breadcrumb" 
        sx={{ 
          display: 'none',
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999,
          color: 'white'
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
        {folder && (
          <Link 
            underline="hover" 
            color="inherit" 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/gallery/folder/${folder}`);
            }}
          >
            {folder}
          </Link>
        )}
        <Typography 
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <PhotoIcon fontSize="inherit" />
          {photo.filename}
        </Typography>
      </Breadcrumbs>

      {/* Foto-Container */}
      <Box
        ref={containerRef}
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: zoom > 1 ? 'grab' : 'zoom-in',
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
      >
        <Fade in={!loading} timeout={500}>
          <img
            ref={imageRef}
            src={photo.url}
            alt={photo.filename}
            style={{
              maxWidth: zoom === 1 ? '100%' : 'none',
              maxHeight: zoom === 1 ? '100%' : 'none',
              width: zoom === 1 ? 'auto' : `${zoom * 100}%`,
              height: zoom === 1 ? 'auto' : 'auto',
              objectFit: 'contain',
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              transition: zoom === 1 ? 'transform 0.3s ease' : 'none',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
            draggable={false}
          />
        </Fade>
      </Box>

      {/* Foto-Info unten (optional) */}
      <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
        color: 'white',
        p: 2,
        display: 'none' // Versteckt für clean look
      }}>
        <Typography variant="h6">{photo.filename}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {new Date(photo.date).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Typography>
      </Box>

      {/* Share Dialogs */}
      <SmartShareDialog 
        open={shareDialog} 
        onClose={handleShareClose}
        photos={[photo.filename]}
      />
      
      <SmartShareV2Dialog 
        open={shareV2Dialog} 
        onClose={handleShareClose}
        photos={[photo.filename]}
      />
      
      <BulkSmartShareDialog 
        open={bulkShareDialog} 
        onClose={handleShareClose}
        photos={[photo.filename]}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog} 
        onClose={() => setDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Foto löschen
        </DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie das Foto "{photo.filename}" wirklich löschen? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage('')} 
          severity="success"
          icon={<CheckCircleIcon />}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PhotoViewPage;

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
