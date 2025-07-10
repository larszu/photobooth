import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Box, 
  Typography, 
  CircularProgress, 
  IconButton,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface SmartShareDialogProps {
  open: boolean;
  onClose: () => void;
  photoId: string;
}

interface ShareData {
  qrCode: string;
  shareUrl: string;
  wifiEnabled: boolean;
  instructions: string;
}

const SmartShareDialog: React.FC<SmartShareDialogProps> = ({ open, onClose, photoId }) => {
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && photoId) {
      loadShareData();
    }
  }, [open, photoId]);

  const loadShareData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/smart-share?photo=${encodeURIComponent(photoId)}`);
      const data = await response.json();
      
      if (data.success) {
        setShareData(data);
      } else {
        setError(data.message || 'Fehler beim Laden der Share-Daten');
      }
    } catch (err) {
      setError('Fehler beim Laden der Share-Daten');
      console.error('Error loading share data:', err);
    } finally {
      setLoading(false);
    }
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
          overflow: 'hidden'
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
            onClick={onClose}
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
            📱 Smart Share
          </Typography>
          <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
            Foto schnell und einfach teilen
          </Typography>
        </Box>

        <Box sx={{ p: 4, textAlign: 'center' }}>
          {loading && (
            <Box>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="body1" color="text.secondary">
                QR-Code wird generiert...
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
              {/* QR-Code */}
              <Box sx={{
                display: 'inline-block',
                p: 2,
                borderRadius: 3,
                backgroundColor: '#f8f9fa',
                border: '3px solid #e9ecef',
                mb: 3
              }}>
                <img 
                  src={shareData.qrCode} 
                  alt="Smart Share QR Code"
                  style={{ 
                    display: 'block',
                    width: '250px',
                    height: '250px'
                  }}
                />
              </Box>

              {/* Instruktionen */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={1}>
                  {shareData.wifiEnabled ? '📶 WLAN + Foto' : '📸 Foto teilen'}
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={2}>
                  {shareData.instructions}
                </Typography>
                
                {shareData.wifiEnabled && (
                  <Alert severity="info" sx={{ textAlign: 'left', mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Automatischer Ablauf:</strong><br/>
                      1. QR-Code mit Smartphone scannen<br/>
                      2. WLAN-Verbindung wird automatisch hergestellt<br/>
                      3. Foto öffnet sich automatisch<br/>
                      4. Foto herunterladen oder teilen
                    </Typography>
                  </Alert>
                )}
              </Box>

              {/* Share URL für manuelles Kopieren */}
              <Box sx={{
                backgroundColor: '#f8f9fa',
                borderRadius: 2,
                p: 2,
                border: '1px solid #e9ecef'
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
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SmartShareDialog;
