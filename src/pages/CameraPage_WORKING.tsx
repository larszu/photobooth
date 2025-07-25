import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Typography, Card, CardContent, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { useGPIOWebSocket } from '../hooks/useGPIOWebSocket';

const CameraPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [branding, setBranding] = useState<{ type: 'logo' | 'text', logo?: string, text?: string }>({ type: 'text', text: '' });
  const [isCapturing, setIsCapturing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isPhotoReady, setIsPhotoReady] = useState<boolean>(false);
  const hasNavigated = useRef(false);
  
  useGPIOWebSocket(); // GPIO WebSocket Connection

  useEffect(() => {
    fetch('http://localhost:3001/api/branding')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBranding(data);
        }
      })
      .catch(err => console.error('Error loading branding:', err));
  }, []);

  // Auto-Navigation bei neuen Fotos
  useEffect(() => {
    if (capturedPhoto && !hasNavigated.current) {
      setIsPhotoReady(true);
      setTimeout(() => {
        hasNavigated.current = true;
        navigate(`/view/${encodeURIComponent(capturedPhoto)}`);
      }, 2000);
    }
  }, [capturedPhoto, navigate]);

  const startCountdown = async () => {
    if (isCapturing) return;
    
    setIsCapturing(true);
    
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setCountdown(null);
    capturePhoto();
  };

  const capturePhoto = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      console.log('Capture response:', data);
      
      if (data.success && data.filename) {
        setCapturedPhoto(data.filename);
        
        // QR-Code für das neue Foto laden
        try {
          const qrResponse = await fetch(`http://localhost:3001/api/photos/${encodeURIComponent(data.filename)}/qr`);
          const qrData = await qrResponse.json();
          if (qrData.qr_code) {
            setQrCode(qrData.qr_code);
          }
        } catch (qrError) {
          console.error('Error loading QR code:', qrError);
        }
      } else {
        alert('Fehler beim Aufnehmen des Fotos');
        setIsCapturing(false);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Fehler beim Aufnehmen des Fotos');
      setIsCapturing(false);
    }
  };

  const handleViewPhoto = () => {
    if (capturedPhoto) {
      navigate(`/view/${encodeURIComponent(capturedPhoto)}`);
    }
  };

  const handleNewPhoto = () => {
    setCapturedPhoto(null);
    setQrCode(null);
    setIsCapturing(false);
    setIsPhotoReady(false);
    hasNavigated.current = false;
  };

  const handleBackToGallery = () => {
    navigate('/gallery');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2
    }}>
      {/* Zurück Button */}
      <IconButton 
        onClick={handleBackToGallery}
        sx={{
          position: 'fixed',
          top: { xs: 16, sm: 20 },
          left: { xs: 16, sm: 20 },
          zIndex: 1000,
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: '#333',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          '&:hover': { 
            backgroundColor: 'rgba(255, 255, 255, 1)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.2s'
        }}
      >
        <ArrowBackIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
      </IconButton>
      
      {/* Branding */}
      {branding.type === 'logo' && branding.logo && (
        <Box component="img" src={branding.logo} alt="Branding Logo" sx={{ maxHeight: 120, mb: 2 }} />
      )}
      {branding.type === 'text' && branding.text && (
        <Typography variant="h3" sx={{ mb: 4, fontWeight: 700, color: 'white', textAlign: 'center', fontSize: { xs: 28, md: 40 } }}>
          {branding.text}
        </Typography>
      )}

      {/* Hauptinhalt */}
      {!capturedPhoto ? (
        <>
          {/* Countdown oder Kamera bereit */}
          {countdown ? (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h1" sx={{ fontSize: { xs: '8rem', md: '12rem' }, fontWeight: 800, color: 'white', mb: 2 }}>
                {countdown}
              </Typography>
              <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Bereit machen...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 600, color: 'red' }}>
                Kamera bereit
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
                Drücken Sie den Button oder den Hardware-Button
              </Typography>
            </Box>
          )}

          {/* Foto aufnehmen Button */}
          <Button
            variant="contained"
            size="large"
            onClick={startCountdown}
            disabled={isCapturing}
            startIcon={<PhotoCameraIcon />}
            sx={{
              borderRadius: 4,
              px: 6,
              py: 3,
              fontSize: '1.5rem',
              fontWeight: 600,
              backgroundColor: 'white',
              color: '#333',
              boxShadow: 4,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.9)',
                transform: 'scale(1.05)',
                boxShadow: 6
              },
              '&:disabled': {
                backgroundColor: 'rgba(255,255,255,0.6)',
                color: '#666'
              },
              transition: 'all 0.2s'
            }}
          >
            {isCapturing ? 'Aufnahme läuft...' : 'Foto aufnehmen'}
          </Button>
        </>
      ) : (
        <Card sx={{ 
          maxWidth: 600, 
          width: '100%',
          borderRadius: 4,
          boxShadow: 8,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)'
        }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {isPhotoReady && (
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'green' }}>
                Foto bereit! Wird automatisch angezeigt...
              </Typography>
            )}
            
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Foto erfolgreich aufgenommen!
            </Typography>
            
            {/* Foto Vorschau */}
            <Box sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
              <Box
                component="img"
                src={`http://localhost:3001/photos/${capturedPhoto}`}
                alt="Captured"
                sx={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'cover'
                }}
              />
            </Box>
            
            {/* QR Code */}
            {qrCode && (
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <QrCodeIcon color="primary" />
                <Typography variant="body2" color="textSecondary">
                  QR-Code generiert
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleViewPhoto}
                sx={{ borderRadius: 3, px: 4 }}
              >
                Foto ansehen
              </Button>
              <Button
                variant="outlined"
                onClick={handleNewPhoto}
                sx={{ borderRadius: 3, px: 4 }}
              >
                Neues Foto
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CameraPage;
