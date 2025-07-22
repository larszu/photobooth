import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Button, 
  Card, 
  CardMedia, 
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  Breadcrumbs,
  Link,
  Checkbox
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import HomeIcon from '@mui/icons-material/Home';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate } from 'react-router-dom';

interface TrashPhoto {
  filename: string;
  url: string;
  size: number;
  created: Date;
}

const TrashPage: React.FC = () => {
  const [photos, setPhotos] = useState<TrashPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState<{ 
    open: boolean, 
    message: string, 
    severity: 'success' | 'error' | 'info' 
  }>({ open: false, message: '', severity: 'success' });
  
  // Multi-Selection State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  
  const navigate = useNavigate();

  const loadTrashPhotos = async () => {
    try {
      setLoading(true);
      console.log('🗑️ Loading trash photos...');
      const response = await fetch('http://localhost:3001/api/trash');
      console.log('🗑️ Response status:', response.status);
      const data = await response.json();
      console.log('🗑️ Response data:', data);
      
      if (data.success) {
        setPhotos(data.photos);
        console.log('🗑️ Loaded photos:', data.photos.length);
      } else {
        console.error('🗑️ Server error:', data.message);
        setSnackbar({ 
          open: true, 
          message: data.message || 'Fehler beim Laden des Papierkorbs', 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error('🗑️ Network error loading trash:', error);
      setSnackbar({ 
        open: true, 
        message: 'Verbindungsfehler beim Laden des Papierkorbs', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrashPhotos();
  }, []);

  const handleDeletePermanently = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/trash/${filename}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setSnackbar({ 
          open: true, 
          message: 'Foto permanent gelöscht', 
          severity: 'success' 
        });
        loadTrashPhotos(); // Neu laden
      } else {
        setSnackbar({ 
          open: true, 
          message: data.message || 'Fehler beim Löschen', 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      setSnackbar({ 
        open: true, 
        message: 'Verbindungsfehler beim Löschen', 
        severity: 'error' 
      });
    }
    setDeleteConfirm(null);
  };

  const handleRestore = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/trash/${filename}/restore`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setSnackbar({ 
          open: true, 
          message: 'Foto wiederhergestellt', 
          severity: 'success' 
        });
        loadTrashPhotos(); // Neu laden
      } else {
        setSnackbar({ 
          open: true, 
          message: data.message || 'Fehler beim Wiederherstellen', 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error('Error restoring photo:', error);
      setSnackbar({ 
        open: true, 
        message: 'Verbindungsfehler beim Wiederherstellen', 
        severity: 'error' 
      });
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/trash', {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setSnackbar({ 
          open: true, 
          message: data.message || 'Papierkorb geleert', 
          severity: 'success' 
        });
        loadTrashPhotos(); // Neu laden
      } else {
        setSnackbar({ 
          open: true, 
          message: data.message || 'Fehler beim Leeren des Papierkorbs', 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error('Error emptying trash:', error);
      setSnackbar({ 
        open: true, 
        message: 'Verbindungsfehler beim Leeren des Papierkorbs', 
        severity: 'error' 
      });
    }
    setEmptyTrashConfirm(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteSelectedPhotos = async () => {
    for (const filename of selectedPhotos) {
      await handleDeletePermanently(filename);
    }
    setSelectedPhotos(new Set());
    setSelectionMode(false);
  };

  const restoreSelectedPhotos = async () => {
    for (const filename of selectedPhotos) {
      await handleRestore(filename);
    }
    setSelectedPhotos(new Set());
    setSelectionMode(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Floating Navigation Buttons */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 10, sm: 16 },
          left: { xs: 10, sm: 16 },
          zIndex: 1000,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 1)',
            },
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          position: 'fixed',
          top: { xs: 10, sm: 16 },
          right: { xs: 10, sm: 16 },
          zIndex: 1000,
          display: 'flex',
          gap: 1,
        }}
      >
        {/* Admin Button */}
        <IconButton
          onClick={() => navigate('/admin', { state: { fromInternal: true } })}
          title="Admin-Bereich"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 1)',
            },
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
          }}
        >
          <AdminPanelSettingsIcon />
        </IconButton>

        {/* Multi-Select Toggle */}
        {photos.length > 0 && (
          <Button
            onClick={() => setSelectionMode(!selectionMode)}
            variant="contained"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: 2,
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 1)',
              },
              px: { xs: 2, sm: 3 },
              py: { xs: 1.5, sm: 2 },
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              fontWeight: 500,
              textTransform: 'none',
              minWidth: 'auto',
              height: { xs: 48, sm: 56 },
            }}
          >
            {selectionMode ? 'Abbrechen' : 'Auswählen'}
          </Button>
        )}
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 }, pt: { xs: 10, sm: 12 } }}>
        {/* Page Header */}
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: { xs: 2, md: 3 },
            fontWeight: 600,
            textAlign: 'center',
            color: 'text.primary'
          }}
        >
          🗑️ Papierkorb ({photos.length} Fotos)
        </Typography>

        {/* Breadcrumb Navigation */}
        <Breadcrumbs 
          aria-label="breadcrumb" 
          sx={{ mb: { xs: 2, md: 3 } }}
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
          <Typography 
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <DeleteIcon fontSize="inherit" />
            Papierkorb
          </Typography>
        </Breadcrumbs>

        {loading ? (
          <Typography variant="h6" textAlign="center" sx={{ mt: 4 }}>
            Lade Papierkorb...
          </Typography>
        ) : photos.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h5" gutterBottom color="text.secondary">
              Papierkorb ist leer
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gelöschte Fotos werden hier angezeigt
            </Typography>
          </Box>
        ) : (
          <>
            {/* Info Banner */}
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: 'info.light', 
              borderRadius: 1,
              color: 'info.contrastText'
            }}>
              <Typography variant="body2">
                💡 Fotos im Papierkorb können wiederhergestellt oder permanent gelöscht werden.
                Um alle Fotos permanent zu löschen, nutzen Sie den "Papierkorb leeren" Button.
              </Typography>
            </Box>

            {/* Photo Grid */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)'
                },
                gap: { xs: 1, sm: 2, md: 3 },
                width: '100%'
              }}
            >
              {photos.map((photo) => (
                <Card 
                  key={photo.filename} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    border: selectionMode && selectedPhotos.has(photo.filename) ? '3px solid' : '1px solid',
                    borderColor: selectionMode && selectedPhotos.has(photo.filename) ? 'primary.main' : 'divider',
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
                  
                  <CardMedia
                    component="img"
                    sx={{
                      height: 200,
                      objectFit: 'cover'
                    }}
                    image={photo.url}
                    alt={photo.filename}
                  />
                  <Box sx={{ p: 1, flexGrow: 1 }}>
                    <Typography 
                      variant="caption" 
                      display="block" 
                      noWrap
                      title={photo.filename}
                    >
                      {photo.filename}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatFileSize(photo.size)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatDate(photo.created)}
                    </Typography>
                  </Box>

                  {!selectionMode && (
                    <CardActions sx={{ justifyContent: 'space-between', px: 1, pb: 1 }}>
                      <Tooltip title="Wiederherstellen">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleRestore(photo.filename)}
                        >
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Permanent löschen">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => setDeleteConfirm(photo.filename)}
                        >
                          <DeleteForeverIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  )}
                </Card>
              ))}
            </Box>

            {/* Aktionen für die Mehrfachauswahl */}
            {selectionMode && (
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={restoreSelectedPhotos}
                  disabled={selectedPhotos.size === 0}
                  startIcon={<RestoreIcon />}
                >
                  {`Ausgewählte ${selectedPhotos.size} wiederherstellen`}
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={deleteSelectedPhotos}
                  disabled={selectedPhotos.size === 0}
                  startIcon={<DeleteForeverIcon />}
                >
                  {`Ausgewählte ${selectedPhotos.size} endgültig löschen`}
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => setEmptyTrashConfirm(true)}
                  startIcon={<DeleteSweepIcon />}
                >
                  Papierkorb leeren ({photos.length})
                </Button>
              </Box>
            )}

            {/* Globale Aktionen */}
            {!selectionMode && photos.length > 0 && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => setEmptyTrashConfirm(true)}
                  startIcon={<DeleteSweepIcon />}
                  size="large"
                >
                  Papierkorb leeren ({photos.length})
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Lösch-Bestätigungsdialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Foto permanent löschen?</DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie das Foto "{deleteConfirm}" permanent löschen möchten?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Abbrechen</Button>
          <Button 
            onClick={() => deleteConfirm && handleDeletePermanently(deleteConfirm)} 
            color="error"
            variant="contained"
          >
            Permanent löschen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Papierkorb leeren Bestätigungsdialog */}
      <Dialog open={emptyTrashConfirm} onClose={() => setEmptyTrashConfirm(false)}>
        <DialogTitle>Papierkorb leeren?</DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie alle {photos.length} Fotos im Papierkorb permanent löschen möchten?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmptyTrashConfirm(false)}>Abbrechen</Button>
          <Button 
            onClick={handleEmptyTrash} 
            color="error"
            variant="contained"
          >
            Alle permanent löschen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrashPage;
