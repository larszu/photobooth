import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Box, 
  Typography, 
  CircularProgress, 
  IconButton,
  Alert,
  Button,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WifiIcon from '@mui/icons-material/Wifi';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import ManualModeIcon from '@mui/icons-material/Settings';

interface SmartShareV2DialogProps {
  open: boolean;
  onClose: () => void;
  photoId: string;
}

interface ShareDataV2 {
  success: boolean;
  photoId: string;
  shareUrl: string;
  wifiQrCode?: string;
  photoQrCode?: string;
  instructions: string;
  wifiConfig: {
    enabled: boolean;
    ssid: string;
    hasPassword: boolean;
  };
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

const SmartShareV2Dialog: React.FC<SmartShareV2DialogProps> = ({ open, onClose, photoId }) => {
  const [shareData, setShareData] = useState<ShareDataV2 | null>(null);
  const [wifiStatus, setWifiStatus] = useState<WifiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [activeStep, setActiveStep] = useState(0);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(null);

  useEffect(() => {
    if (open && photoId) {
      loadData();
      
      // Auto-Refresh für Smart Mode: Überwache WLAN-Status
      if (mode === 'auto') {
        const interval = setInterval(checkWifiStatus, 3000); // Alle 3 Sekunden prüfen
        setAutoRefreshInterval(interval);
        
        return () => {
          if (interval) clearInterval(interval);
        };
      }
    }
    
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
    };
  }, [open, photoId, mode]);

