import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardActionArea,
  AppBar, 
  Toolbar, 
  IconButton, 
  Button,
  Link,
  Checkbox,
  Snackbar,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import HomeIcon from '@mui/icons-material/Home';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PhotoSelectionBar from '../components/PhotoSelectionBar';
import BulkSmartShareDialog from '../components/BulkSmartShareDialog';

interface Photo {
  filename: string;
  path: string;
  folder: string;
  size: number;
  created: string;
}

const FolderGalleryPage: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderDisplayName, setFolderDisplayName] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // desc = neueste zuerst
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ 
    open: false, message: '', severity: 'success' 
  });
  const [bulkShareDialogOpen, setBulkShareDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { folderName } = useParams<{ folderName: string }>();

  useEffect(() => {
    if (!folderName) {
      navigate('/gallery');
      return;
    }

    const loadFolderPhotos = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/folders/${encodeURIComponent(folderName)}/photos`);
        if (response.ok) {
          const data = await response.json();
          console.log('Folder photos response:', data);
          setPhotos(data.photos || []);
          
          // Datum aus Ordnername extrahieren (YYYYMMDD_Photobooth)
          const dateMatch = folderName.match(/^(\d{4})(\d{2})(\d{2})_Photobooth$/);
          const displayName = dateMatch ? `${dateMatch[3]}.${dateMatch[2]}.${dateMatch[1]}` : folderName;
          setFolderDisplayName(displayName);
        } else {
          console.error('Failed to load folder photos');
          setPhotos([]);
        }
      } catch (error) {
        console.error('Error loading folder photos:', error);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    loadFolderPhotos();
  }, [folderName, navigate]);

  // Sortier-Funktion für Fotos
  const sortedPhotos = React.useMemo(() => {
    return [...photos].sort((a, b) => {
      // Extrahiere Datum/Zeit aus Dateiname für genaue Sortierung
      const getDateTimeFromFilename = (filename: string): string => {
        // Format: photo-2025-07-07T21-52-44-051Z.jpg
        const isoMatch = filename.match(/photo-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
        if (isoMatch) {
          // Konvertiere zu vergleichbarem Format: YYYYMMDDHHMMSSMMM
          const fullDateTime = isoMatch[1]
            .replace(/-/g, '')  // Entferne Bindestriche
            .replace(/T/, '')   // Entferne T
            .replace(/:/g, '')  // Entferne Doppelpunkte (falls vorhanden)
            .replace(/Z/, '');  // Entferne Z
          return fullDateTime;
        }
        
        // Format: YYYYMMDD_* (ohne Zeit)
        const dateMatch = filename.match(/^(\d{8})/);
        if (dateMatch) {
          const dateStr = dateMatch[1] + '000000000'; // Pad mit Nullen für Tagesanfang
          return dateStr;
        }
        
        // Fallback: created timestamp wenn verfügbar, sonst Dateiname
        if (a.created && b.created) {
          return new Date(a.created).getTime().toString().padStart(17, '0');
        }
        
        // Letzter Fallback: Dateiname alphabetisch
        return filename;
      };
      
      const dateTimeA = getDateTimeFromFilename(a.filename);
      const dateTimeB = getDateTimeFromFilename(b.filename);
      
      if (sortOrder === 'desc') {
        return dateTimeB.localeCompare(dateTimeA); // Neueste zuerst
      } else {
        return dateTimeA.localeCompare(dateTimeB); // Älteste zuerst
      }
    });
  }, [photos, sortOrder]);

  const handleSortChange = (_event: React.MouseEvent<HTMLElement>, newSortOrder: 'asc' | 'desc') => {
    if (newSortOrder !== null) {
      setSortOrder(newSortOrder);
    }
  };

  // Multi-Select Handler Functions
  const handlePhotoSelect = (photoFilename: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPhotos(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(photoFilename)) {
        newSelection.delete(photoFilename);
      } else {
        newSelection.add(photoFilename);
      }
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    setSelectedPhotos(new Set(sortedPhotos.map(p => p.filename)));
  };

  const handleDeselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const handleMoveToTrash = async () => {
    try {
      const photoFilenames = Array.from(selectedPhotos);
      for (const filename of photoFilenames) {
        const response = await fetch(`http://localhost:3001/api/photos/${encodeURIComponent(filename)}/trash`, {
          method: 'POST'
        });
        if (!response.ok) {
          throw new Error(`Failed to move photo ${filename}`);
        }
      }
      
      setSnackbar({
        open: true,
        message: `${photoFilenames.length} Fotos in den Papierkorb verschoben`,
        severity: 'success'
      });
      
      // Refresh photos
      setSelectedPhotos(new Set());
      setSelectionMode(false);
      if (folderName) {
        const response = await fetch(`http://localhost:3001/api/folders/${encodeURIComponent(folderName)}/photos`);
        if (response.ok) {
          const data = await response.json();
          setPhotos(data.photos || []);
        }
      }
    } catch (error) {
      console.error('Error moving photos to trash:', error);
      setSnackbar({
        open: true,
        message: 'Fehler beim Verschieben der Fotos',
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

    // Konvertiere Dateinamen zu vollständigen Photo-IDs mit Ordner
    const photoIds = Array.from(selectedPhotos).map(filename => `${folderName}/${filename}`);
    setBulkShareDialogOpen(true);
  };

  const handleCloseSelection = () => {
    setSelectionMode(false);
    setSelectedPhotos(new Set());
  };

  const handlePhotoClick = (photo: Photo) => {
    navigate(`/view/${encodeURIComponent(`${photo.folder}/${photo.filename}`)}`, {
      state: { from: `/gallery/folder/${encodeURIComponent(folderName || '')}` }
    });
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
          minHeight: '100vh',
          p: { xs: 2, md: 3 },
          backgroundColor: '#f5f5f5',
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
            {sortedPhotos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  Keine Fotos in diesem Ordner
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, opacity: 0.7 }}>
                  Dieser Tagesordner ist noch leer.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/gallery')}
                  sx={{ mr: 2 }}
                >
                  Zurück zur Übersicht
                </Button>
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
                    {sortedPhotos.length} {sortedPhotos.length === 1 ? 'Foto' : 'Fotos'} vom {folderDisplayName}
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
                      key={photo.filename}
                      sx={{ 
                        borderRadius: { xs: 2, md: 3 },
                        overflow: 'hidden',
                        aspectRatio: '3/2',
                        position: 'relative',
                        border: selectionMode && selectedPhotos.has(photo.filename) ? '3px solid' : '1px solid',
                        borderColor: selectionMode && selectedPhotos.has(photo.filename) ? 'primary.main' : 'divider',
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
                          checked={selectedPhotos.has(photo.filename)}
                          onChange={() => {
                            const newSelection = new Set(selectedPhotos);
                            if (newSelection.has(photo.filename)) {
                              newSelection.delete(photo.filename);
                            } else {
                              newSelection.add(photo.filename);
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
                          (e) => handlePhotoSelect(photo.filename, e) : 
                          () => handlePhotoClick(photo)
                        }
                        sx={{ height: '100%' }}
                      >
                        <CardMedia
                          component="img"
                          height="100%"
                          image={`http://localhost:3001${photo.path}`}
                          alt={photo.filename}
                          sx={{
                            objectFit: 'cover',
                            aspectRatio: '3/2',
                            width: '100%',
                            height: '100%'
                          }}
                          onError={(e) => {
                            // Fallback zu lokalen Fotos wenn Backend nicht erreichbar
                            const target = e.target as HTMLImageElement;
                            target.src = `/photos/${photo.filename}`;
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
        photoIds={Array.from(selectedPhotos).map(filename => `${folderName}/${filename}`)}
      />
    </Box>
  );
};

export default FolderGalleryPage;
