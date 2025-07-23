import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Box, 
  Typography, 
  CircularProgress, 
  IconButton,
  Alert,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface BulkSmartShareDialogProps {
  open: boolean;
  onClose: () => void;
  photoIds: string[]; // Array of photo IDs
}

interface BulkShareData {
  success: boolean;
  totalPhotos: number;
  shareUrl: string;
  wifiQrCode?: string;
  galleryQrCode?: string;
  instructions: string;
  wifiConfig: {
    enabled: boolean;
    ssid: string;
    hasPassword: boolean;
    password?: string; // Echtes Passwort hinzufügen
  };
  photos: Array<{
    id: string;
    filename: string;
    thumbnailUrl: string;
  }>;
}

const BulkSmartShareDialog: React.FC<BulkSmartShareDialogProps> = ({ open, onClose, photoIds }) => {
  const [shareData, setShareData] = useState<BulkShareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGalleryStep, setShowGalleryStep] = useState(false);
  // Mode ist immer 'manual' - kein Toggle mehr
  const mode = 'manual';

  useEffect(() => {
    if (open && photoIds.length > 0) {
      loadData();
    }
  }, [open, photoIds, mode]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Bulk Share Daten laden
      await loadBulkShareData();
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadBulkShareData = async () => {
    // Erstelle Bulk Share URL mit allen Foto-IDs
    const photoIdsParam = photoIds.map(id => encodeURIComponent(id)).join(',');
    // Immer 'auto' mode für Backend (zeigt beide QR-Codes an)
    const requestMode = 'auto';
    
    const response = await fetch(`/api/bulk-smart-share?photos=${photoIdsParam}&mode=${requestMode}`);
    const data = await response.json();
    
    if (data.success) {
      setShareData(data);
    } else {
      throw new Error(data.message || 'Fehler beim Laden der Bulk-Share-Daten');
    }
  };

  const handleClose = () => {
    setShareData(null);
    setError(null);
    setShowGalleryStep(false); // Reset gallery step
    onClose();
  };

  const renderQrCode = (qrCode: string, title: string, description: string) => (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        {title}
      </Typography>
      
      <Box sx={{
        display: 'inline-block',
        p: 2,
        borderRadius: 3,
        backgroundColor: '#f8f9fa',
        border: '3px solid #e9ecef',
        mb: 2
      }}>
        <Box 
          component="img"
          src={qrCode}
          alt={title}
          sx={{ 
            display: 'block',
            width: '200px',
            height: '200px'
          }}
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              color: 'primary.main',
              backgroundColor: 'white',
              border: '2px solid',
              borderColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 4 }}>
          {loading && (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="body1" color="text.secondary">
                Bulk-Share wird vorbereitet...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {shareData && !loading && (
            <Box>
              {/* Schrittweise QR-Code Anzeige */}
              {!showGalleryStep ? (
                // Schritt 1: WLAN QR-Code
                <Box sx={{ textAlign: 'center' }}>
                  {shareData.wifiConfig.enabled && shareData.wifiQrCode ? (
                    <Box>
                      <Typography variant="h6" fontWeight="bold" mb={3} color="primary.main">
                        Schritt 1:<br />
                        WLAN Verbindung mit der Fotobox herstellen
                      </Typography>
                      {renderQrCode(
                        shareData.wifiQrCode,
                        '',
                        ''
                      )}
                      
                      {/* WLAN Details */}
                      <Box sx={{ mt: 2, mb: 3 }}>
                        <Typography variant="body1" fontWeight="bold" mb={1}>
                          SSID: {shareData.wifiConfig.ssid}
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" mb={2}>
                          Passwort: {shareData.wifiConfig.password || (shareData.wifiConfig.hasPassword ? '[Passwort nicht verfügbar]' : 'Kein Passwort')}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => setShowGalleryStep(true)}
                        sx={{
                          mt: 2,
                          px: 4,
                          py: 1.5,
                          borderRadius: 3,
                          fontSize: '1.1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Weiter zur Galerie
                      </Button>
                      
                      {/* Hinweis */}
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 3, 
                          fontStyle: 'italic',
                          textAlign: 'center',
                          px: 2
                        }}
                      >
                        Hinweis: Dieses WLAN hat keinen Internetzugriff und ist nur zum Teilen der Fotos gedacht
                      </Typography>
                    </Box>
                  ) : (
                    // Wenn kein WLAN QR-Code, direkt zur Galerie
                    <Box>
                      <Typography variant="h6" fontWeight="bold" mb={2} color="secondary.main">
                        Galerie öffnen
                      </Typography>
                      {shareData.galleryQrCode && renderQrCode(
                        shareData.galleryQrCode,
                        '� Galerie öffnen',
                        'Alle Fotos anzeigen und herunterladen'
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                // Schritt 2: Galerie QR-Code
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" mb={3} color="secondary.main">
                    Schritt 2:<br />
                    Galerie öffnen
                  </Typography>
                  {shareData.galleryQrCode && renderQrCode(
                    shareData.galleryQrCode,
                    '',
                    ''
                  )}
                  
                  {/* Galerie URL */}
                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Alternativ: Link manuell eingeben oder weiterleiten
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="bold" 
                      sx={{ 
                        fontFamily: 'monospace',
                        backgroundColor: '#f5f5f5',
                        p: 1,
                        borderRadius: 1,
                        wordBreak: 'break-all'
                      }}
                    >
                      {shareData.shareUrl}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Diesen Link können Sie in WhatsApp, E-Mail oder Browser eingeben
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setShowGalleryStep(false)}
                    sx={{
                      mt: 2,
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem'
                    }}
                  >
                    Zurück zu WLAN
                  </Button>
                </Box>
              )}

              {/* Manual URL entfernt */}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BulkSmartShareDialog;
