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
