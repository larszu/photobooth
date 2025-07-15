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
  AppBar, 
  Toolbar, 
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

  const handleShare = () => {
    // TODO: Implement bulk sharing
    setSnackbar({
      open: true,
      message: 'Bulk-Teilen wird in einer zukünftigen Version verfügbar sein',
      severity: 'success'
    });
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
      <AppBar position="static" color="primary">
        <Toolbar 
          sx={{ 
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2, md: 3 },
            width: '100%',
            maxWidth: '100vw'
          }}
        >
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
            📁 Foto-Ordner
          </Typography>
          
          {/* Multi-Select Toggle */}
          <Button 
            color="inherit"
            onClick={() => setSelectionMode(!selectionMode)}
            sx={{
              p: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              fontWeight: 500,
              textTransform: 'none',
              minWidth: 'auto'
            }}
          >
            {selectionMode ? 'Abbrechen' : 'Auswählen'}
          </Button>
          
          <IconButton 
            color="inherit" 
            onClick={() => navigate('/admin')}
            sx={{
              p: { xs: 1, sm: 1.5 },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }
            }}
          >
            <AdminPanelSettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box 
        sx={{ 
          flex: 1,
          p: { xs: 1, sm: 2, md: 3 },
          maxWidth: '100vw',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress size={60} />
          </Box>
        ) : (
          <>
            {/* Schnellzugriff: Alle Fotos anzeigen */}
            <Card 
              sx={{ 
                mb: 3,
                borderRadius: { xs: 2, md: 3 },
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                color: 'white'
              }}
            >
              <CardActionArea onClick={handleViewAllPhotos}>
                <CardContent sx={{ py: { xs: 2, md: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PhotoLibraryIcon sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Alle Fotos anzeigen
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Alle Fotos aus allen Tagen in einer Galerie
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>

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
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 3 
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Fotos nach Tagen
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
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              mb: 1,
                              fontSize: { xs: '1.1rem', md: '1.25rem' }
                            }}
                          >
                            📅 {folder.displayName}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
    </Box>
  );
};

export default FoldersOverviewPage;
