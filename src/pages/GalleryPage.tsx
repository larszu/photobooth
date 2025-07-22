import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardActionArea, CardMedia, CircularProgress, AppBar, Toolbar, IconButton, Button } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const GalleryPage: React.FC = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/photos')
      .then(res => res.json())
      .then(data => setPhotos(data.photos.reverse()))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Fotobox Galerie</Typography>
          <IconButton color="inherit" onClick={() => navigate('/admin')}><AdminPanelSettingsIcon /></IconButton>
        </Toolbar>
      </AppBar>
      <Box p={2}>
        {loading ? <CircularProgress /> : (
          <Grid container spacing={2}>
            {photos.map((photo) => (
              <Grid item xs={6} sm={4} md={3} key={photo}>
                <Card>
                  <CardActionArea onClick={() => navigate(`/photo/${photo}`)}>
                    <CardMedia
                      component="img"
                      height="160"
                      image={`/photos/${photo}`}
                      alt={photo}
                    />
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        <Box mt={3} display="flex" justifyContent="center">
          <Button variant="contained" color="secondary" size="large" startIcon={<PhotoCameraIcon />} onClick={() => fetch('/api/photo/take', { method: 'POST' }).then(() => window.location.reload())}>
            Foto aufnehmen
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default GalleryPage;
