import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardActionArea, 
  CardMedia, 
  CardContent,
  CircularProgress, 
  IconButton, 
  Button,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  Snackbar,
  Alert
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FolderIcon from '@mui/icons-material/Folder';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PhotoSelectionBar from '../components/PhotoSelectionBar';
import BulkSmartShareDialog from '../components/BulkSmartShareDialog';

interface PhotoFolder {
  name: string;
  displayName: string;
  photoCount: number;
  thumbnail: string | null;
  path: string;
}

const FoldersOverviewPage: React.FC = () => {
  const [folders, setFolders] = useState<PhotoFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // desc = neueste zuerst
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ 
    open: false, message: '', severity: 'success' 
  });
  const [bulkShareDialogOpen, setBulkShareDialogOpen] = useState(false);
  const [collectedPhotoIds, setCollectedPhotoIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/folders');
        if (response.ok) {
          const data = await response.json();
          console.log('Folders response:', data);
          setFolders(data.folders || []);
        } else {
          console.error('Failed to load folders');
          setFolders([]);
        }
      } catch (error) {
        console.error('Error loading folders:', error);
        setFolders([]);
      } finally {
        setLoading(false);
      }
    };

    loadFolders();
  }, []);

  // Multi-Select Handler Functions
  const handleFolderSelect = (folderName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedFolders(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(folderName)) {
        newSelection.delete(folderName);
      } else {
        newSelection.add(folderName);
      }
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    setSelectedFolders(new Set(folders.map(f => f.name)));
  };

  const handleDeselectAll = () => {
    setSelectedFolders(new Set());
  };

  const handleMoveToTrash = async () => {
    try {
      const folderNames = Array.from(selectedFolders);
      for (const folderName of folderNames) {
        const response = await fetch(`http://localhost:3001/api/folders/${encodeURIComponent(folderName)}/trash`, {
          method: 'POST'
        });
        if (!response.ok) {
          throw new Error(`Failed to move folder ${folderName}`);
        }
      }
      
      setSnackbar({
        open: true,
        message: `${folderNames.length} Ordner in den Papierkorb verschoben`,
        severity: 'success'
      });
      
      // Refresh folders
      setSelectedFolders(new Set());
      setSelectionMode(false);
      const response = await fetch('http://localhost:3001/api/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Error moving folders to trash:', error);
      setSnackbar({
        open: true,
        message: 'Fehler beim Verschieben der Ordner',
        severity: 'error'
      });
    }
  };

  const handleShare = async () => {
    if (selectedFolders.size === 0) {
      setSnackbar({
        open: true,
        message: 'Keine Ordner ausgewählt zum Teilen',
        severity: 'error'
      });
      return;
    }

    try {
      // Sammle alle Fotos aus den ausgewählten Ordnern
      const allPhotoIds: string[] = [];
      
      for (const folderName of Array.from(selectedFolders)) {
        // Lade Fotos für jeden ausgewählten Ordner
        const response = await fetch(`http://localhost:3001/api/folders/${encodeURIComponent(folderName)}/photos`);
        if (response.ok) {
          const data = await response.json();
          const folderPhotos = data.photos || [];
          
          // Füge alle Foto-IDs aus diesem Ordner hinzu
          const photoIds = folderPhotos.map((photo: any) => `${folderName}/${photo.filename}`);
          allPhotoIds.push(...photoIds);
        }
      }

      if (allPhotoIds.length === 0) {
        setSnackbar({
          open: true,
          message: 'Keine Fotos in den ausgewählten Ordnern gefunden',
          severity: 'error'
        });
        return;
      }

      // Öffne den Bulk Smart Share Dialog mit allen gesammelten Fotos
      setCollectedPhotoIds(allPhotoIds);
      setBulkShareDialogOpen(true);
    } catch (error) {
      console.error('Error collecting photos for bulk share:', error);
      setSnackbar({
        open: true,
        message: 'Fehler beim Sammeln der Fotos zum Teilen',
        severity: 'error'
      });
    }
  };

  const handleCloseSelection = () => {
    setSelectionMode(false);
    setSelectedFolders(new Set());
  };

  // Calculate total photos in selection
  const totalPhotosInSelection = React.useMemo(() => {
    return folders
      .filter(f => selectedFolders.has(f.name))
      .reduce((sum, f) => sum + f.photoCount, 0);
  }, [folders, selectedFolders]);

  const handleFolderClick = (folderPath: string) => {
    navigate(`/gallery/folder/${encodeURIComponent(folderPath)}`);
  };

  const handleViewAllPhotos = () => {
    navigate('/gallery/all');
  };

  // Sortier-Funktion für Ordner
  const sortedFolders = React.useMemo(() => {
    return [...folders].sort((a, b) => {
      // Extrahiere Datum aus Ordnername (YYYYMMDD_Photobooth)
      const dateA = a.name.match(/^(\d{8})/)?.[1] || '00000000';
      const dateB = b.name.match(/^(\d{8})/)?.[1] || '00000000';
      
      if (sortOrder === 'desc') {
        return dateB.localeCompare(dateA); // Neueste zuerst
      } else {
        return dateA.localeCompare(dateB); // Älteste zuerst
      }
    });
  }, [folders, sortOrder]);

  const handleSortChange = (_event: React.MouseEvent<HTMLElement>, newSortOrder: 'asc' | 'desc') => {
    if (newSortOrder !== null) {
      setSortOrder(newSortOrder);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Freistehende Buttons oben rechts */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 16, sm: 20 },
          right: { xs: 16, sm: 20 },
          zIndex: 1000,
          display: 'flex',
          gap: { xs: 1, sm: 2 }
        }}
      >
        {/* Multi-Select Toggle */}
        <Button 
          onClick={() => setSelectionMode(!selectionMode)}
          sx={{
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
        
        <IconButton 
          onClick={() => navigate('/admin')}
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
          <AdminPanelSettingsIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        </IconButton>
      </Box>
      
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
            {folders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <FolderIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.3 }} />
                <Typography variant="h4" sx={{ mb: 2 }}>
                  Keine Foto-Ordner vorhanden
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, opacity: 0.7 }}>
                  Erstelle dein erstes Foto, um einen neuen Tagesordner anzulegen!
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-start', // Links ausrichten statt space-between
                  alignItems: 'center',
                  mb: 3,
                  gap: 3 // Direkter Abstand zwischen Text und Buttons
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Fotos nach Tagen
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                    
                    <Button
                      onClick={handleViewAllPhotos}
                      variant="outlined"
                      size="medium"
                      sx={{ 
                        px: { xs: 1.5, md: 2 },
                        py: { xs: 0.5, md: 1 },
                        border: '1px solid',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'white',
                        },
                      }}
                    >
                      <PhotoLibraryIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">
                        Alle Fotos anzeigen
                      </Typography>
                    </Button>
                  </Box>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                      lg: 'repeat(4, 1fr)'
                    },
                    gap: { xs: 2, sm: 3 },
                    width: '100%'
                  }}
                >
                  {sortedFolders.map((folder) => (
                    <Card 
                      key={folder.name}
                      sx={{ 
                        borderRadius: { xs: 2, md: 3 },
                        overflow: 'hidden',
                        position: 'relative',
                        border: selectionMode && selectedFolders.has(folder.name) ? '3px solid' : '1px solid',
                        borderColor: selectionMode && selectedFolders.has(folder.name) ? 'primary.main' : 'divider',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          transition: 'transform 0.2s ease-in-out',
                          boxShadow: 6
                        }
                      }}
                    >
                      {/* Selection Checkbox */}
                      {selectionMode && (
                        <Checkbox
                          checked={selectedFolders.has(folder.name)}
                          onChange={() => {
                            const newSelection = new Set(selectedFolders);
                            if (newSelection.has(folder.name)) {
                              newSelection.delete(folder.name);
                            } else {
                              newSelection.add(folder.name);
                            }
                            setSelectedFolders(newSelection);
                          }}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
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
                          (e) => handleFolderSelect(folder.name, e) : 
                          () => handleFolderClick(folder.path)
                        }
                        sx={{ height: '100%' }}
                      >
                        {folder.thumbnail ? (
                          <CardMedia
                            component="img"
                            height="200"
                            image={`http://localhost:3001${folder.thumbnail}`}
                            alt={folder.displayName}
                            sx={{
                              objectFit: 'cover',
                              filter: 'brightness(0.8)'
                            }}
                            onError={(e) => {
                              // Fallback zu Icon wenn Bild nicht lädt
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Box 
                            sx={{ 
                              height: 200,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'grey.100'
                            }}
                          >
                            <FolderIcon sx={{ fontSize: '4rem', color: 'grey.400' }} />
                          </Box>
                        )}
                        
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '1.1rem', md: '1.25rem' }
                              }}
                            >
                              {folder.displayName}
                            </Typography>
                            
                            <Chip 
                              icon={<PhotoLibraryIcon />}
                              label={`${folder.photoCount} ${folder.photoCount === 1 ? 'Foto' : 'Fotos'}`}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                        </CardContent>
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
          selectedCount={totalPhotosInSelection}
          totalCount={folders.reduce((sum, f) => sum + f.photoCount, 0)}
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
        onClose={() => {
          setBulkShareDialogOpen(false);
          setCollectedPhotoIds([]);
        }}
        photoIds={collectedPhotoIds}
      />
    </Box>
  );
};

export default FoldersOverviewPage;
