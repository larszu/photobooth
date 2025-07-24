import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardActionArea, 
  CardMedia, 
  CircularProgress, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Button, 
  Checkbox,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PhotoSelectionBar from '../components/PhotoSelectionBar';
import BulkSmartShareDialog from '../components/BulkSmartShareDialog';
import { AuthContext } from '../context/AuthContext';

const GalleryPage: React.FC = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // desc = neueste zuerst
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ 
    open: false, message: '', severity: 'success' 
  });
  const [bulkShareDialogOpen, setBulkShareDialogOpen] = useState(false);
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  // Deaktiviere Auto-Logout auf der Gallery-Seite
  useEffect(() => {
    if (authContext?.disableAutoLogout) {
      authContext.disableAutoLogout();
    }
  }, [authContext]);

  console.log('GalleryPage rendered, photos:', photos, 'loading:', loading);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        // Versuche zuerst das Backend
        const response = await fetch('http://localhost:3001/api/photos');
        if (response.ok) {
          const data = await response.json();
          console.log('Photos response:', data);
          // Wenn data.photos ein Array von Objekten ist, extrahiere die Dateinamen
          const photoArray = Array.isArray(data.photos) 
            ? data.photos.map((photo: any) => typeof photo === 'string' ? photo : photo.filename)
            : [];
          setPhotos(photoArray.reverse());
        } else {
          throw new Error('Backend not available');
        }
      } catch (error) {
        console.error('Backend not available, using fallback photos:', error);
        // Fallback: Verwende die echten Fotos die in public/photos verfügbar sind
        const realPhotos = [
          '20190804_Hochzeit_Robin_Vanessa-042.jpg',
          '20190804_Hochzeit_Robin_Vanessa-044.jpg',
          '20191124_Jarno_Lena_081.jpg',
          '20200531_Adi_Epp_017.jpg',
          '20210207_Lifeline_012.jpg',
          '20240715_Radomski_Babybauch_001.jpg',
          'demo-portrait.jpg',
          'demo-landscape.jpg', 
          'demo-group.jpg',
          'demo-selfie.jpg',
          'demo-party.jpg',
          'photo-2025-07-07T21-52-44-051Z.jpg'
        ];
        setPhotos(realPhotos);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

  // Sortier-Funktion für Fotos
  const sortedPhotos = React.useMemo(() => {
    return [...photos].sort((a, b) => {
      // Extrahiere Datum aus Dateiname (photo-YYYY-MM-DDTHH-MM-SS-SSSZ.jpg oder YYYYMMDD_*)
      const getDateFromFilename = (filename: string): string => {
        // Format: photo-2025-07-07T21-52-44-051Z.jpg
        const isoMatch = filename.match(/photo-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
        if (isoMatch) {
          return isoMatch[1].replace(/T\d{2}-\d{2}-\d{2}-\d{3}Z/, ''); // Nur das Datum
        }
        
        // Format: YYYYMMDD_*
        const dateMatch = filename.match(/^(\d{8})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
        }
        
        // Fallback: Dateiname alphabetisch
        return filename;
      };
      
      const dateA = getDateFromFilename(a);
      const dateB = getDateFromFilename(b);
      
      if (sortOrder === 'desc') {
        return dateB.localeCompare(dateA); // Neueste zuerst
      } else {
        return dateA.localeCompare(dateB); // Älteste zuerst
      }
    });
  }, [photos, sortOrder]);

  const handleSortChange = (_event: React.MouseEvent<HTMLElement>, newSortOrder: 'asc' | 'desc') => {
    if (newSortOrder !== null) {
      setSortOrder(newSortOrder);
    }
  };

  // Multi-Select Handler Functions
  const handlePhotoSelect = (photoName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPhotos(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(photoName)) {
        newSelection.delete(photoName);
      } else {
        newSelection.add(photoName);
      }
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    setSelectedPhotos(new Set(sortedPhotos));
  };

  const handleDeselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const handleMoveToTrash = async () => {
    console.log('🗑️ handleMoveToTrash called with selected photos:', Array.from(selectedPhotos));
    
    try {
      const photoNames = Array.from(selectedPhotos);
      
      if (photoNames.length === 0) {
        console.warn('⚠️ No photos selected for deletion');
        setSnackbar({
          open: true,
          message: 'Keine Fotos ausgewählt',
          severity: 'error'
        });
        return;
      }
      
      console.log(`🔄 Processing ${photoNames.length} photos for trash`);
      
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      for (const photoName of photoNames) {
        try {
          console.log(`🗑️ Moving photo to trash: ${photoName}`);
          
          // Extrahiere nur den Dateinamen (ohne Ordnerpfad) für die API
          const filename = photoName.includes('/') ? photoName.split('/').pop() : photoName;
          console.log(`📁 Extracted filename: ${filename} from ${photoName}`);
          
          const url = `http://localhost:3001/api/photos/${encodeURIComponent(filename || photoName)}/trash`;
          console.log(`📍 Request URL: ${url}`);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log(`📡 Response for ${photoName}: ${response.status} ${response.statusText}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to move ${photoName}: ${response.status} - ${errorText}`);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          const result = await response.json();
          console.log(`✅ Successfully moved ${photoName}:`, result);
          successCount++;
          
        } catch (photoError) {
          console.error(`❌ Error moving photo ${photoName}:`, photoError);
          errorCount++;
          const errorMessage = photoError instanceof Error ? photoError.message : String(photoError);
          errors.push(`${photoName}: ${errorMessage}`);
        }
      }
      
      // Erfolgs-/Fehler-Meldung
      if (successCount > 0) {
        setSnackbar({
          open: true,
          message: `${successCount} Fotos in den Papierkorb verschoben${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`,
          severity: successCount === photoNames.length ? 'success' : 'error'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Fehler beim Verschieben der Fotos: ${errors[0] || 'Unbekannter Fehler'}`,
          severity: 'error'
        });
      }
      
      // Log errors for debugging
      if (errors.length > 0) {
        console.error('🚨 Errors during move to trash:', errors);
      }
      
      // Refresh photos - auch bei Teilfehlern
      console.log('🔄 Refreshing photo list...');
      setSelectedPhotos(new Set());
      setSelectionMode(false);
      
      try {
        const response = await fetch('http://localhost:3001/api/photos');
        if (response.ok) {
          const data = await response.json();
          const photoArray = Array.isArray(data.photos) 
            ? data.photos.map((photo: any) => typeof photo === 'string' ? photo : photo.filename)
            : [];
          setPhotos(photoArray.reverse());
          console.log(`📷 Refreshed photo list: ${photoArray.length} photos`);
        } else {
          console.error('❌ Failed to refresh photos:', response.status, response.statusText);
        }
      } catch (refreshError) {
        console.error('❌ Error refreshing photos:', refreshError);
      }
      
    } catch (error) {
      console.error('❌ Critical error in handleMoveToTrash:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSnackbar({
        open: true,
        message: `Kritischer Fehler: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  const handleShare = () => {
    if (selectedPhotos.size === 0) {
      setSnackbar({
        open: true,
        message: 'Keine Fotos ausgewählt zum Teilen',
        severity: 'error'
      });
      return;
    }

    // Öffne den Bulk Smart Share Dialog
    setBulkShareDialogOpen(true);
  };

  const handleCloseSelection = () => {
    setSelectionMode(false);
    setSelectedPhotos(new Set());
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Freistehende Buttons */}
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
      
      <Button 
        onClick={() => setSelectionMode(!selectionMode)}
        sx={{
          position: 'fixed',
          top: { xs: 16, sm: 20 },
          right: { xs: 16, sm: 20 },
          zIndex: 1000,
          px: { xs: 2, sm: 3 },
          py: { xs: 1, sm: 1.5 },
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 2,
          fontSize: { xs: '0.8rem', sm: '0.9rem' },
          fontWeight: 500,
          textTransform: 'none',
          '&:hover': { 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.2s'
        }}
      >
        {selectionMode ? 'Abbrechen' : 'Auswählen'}
      </Button>
      
      <Box 
        sx={{ 
          flex: 1,
          p: { xs: 1, sm: 2, md: 3 },
          maxWidth: '100vw',
          overflow: 'hidden',
          pt: { xs: 8, sm: 10 } // Platz für die freistehenden Buttons
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress size={60} />
          </Box>
        ) : (
          <>
            {photos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  Keine Fotos verfügbar
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, opacity: 0.7 }}>
                  Erstelle dein erstes Foto!
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  mb: 3,
                  gap: 3
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {sortedPhotos.length} {sortedPhotos.length === 1 ? 'Foto' : 'Fotos'} gesamt
                  </Typography>
                  
                  <ToggleButtonGroup
                    value={sortOrder}
                    exclusive
                    onChange={handleSortChange}
                    aria-label="Sortierung"
                    size="small"
                    sx={{ 
                      '& .MuiToggleButton-root': {
                        px: { xs: 1.5, md: 2 },
                        py: { xs: 0.5, md: 1 },
                        border: '1px solid',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                        },
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'white',
                        },
                      }
                    }}
                  >
                    <ToggleButton value="desc" aria-label="Neueste zuerst">
                      <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        Neueste
                      </Typography>
                    </ToggleButton>
                    <ToggleButton value="asc" aria-label="Älteste zuerst">
                      <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        Älteste
                      </Typography>
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(2, 1fr)',
                      sm: 'repeat(3, 1fr)',
                      md: 'repeat(4, 1fr)',
                      lg: 'repeat(5, 1fr)',
                      xl: 'repeat(6, 1fr)'
                    },
                    gap: { xs: 1, sm: 2, md: 3 },
                    width: '100%'
                  }}
                >
                {sortedPhotos.map((photo) => (
                  <Card 
                    key={photo}
                    sx={{ 
                      borderRadius: { xs: 2, md: 3 },
                      overflow: 'hidden',
                      aspectRatio: '3/2',
                      position: 'relative',
                      border: selectionMode && selectedPhotos.has(photo) ? '3px solid' : '1px solid',
                      borderColor: selectionMode && selectedPhotos.has(photo) ? 'primary.main' : 'divider',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        transition: 'transform 0.2s ease-in-out',
                        boxShadow: 4
                      }
                    }}
                  >
                    {/* Selection Checkbox */}
                    {selectionMode && (
                      <Checkbox
                        checked={selectedPhotos.has(photo)}
                        onChange={() => {
                          const newSelection = new Set(selectedPhotos);
                          if (newSelection.has(photo)) {
                            newSelection.delete(photo);
                          } else {
                            newSelection.add(photo);
                          }
                          setSelectedPhotos(newSelection);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          zIndex: 10,
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,1)'
                          }
                        }}
                      />
                    )}
                    
                    <CardActionArea 
                      onClick={selectionMode ? 
                        (e) => handlePhotoSelect(photo, e) : 
                        () => navigate(`/view/${encodeURIComponent(photo)}`, { 
                          state: { from: '/gallery/all' }
                        })
                      }
                      sx={{ height: '100%' }}
                    >
                      <CardMedia
                        component="img"
                        height="100%"
                        image={`http://localhost:3001/api/photos/${encodeURIComponent(photo.split('/').pop() || photo)}/thumbnail?size=300`}
                        alt={photo}
                        sx={{
                          objectFit: 'cover', // Beschneidet das Bild um den Rahmen zu füllen
                          aspectRatio: '3/2',
                          width: '100%',
                          height: '100%'
                        }}
                        onError={(e) => {
                          // Fallback zu lokalen Fotos wenn Backend nicht erreichbar
                          const target = e.target as HTMLImageElement;
                          target.src = `/photos/${photo}`;
                        }}
                      />
                    </CardActionArea>
                  </Card>
                ))}
                </Box>
              </>
            )}
            
            {/* Foto aufnehmen Button - nur wenn nicht im Auswahlmodus */}
            {!selectionMode && (
              <Box 
                sx={{ 
                  position: 'fixed',
                  bottom: { xs: 16, md: 24 },
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1000
                }}
              >
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  startIcon={<PhotoCameraIcon />} 
                  onClick={() => navigate('/photo/new')}
                  sx={{
                    borderRadius: { xs: 3, md: 4 },
                    px: { xs: 3, md: 4 },
                    py: { xs: 1.5, md: 2 },
                    fontSize: { xs: '1rem', md: '1.2rem' },
                    fontWeight: 600,
                    boxShadow: 4,
                    backgroundColor: '#1976d2',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                      boxShadow: 6,
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  Foto aufnehmen
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Photo Selection Bar */}
      {selectionMode && (
        <PhotoSelectionBar
          selectedCount={selectedPhotos.size}
          totalCount={sortedPhotos.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onMoveToTrash={handleMoveToTrash}
          onShare={handleShare}
          onClose={handleCloseSelection}
        />
      )}

      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Bulk Smart Share Dialog */}
      <BulkSmartShareDialog
        open={bulkShareDialogOpen}
        onClose={() => setBulkShareDialogOpen(false)}
        photoIds={Array.from(selectedPhotos)}
      />
    </Box>
  );
};

export default GalleryPage;
