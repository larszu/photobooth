import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Box, 
  Typography, 
  CircularProgress, 
  IconButton,
  Alert,
  Chip,
  Card,
  CardMedia
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WifiIcon from '@mui/icons-material/Wifi';

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
  };
  photos: Array<{
    id: string;
    filename: string;
    thumbnailUrl: string;
  }>;
}

interface WifiStatus {
  connected: boolean;
  clientIP: string;
  wifiConfig: {
    enabled: boolean;
    ssid: string;
    hasPassword: boolean;
  };
}

const BulkSmartShareDialog: React.FC<BulkSmartShareDialogProps> = ({ open, onClose, photoIds }) => {
  const [shareData, setShareData] = useState<BulkShareData | null>(null);
  const [wifiStatus, setWifiStatus] = useState<WifiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      // 1. WLAN-Status prüfen
      const wifiResponse = await fetch('/api/wifi-status');
      const wifiData = await wifiResponse.json();
      
      if (wifiData.success) {
        setWifiStatus(wifiData);
      }

      // 2. Bulk Share Daten laden
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

  const handleModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: 'auto' | 'manual' | null) => {
    // Mode ist fest auf 'manual' - diese Funktion wird nicht mehr verwendet
    // Kann entfernt werden wenn Toggle entfernt wird
  };

  const handleClose = () => {
    setShareData(null);
    setWifiStatus(null);
    setError(null);
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

  const renderPhotoGrid = () => {
    if (!shareData?.photos) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2} textAlign="center">
          📸 {shareData.totalPhotos} Fotos teilen
        </Typography>
        
        <Box sx={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          maxHeight: 200,
          overflowY: 'auto',
          justifyContent: 'center'
        }}>
          {shareData.photos.map((photo) => (
            <Box key={photo.id} sx={{ width: 60, height: 60 }}>
              <Card sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                width: '100%',
                height: '100%'
              }}>
                <CardMedia
                  component="img"
                  height="100%"
                  image={photo.thumbnailUrl}
                  alt={photo.filename}
                  sx={{
                    objectFit: 'cover'
                  }}
                />
              </Card>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderManualUrl = () => {
    if (!shareData) return null;

    return (
      <Box sx={{
        backgroundColor: '#f8f9fa',
        borderRadius: 2,
        p: 2,
        border: '1px solid #e9ecef',
        mt: 3
      }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Oder Link manuell teilen:
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            cursor: 'pointer',
            '&:hover': { backgroundColor: '#e9ecef' },
            p: 1,
            borderRadius: 1
          }}
          onClick={() => {
            navigator.clipboard.writeText(shareData.shareUrl);
            // TODO: Zeige Bestätigung
          }}
        >
          {shareData.shareUrl}
        </Typography>
      </Box>
    );
  };

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
        <Box sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 3,
          position: 'relative'
        }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
            📱 Bulk Smart Share
          </Typography>
          <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
            Mehrere Fotos gleichzeitig teilen
          </Typography>
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
              {/* WLAN-Status */}
              {wifiStatus && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Chip
                    icon={<WifiIcon />}
                    label={wifiStatus.connected ? 
                      `✅ Verbunden mit ${wifiStatus.wifiConfig.ssid}` : 
                      '❌ Nicht verbunden'
                    }
                    color={wifiStatus.connected ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Box>
              )}

              {/* Photo Grid */}
              {renderPhotoGrid()}

              {/* QR-Codes */}
              {mode === 'manual' ? (
                // Manual Mode: Beide QR-Codes nebeneinander
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 3,
                  justifyContent: 'center',
                  alignItems: 'flex-start'
                }}>
                  {/* WLAN QR-Code */}
                  {shareData.wifiConfig.enabled && shareData.wifiQrCode && (
                    <Box sx={{ 
                      flex: 1,
                      textAlign: 'center',
                      maxWidth: { xs: '100%', md: '45%' }
                    }}>
                      <Typography variant="h6" fontWeight="bold" mb={2} color="primary.main">
                        1️⃣ WLAN verbinden
                      </Typography>
                      {renderQrCode(
                        shareData.wifiQrCode,
                        '📶 WLAN-Verbindung',
                        `Mit "${shareData.wifiConfig.ssid}" verbinden`
                      )}
                    </Box>
                  )}
                  
                  {/* Galerie QR-Code */}
                  {shareData.galleryQrCode && (
                    <Box sx={{ 
                      flex: 1,
                      textAlign: 'center',
                      maxWidth: { xs: '100%', md: '45%' }
                    }}>
                      <Typography variant="h6" fontWeight="bold" mb={2} color="secondary.main">
                        {shareData.wifiConfig.enabled ? '2️⃣ Galerie öffnen' : 'Galerie öffnen'}
                      </Typography>
                      {renderQrCode(
                        shareData.galleryQrCode,
                        '📸 Galerie öffnen',
                        'Alle Fotos anzeigen und herunterladen'
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                // Smart Mode: Ein QR-Code
                <Box sx={{ textAlign: 'center' }}>
                  {wifiStatus?.connected || !shareData.wifiConfig.enabled ? (
                    // Bereits verbunden oder WLAN deaktiviert → Galerie QR
                    shareData.galleryQrCode && renderQrCode(
                      shareData.galleryQrCode,
                      '📸 Galerie öffnen',
                      `${shareData.totalPhotos} Fotos anzeigen und herunterladen`
                    )
                  ) : (
                    // Nicht verbunden → WLAN QR
                    shareData.wifiQrCode && renderQrCode(
                      shareData.wifiQrCode,
                      '📶 WLAN verbinden & Galerie öffnen',
                      `Mit "${shareData.wifiConfig.ssid}" verbinden und Galerie automatisch öffnen`
                    )
                  )}
                </Box>
              )}

              {/* Manual URL */}
              {renderManualUrl()}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BulkSmartShareDialog;
