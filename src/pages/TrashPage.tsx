import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  AppBar, 
  Toolbar, 
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
  Fab,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Papierkorb ({photos.length} Fotos)
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
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
                <Card key={photo.filename} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                </Card>
              ))}
            </Box>
          </>
        )}
      </Box>

      {/* Floating Action Button - Papierkorb leeren */}
      {photos.length > 0 && (
        <Fab
          color="error"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16
          }}
          onClick={() => setEmptyTrashConfirm(true)}
        >
          <DeleteSweepIcon />
        </Fab>
      )}

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
