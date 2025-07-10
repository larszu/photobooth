import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardActionArea, CardMedia, CircularProgress, AppBar, Toolbar, IconButton, Button } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const GalleryPage: React.FC = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  console.log('GalleryPage rendered, photos:', photos, 'loading:', loading);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        // Versuche zuerst das Backend
        const response = await fetch('http://localhost:3001/api/photos');
        if (response.ok) {
          const data = await response.json();
          console.log('Photos response:', data);
          // Wenn data.photos ein Array von Objekten ist, extrahiere die Dateinamen
          const photoArray = Array.isArray(data.photos) 
            ? data.photos.map((photo: any) => typeof photo === 'string' ? photo : photo.filename)
            : [];
          setPhotos(photoArray.reverse());
        } else {
          throw new Error('Backend not available');
        }
      } catch (error) {
        console.error('Backend not available, using fallback photos:', error);
        // Fallback: Verwende die echten Fotos die in public/photos verfügbar sind
        const realPhotos = [
          '20190804_Hochzeit_Robin_Vanessa-042.jpg',
          '20190804_Hochzeit_Robin_Vanessa-044.jpg',
          '20191124_Jarno_Lena_081.jpg',
          '20200531_Adi_Epp_017.jpg',
          '20210207_Lifeline_012.jpg',
          '20240715_Radomski_Babybauch_001.jpg',
          'demo-portrait.jpg',
          'demo-landscape.jpg', 
          'demo-group.jpg',
          'demo-selfie.jpg',
          'demo-party.jpg',
          'photo-2025-07-07T21-52-44-051Z.jpg'
        ];
        setPhotos(realPhotos);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

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
            Fotobox Galerie
          </Typography>
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
            {/* Debug Info */}
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>
              Debug: {photos.length} Fotos geladen
            </Typography>
            
            {photos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  Keine Fotos verfügbar
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, opacity: 0.7 }}>
                  Erstelle dein erstes Foto!
                </Typography>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)',
                    md: 'repeat(4, 1fr)',
                    lg: 'repeat(5, 1fr)',
                    xl: 'repeat(6, 1fr)'
                  },
                  gap: { xs: 1, sm: 2, md: 3 },
                  width: '100%'
                }}
              >
                {photos.map((photo) => (
                  <Card 
                    key={photo}
                    sx={{ 
                      borderRadius: { xs: 2, md: 3 },
                      overflow: 'hidden',
                      aspectRatio: '3/2', // 3:2 Format statt 1:1
                      '&:hover': {
                        transform: 'scale(1.02)',
                        transition: 'transform 0.2s ease-in-out',
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardActionArea 
                      onClick={() => navigate(`/view/${encodeURIComponent(photo)}`)}
                      sx={{ height: '100%' }}
                    >
                      <CardMedia
                        component="img"
                        height="100%"
                        image={`http://localhost:3001/photos/${photo}`}
                        alt={photo}
                        sx={{
                          objectFit: 'cover', // Beschneidet das Bild um den Rahmen zu füllen
                          aspectRatio: '3/2',
                          width: '100%',
                          height: '100%'
                        }}
                        onError={(e) => {
                          // Fallback zu lokalen Fotos wenn Backend nicht erreichbar
                          const target = e.target as HTMLImageElement;
                          target.src = `/photos/${photo}`;
                        }}
                      />
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            )}
            
            {/* Zur Foto-Seite navigieren Button - immer sichtbar und responsiv */}
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
          </>
        )}
      </Box>
    </Box>
  );
};

export default GalleryPage;
