import React, { useState, useEffect, useRef } from 'react';
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
  const [showWifiHelp, setShowWifiHelp] = useState(false);
  const [showGalleryHelp, setShowGalleryHelp] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  
  const wifiHelpRef = useRef<HTMLDivElement>(null);
  const galleryHelpRef = useRef<HTMLDivElement>(null);
  const manualUrlRef = useRef<HTMLDivElement>(null);
  
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
    setShowWifiHelp(false); // Reset help states
    setShowGalleryHelp(false);
    setShowManualUrl(false);
    onClose();
  };

  const handleWifiHelpToggle = () => {
    setShowWifiHelp(!showWifiHelp);
    if (!showWifiHelp) {
      // Scroll nach kurzer Verzögerung, damit das Element erst gerendert wird
      setTimeout(() => {
        wifiHelpRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  };

  const handleGalleryHelpToggle = () => {
    setShowGalleryHelp(!showGalleryHelp);
    if (!showGalleryHelp) {
      // Scroll nach kurzer Verzögerung, damit das Element erst gerendert wird
      setTimeout(() => {
        galleryHelpRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  };

  const handleManualUrlToggle = () => {
    setShowManualUrl(!showManualUrl);
    if (!showManualUrl) {
      // Scroll nach kurzer Verzögerung, damit das Element erst gerendert wird
      setTimeout(() => {
        manualUrlRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
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
            width: '250px',
            height: '250px'
          }}
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );

  const renderWifiQrCode = (qrCode: string, ssid: string, password: string) => (
    <Box sx={{ textAlign: 'center' }}>
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
          alt="WLAN QR-Code"
          sx={{ 
            display: 'block',
            width: '250px',
            height: '250px',
            mb: 2
          }}
        />
        
        {/* WLAN Details direkt im QR-Code Container */}
        <Box sx={{ textAlign: 'center', pt: 1, borderTop: '1px solid #e9ecef' }}>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5, color: 'text.secondary' }}>
            <strong>SSID:</strong> {ssid}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            <strong>Passwort:</strong> {password}
          </Typography>
        </Box>
      </Box>
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
                        Mit Fotobox-WLAN verbinden
                      </Typography>
                      {renderWifiQrCode(
                        shareData.wifiQrCode,
                        shareData.wifiConfig.ssid,
                        shareData.wifiConfig.password || (shareData.wifiConfig.hasPassword ? '[Passwort nicht verfügbar]' : 'Kein Passwort')
                      )}
                      
                      <Box sx={{ mb: 3 }}></Box>

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
                        Jetzt Fotos ansehen
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

                      {/* Ausklappbare Anleitung für QR-Code */}
                      <Box sx={{ mt: 3 }}>
                        <Button
                          variant="text"
                          onClick={handleWifiHelpToggle}
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.9rem',
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.04)'
                            }
                          }}
                        >
                          {showWifiHelp ? '▼ Hilfe ausblenden' : '▶ Hilfe benötigt?'}
                        </Button>
                        
                        {showWifiHelp && (
                          <Box 
                            ref={wifiHelpRef}
                            sx={{ 
                              mt: 2,
                              p: 3, 
                              backgroundColor: '#f5f5f5', 
                              borderRadius: 2,
                              border: '1px solid #e0e0e0'
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold" mb={2} color="text.secondary">
                              So verbinden Sie sich mit dem WLAN:
                            </Typography>
                            
                            <Box sx={{ textAlign: 'left', mb: 2 }}>
                              <Typography variant="body2" fontWeight="bold" mb={1} color="text.secondary">
                                iPhone:
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.5 }}>
                                1. Öffnen Sie die Kamera-App<br/>
                                2. Halten Sie das iPhone über den QR-Code<br/>
                                3. Tippen Sie auf die WLAN-Benachrichtigung die erscheint<br/>
                                4. Bestätigen Sie mit "Verbinden"
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'left' }}>
                              <Typography variant="body2" fontWeight="bold" mb={1} color="text.secondary">
                                Android:
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                1. Öffnen Sie die Kamera-App oder QR-Code Scanner<br/>
                                2. Scannen Sie den QR-Code<br/>
                                3. Tippen Sie auf "Mit Netzwerk verbinden"<br/>
                                4. Oder gehen Sie zu WLAN-Einstellungen und wählen Sie das Netzwerk manuell
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
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
                    Ihre Fotos ansehen
                  </Typography>

                  {/* Wichtiger WLAN-Hinweis - ÜBER dem QR-Code */}
                  <Box sx={{ 
                    mb: 3, 
                    p: 2, 
                    backgroundColor: '#fff3cd', 
                    borderRadius: 2,
                    border: '2px solid #ffc107'
                  }}>
                    <Typography variant="body2" fontWeight="bold" color="#856404" sx={{ textAlign: 'center' }}>
                      ⚠️ WICHTIG: Stellen Sie sicher, dass Sie mit dem Fotobox-WLAN verbunden sind!
                    </Typography>
                    <Typography variant="caption" color="#856404" sx={{ textAlign: 'center', display: 'block', mt: 1 }}>
                      Ohne WLAN-Verbindung zur Fotobox können Sie die Fotos nicht laden
                    </Typography>
                  </Box>

                  {shareData.galleryQrCode && renderQrCode(
                    shareData.galleryQrCode,
                    '',
                    ''
                  )}

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setShowGalleryStep(false)}
                    sx={{
                      mt: 2,
                      mb: 3,
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem'
                    }}
                  >
                    WLAN-Einstellungen
                  </Button>

                  {/* Ausklappbare Anleitung für Galerie QR-Code */}
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="text"
                      onClick={handleGalleryHelpToggle}
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.9rem',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      {showGalleryHelp ? '▼ Hilfe ausblenden' : '▶ Hilfe benötigt?'}
                    </Button>
                    
                    {showGalleryHelp && (
                      <Box 
                        ref={galleryHelpRef}
                        sx={{ 
                          mt: 2,
                          p: 3, 
                          backgroundColor: '#f0f9f0', 
                          borderRadius: 2,
                          border: '1px solid #d0e7d0'
                        }}
                      >
                        <Typography variant="body2" fontWeight="bold" mb={2} color="success.main">
                          So öffnen Sie die Fotogalerie:
                        </Typography>
                        
                        <Box sx={{ textAlign: 'left', mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            iPhone:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.5 }}>
                            1. Öffnen Sie die Kamera-App<br/>
                            2. Halten Sie das iPhone über den QR-Code<br/>
                            3. Tippen Sie auf den Link der erscheint<br/>
                            4. Die Fotogalerie öffnet sich in Ihrem Browser
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'left', mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Android:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.5 }}>
                            1. Öffnen Sie die Kamera-App oder QR-Code Scanner<br/>
                            2. Halten Sie das Handy über den QR-Code<br/>
                            3. Tippen Sie auf den Link der erscheint<br/>
                            4. Die Fotogalerie öffnet sich in Ihrem Browser
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight="bold" mb={1}>
                            Falls der QR-Code nicht funktioniert:
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                            • Kopieren Sie den Link oben und fügen Sie ihn in Ihren Browser ein<br/>
                            • Oder senden Sie den Link per WhatsApp an sich selbst
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                  
                  {/* Ausklappbare Galerie URL - ganz unten */}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="text"
                      onClick={handleManualUrlToggle}
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      {showManualUrl ? '▼ Link ausblenden' : '▶ Link manuell eingeben'}
                    </Button>
                    
                    {showManualUrl && (
                      <Box 
                        ref={manualUrlRef}
                        sx={{ 
                          mt: 1,
                          p: 2, 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: 2,
                          border: '1px solid #e9ecef'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" mb={1} sx={{ fontSize: '0.8rem' }}>
                          Für technische Nutzer: Link zum Weiterleiten oder manuell eingeben
                        </Typography>
                        <Typography 
                          variant="body1" 
                          fontWeight="bold" 
                          sx={{ 
                            fontFamily: 'monospace',
                            backgroundColor: '#ffffff',
                            p: 1.5,
                            borderRadius: 1,
                            border: '1px solid #dee2e6',
                            wordBreak: 'break-all',
                            fontSize: '0.9rem'
                          }}
                        >
                          {shareData.shareUrl}
                        </Typography>
                      </Box>
                    )}
                  </Box>
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