  // Separater WLAN-Status Check für Auto-Refresh
  const checkWifiStatus = async () => {
    if (mode !== 'auto') return;
    
    try {
      const wifiResponse = await fetch('/api/wifi-status');
      const wifiData = await wifiResponse.json();
      
      if (wifiData.success) {
        const wasConnected = wifiStatus?.connected || false;
        const isNowConnected = wifiData.connected;
        
        setWifiStatus(wifiData);
        
        // Wenn gerade verbunden wurde → automatisch zu Foto wechseln
        if (!wasConnected && isNowConnected && activeStep === 0) {
          await loadShareData('photo');
          setActiveStep(1);
        }
      }
    } catch (err) {
      // Ignoriere Fehler beim Auto-Refresh
      console.log('Auto-refresh error (ignored):', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. WLAN-Status prüfen
      const wifiResponse = await fetch('/api/wifi-status');
      const wifiData = await wifiResponse.json();
      
      if (wifiData.success) {
        setWifiStatus(wifiData);
        
        // Smart Mode: Automatische Logik
        if (mode === 'auto') {
          if (wifiData.connected || !wifiData.wifiConfig.enabled) {
            // Bereits verbunden oder WLAN deaktiviert → Nur Foto QR
            await loadShareData('photo');
            setActiveStep(1); // Direkt zu Schritt 2 (Foto)
          } else {
            // Nicht verbunden → Zeige WLAN QR (Schritt 1)
            await loadShareData('wifi');
            setActiveStep(0); // Start bei WLAN-Verbindung
          }
        } else {
          // Manual Mode: Immer beide QR-Codes laden und anzeigen
          await loadShareData('auto');
          setActiveStep(0);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadShareData = async (requestMode: 'wifi' | 'photo' | 'auto') => {
    const response = await fetch(`/api/smart-share-v2?photo=${encodeURIComponent(photoId)}&mode=${requestMode}`);
    const data = await response.json();
    
    if (data.success) {
      setShareData(data);
    } else {
      throw new Error(data.message || 'Fehler beim Laden der Share-Daten');
    }
  };

  const handleClose = () => {
    // Cleanup Auto-Refresh beim Schließen
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      setAutoRefreshInterval(null);
    }
    
    // State zurücksetzen
    setShareData(null);
    setWifiStatus(null);
    setActiveStep(0);
    setError(null);
    
    onClose();
  };

  const handleModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: 'auto' | 'manual' | null) => {
    if (newMode !== null) {
      // Cleanup alten Auto-Refresh
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
      
      setMode(newMode);
    }
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  const getStepStatus = (stepIndex: number) => {
    if (mode === 'auto' && wifiStatus?.connected && stepIndex === 0) {
      return 'completed';
    }
    return stepIndex === activeStep ? 'active' : 'inactive';
  };

  const renderModeToggle = () => (
    <Box sx={{ mb: 3, textAlign: 'center' }}>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleModeChange}
        aria-label="share mode"
        size="small"
      >
        <ToggleButton value="auto" aria-label="auto mode">
          <AutoModeIcon sx={{ mr: 1 }} />
          Smart
        </ToggleButton>
        <ToggleButton value="manual" aria-label="manual mode">
          <ManualModeIcon sx={{ mr: 1 }} />
          Manuell
        </ToggleButton>
      </ToggleButtonGroup>
      
      <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
        {mode === 'auto' ? 
          'Automatisch: Passt sich an WLAN-Status an' : 
          'Manuell: Zeigt beide QR-Codes gleichzeitig'
        }
      </Typography>
    </Box>
  );

  const renderWifiStatus = () => {
    if (!wifiStatus) return null;

    return (
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Chip
          icon={wifiStatus.connected ? <CheckCircleIcon /> : <WifiIcon />}
          label={wifiStatus.connected ? 
            `✅ Verbunden mit Photobooth-WLAN` : 
            '📶 Nicht im Photobooth-WLAN'
          }
          color={wifiStatus.connected ? 'success' : 'default'}
          variant={wifiStatus.connected ? 'filled' : 'outlined'}
          size="small"
        />
        
        {mode === 'auto' && (
          <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
            {wifiStatus.connected ? 
              'Smart Mode: Zeige Foto-Download' : 
              'Smart Mode: Zeige WLAN-Verbindung'
            }
          </Typography>
        )}
      </Box>
    );
  };

  const renderQrCode = (qrCode: string, title: string, description: string) => (
    <Box sx={{ textAlign: 'center', mb: 3 }}>
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
        <img 
          src={qrCode} 
          alt={title}
          style={{ 
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

  const renderStepperMode = () => {
    if (!shareData) return null;

    const steps = [];
    
    // Schritt 1: WLAN (wenn aktiviert und verfügbar)
    if (shareData.wifiConfig.enabled && shareData.wifiQrCode) {
      steps.push({
        label: 'WLAN verbinden',
        content: renderQrCode(
          shareData.wifiQrCode,
          '📶 WLAN-Verbindung',
          `Mit "${shareData.wifiConfig.ssid}" verbinden`
        )
      });
    }
    
    // Schritt 2: Foto (immer, wenn vorhanden)
    if (shareData.photoQrCode) {
      steps.push({
        label: 'Foto herunterladen',
        content: renderQrCode(
          shareData.photoQrCode,
          '📸 Foto öffnen',
          'Foto anzeigen und herunterladen'
        )
      });
    }

    // Manual Mode: Zeige beide QR-Codes nebeneinander
    if (mode === 'manual') {
      return (
        <Box>
          <Typography variant="h6" fontWeight="bold" textAlign="center" mb={3}>
            📱 Beide QR-Codes
          </Typography>
          
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
            
            {/* Foto QR-Code */}
            {shareData.photoQrCode && (
              <Box sx={{ 
                flex: 1,
                textAlign: 'center',
                maxWidth: { xs: '100%', md: '45%' }
              }}>
                <Typography variant="h6" fontWeight="bold" mb={2} color="secondary.main">
                  {shareData.wifiConfig.enabled ? '2️⃣ Foto herunterladen' : 'Foto herunterladen'}
                </Typography>
                {renderQrCode(
                  shareData.photoQrCode,
                  '📸 Foto öffnen',
                  'Foto anzeigen und herunterladen'
                )}
              </Box>
            )}
          </Box>
          
          {/* Anleitung für Manual Mode */}
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            backgroundColor: 'grey.50', 
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Anleitung:</strong><br/>
              {shareData.wifiConfig.enabled ? 
                '1. Zuerst den linken QR-Code scannen → WLAN verbinden\n2. Dann den rechten QR-Code scannen → Foto herunterladen' :
                'QR-Code scannen um das Foto herunterzuladen'
              }
            </Typography>
          </Box>
        </Box>
      );
    }

    // Smart Mode: Stepper-Interface
    return (
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={index} completed={getStepStatus(index) === 'completed'}>
            <StepLabel 
              onClick={() => handleStepClick(index)}
              sx={{ cursor: 'pointer' }}
            >
              {step.label}
            </StepLabel>
            <StepContent>
              {step.content}
              
              {index === 0 && shareData.wifiConfig.enabled && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      // Nach WLAN-Verbindung automatisch zum Foto wechseln
                      setActiveStep(1);
                      // WLAN-Status neu prüfen
                      setTimeout(() => {
                        checkWifiStatus();
                      }, 1000);
                    }}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    ✅ WLAN verbunden - Weiter zu Foto
                  </Button>
                  
                  <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
                    Oder warten Sie auf automatische Erkennung
                  </Typography>
                </Box>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>
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
            📱 Smart Share V2
          </Typography>
          <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
            Optimiert für iOS & Android
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          {loading && (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="body1" color="text.secondary">
                QR-Codes werden generiert...
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
              {renderModeToggle()}
              {renderWifiStatus()}
              


              {renderStepperMode()}
              {renderManualUrl()}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SmartShareV2Dialog;
