import React, { useState, useContext, useEffect } from 'react';
import { Box, Typography, IconButton, Button, TextField, Snackbar, Alert, ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel, Slider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import UploadIcon from '@mui/icons-material/Upload';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import BrightnessHighIcon from '@mui/icons-material/BrightnessHigh';
import BrightnessLowIcon from '@mui/icons-material/BrightnessLow';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import OnScreenKeyboard from '../components/OnScreenKeyboard';

const AdminPage: React.FC = () => {
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [brandingType, setBrandingType] = useState<'logo' | 'text'>('text');
  const [brandingText, setBrandingText] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [lastBrandingTimestamp, setLastBrandingTimestamp] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  
  // Farbverwaltung - entfernt
  // GitHub Desktop refresh trigger
  // VS Code Git trigger
  
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useTheme();

  // Virtual Keyboard Hook - eine für alle Felder
  const [activeField, setActiveField] = useState<'brandingText' | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const handleKeyPress = (key: string) => {
    if (activeField === 'brandingText') {
      setBrandingText(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    if (activeField === 'brandingText') {
      setBrandingText(prev => prev.slice(0, -1));
    }
  };

  const handleEnter = () => {
    if (activeField === 'brandingText') {
      // Schließe Tastatur
      setKeyboardVisible(false);
      setActiveField(null);
    }
  };

  const showKeyboardForField = (field: 'brandingText') => {
    setActiveField(field);
    setKeyboardVisible(true);
  };

  const hideKeyboard = () => {
    setKeyboardVisible(false);
    setActiveField(null);
  };

  // Prüfe ob Tastatur sichtbar ist für Layout-Anpassung
  const isAnyKeyboardVisible = keyboardVisible;

  // Automatisches Scrollen wenn Tastatur angezeigt wird
  useEffect(() => {
    if (isAnyKeyboardVisible) {
      // Kurze Verzögerung für die Layout-Animation
      const timer = setTimeout(() => {
        // Scrolle zum Ende der Seite, damit das untere Ende der Tastatur sichtbar ist
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 300); // Etwas länger warten für die Transform-Animation
      
      return () => clearTimeout(timer);
    }
  }, [isAnyKeyboardVisible]);

  // Lade aktuelle Brightness beim Laden der Seite
  useEffect(() => {
    const loadCurrentBrightness = async () => {
      try {
        const res = await fetch('/api/display/brightness', {
          method: 'GET',
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success && typeof data.brightness === 'number') {
          setBrightness(data.brightness);
        }
      } catch (error) {
        console.error('Error loading brightness:', error);
      }
    };
    
    loadCurrentBrightness();
  }, []);

  // Lade aktuelle Branding-Daten beim Komponenten-Start
  const loadBrandingData = async () => {
    try {
      const res = await fetch('/api/branding');
      const data = await res.json();
      if (data.success) {
        setBrandingType(data.type || 'text');
        setBrandingText(data.text || '');
        if (data.logo) {
          setCurrentLogo(data.logo);
        } else {
          setCurrentLogo(null);
        }
        console.log('Current branding data:', data);
      }
    } catch (err) {
      console.error('Error loading branding:', err);
    }
  };

  // Prüfe auf Branding-Updates
  const checkBrandingUpdates = async () => {
    try {
      const res = await fetch('/api/branding/timestamp');
      const data = await res.json();
      if (data.success && data.timestamp > lastBrandingTimestamp) {
        console.log('🔄 Branding update detected, reloading...');
        setLastBrandingTimestamp(data.timestamp);
        await loadBrandingData();
      }
    } catch (err) {
      console.error('Error checking branding updates:', err);
    }
  };

  React.useEffect(() => {
    loadBrandingData();
  }, []);

  // Polling für Live-Updates alle 2 Sekunden
  React.useEffect(() => {
    const interval = setInterval(checkBrandingUpdates, 2000);
    return () => clearInterval(interval);
  }, [lastBrandingTimestamp]);

  // Lade aktuelle Display-Helligkeit beim Komponenten-Start
  React.useEffect(() => {
    fetch('/api/display/brightness')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBrightness(data.brightness || 100);
          console.log('Current display brightness:', data.brightness);
        }
      })
      .catch(err => console.error('Error loading display brightness:', err));
  }, []);

  const handleDeleteAll = async () => {
    try {
      console.log('🗑️ AdminPage: Calling DELETE /api/photos');
      const res = await fetch('http://localhost:3001/api/photos', { method: 'DELETE' });
      console.log('🗑️ AdminPage: Response status:', res.status);
      const data = await res.json();
      console.log('🗑️ AdminPage: Response data:', data);
      setSnackbar({ 
        open: true, 
        message: data.message || (data.success ? 'Alle Fotos in den Papierkorb verschoben' : 'Fehler beim Verschieben'), 
        severity: data.success ? 'success' : 'error' 
      });
    } catch (error) {
      console.error('🗑️ AdminPage: Error:', error);
      setSnackbar({ 
        open: true, 
        message: 'Verbindungsfehler beim Verschieben der Fotos', 
        severity: 'error' 
      });
    }
    setDeleteConfirmOpen(false);
  };

  const handleBrandingType = (_: any, value: 'logo' | 'text') => {
    if (value) setBrandingType(value);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Erstelle Preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoSave = async () => {
    if (!logoFile) {
      setSnackbar({ open: true, message: 'Bitte wählen Sie zuerst ein Logo aus', severity: 'error' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      const res = await fetch('/api/branding/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.success) {
        setSnackbar({ open: true, message: data.message || 'Logo erfolgreich gespeichert', severity: 'success' });
        // Setze Upload-State zurück
        setLogoFile(null);
        setLogoPreview(null);
        // Lade das aktuelle Branding neu
        await loadBrandingData();
      } else {
        setSnackbar({ open: true, message: data.error || 'Fehler beim Speichern des Logos', severity: 'error' });
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      setSnackbar({ open: true, message: 'Fehler beim Upload', severity: 'error' });
    }
  };

  const handleLogoDelete = async () => {
    try {
      const res = await fetch('/api/branding/logo', { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        setSnackbar({ open: true, message: data.message || 'Logo erfolgreich gelöscht', severity: 'success' });
        // Lade das aktuelle Branding neu
        await loadBrandingData();
        // Setze Standard-Text falls noch keiner vorhanden ist
        if (!brandingText) {
          setBrandingText('Willkommen bei der Fotobox!');
        }
      } else {
        setSnackbar({ open: true, message: data.error || 'Fehler beim Löschen des Logos', severity: 'error' });
      }
    } catch (error) {
      console.error('Logo delete error:', error);
      setSnackbar({ open: true, message: 'Fehler beim Löschen', severity: 'error' });
    }
  };

  const handleBrandingTextSave = async () => {
    await fetch('/api/branding/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: brandingText })
    });
    setSnackbar({ open: true, message: 'Text gespeichert', severity: 'success' });
  };

  const handleBrightnessChange = async (value: number) => {
    setBrightness(value);
    try {
      const res = await fetch('/api/display/brightness', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ brightness: value })
      });
      const data = await res.json();
      if (data.success) {
        setSnackbar({ 
          open: true, 
          message: data.message || `Helligkeit auf ${value}% gesetzt`, 
          severity: 'success' 
        });
      } else {
        console.error('Failed to set brightness:', data.message);
        setSnackbar({ 
          open: true, 
          message: data.message || 'Fehler beim Ändern der Helligkeit', 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error('Error setting brightness:', error);
      setSnackbar({ 
        open: true, 
        message: 'Fehler beim Ändern der Helligkeit: ' + (error as Error).message, 
        severity: 'error' 
      });
    }
  };

  // Logout-Handler
  const handleLogout = async () => {
    if (authContext) {
      await authContext.logout();
      navigate('/');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      // Ganzer Container bewegt sich nach oben bei Tastatur
      transform: isAnyKeyboardVisible ? 'translateY(-60px)' : 'translateY(0)',
      transition: 'transform 0.3s ease-in-out',
    }}>
      {/* Freistehende Buttons */}
      <IconButton 
        onClick={() => navigate('/gallery')}
        sx={{
          position: 'fixed',
          top: { xs: 16, sm: 20 },
          left: { xs: 16, sm: 20 },
          zIndex: 1000,
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          '&:hover': { 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.2s'
        }}
      >
        <ArrowBackIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
      </IconButton>
      
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 16, sm: 20 },
          right: { xs: 16, sm: 20 },
          zIndex: 1000,
          display: 'flex',
          gap: { xs: 1, sm: 2 }
        }}
      >
        <IconButton 
          onClick={() => navigate('/trash', { state: { fromInternal: true } })}
          title="Papierkorb"
          sx={{
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            '&:hover': { 
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.2s'
          }}
        >
          <RestoreFromTrashIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        </IconButton>
        
        <IconButton 
          onClick={handleLogout}
          sx={{
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            '&:hover': { 
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.2s'
          }}
        >
          <LogoutIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        </IconButton>
      </Box>
      
      <Box 
        sx={{ 
          flex: 1,
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: { sm: 600, md: 800 },
          mx: 'auto',
          width: '100%',
          pt: { xs: 8, sm: 10 } // Platz für die freistehenden Buttons
        }}
      >
        {/* Theme Section */}
        <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }}
          >
            🎨 Design & Darstellung
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Personalisiere das Erscheinungsbild der Photobooth
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={toggleDarkMode}
                icon={<LightModeIcon />}
                checkedIcon={<DarkModeIcon />}
                size="medium"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {darkMode ? <DarkModeIcon /> : <LightModeIcon />}
                <Typography variant="body1">
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />
          
          {/* Display Helligkeit */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <BrightnessHighIcon sx={{ mr: 1 }} />
              Display-Helligkeit
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <BrightnessLowIcon sx={{ color: 'text.secondary' }} />
              <Slider
                value={brightness}
                onChange={(_, value) => handleBrightnessChange(value as number)}
                min={10}
                max={100}
                step={5}
                sx={{ flex: 1 }}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
              <BrightnessHighIcon sx={{ color: 'text.secondary' }} />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Aktuelle Helligkeit: {brightness}%
            </Typography>
          </Box>
        </Box>

        {/* Fotos löschen Section */}
        <Box sx={{ mt: { xs: 3, md: 4 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }}
          >
            Foto-Verwaltung
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<DeleteIcon />} 
              onClick={() => setDeleteConfirmOpen(true)}
              sx={{
                fontSize: { xs: '0.9rem', md: '1rem' },
                py: { xs: 1, md: 1.5 },
                px: { xs: 2, md: 3 }
              }}
            >
              Alle Fotos in den Papierkorb verschieben
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<RestoreFromTrashIcon />} 
              onClick={() => navigate('/trash', { state: { fromInternal: true } })}
              sx={{
                fontSize: { xs: '0.9rem', md: '1rem' },
                py: { xs: 1, md: 1.5 },
                px: { xs: 2, md: 3 }
              }}
            >
              Papierkorb anzeigen
            </Button>
          </Box>
        </Box>
        
        {/* Branding Section */}
        <Box sx={{ mt: { xs: 3, md: 4 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }}
          >
            Custom Branding
          </Typography>
          <ToggleButtonGroup 
            value={brandingType} 
            exclusive 
            onChange={handleBrandingType} 
            sx={{ 
              mb: 2,
              '& .MuiToggleButton-root': {
                fontSize: { xs: '0.9rem', md: '1rem' },
                py: { xs: 1, md: 1.5 },
                px: { xs: 2, md: 3 }
              }
            }}
          >
            <ToggleButton value="logo" aria-label="Logo">
              <BrandingWatermarkIcon sx={{ mr: 1 }} />
              Logo
            </ToggleButton>
            <ToggleButton value="text" aria-label="Text">
              <TextFieldsIcon sx={{ mr: 1 }} />
              Text
            </ToggleButton>
          </ToggleButtonGroup>
          
          {brandingType === 'logo' ? (
            <Box>
              {/* Aktuelles Logo anzeigen */}
              {currentLogo && !logoPreview && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Aktuelles Logo:
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-block',
                      border: '2px solid #ddd',
                      borderRadius: 2,
                      p: 1,
                      backgroundColor: '#f5f5f5'
                    }}
                  >
                    <img 
                      src={currentLogo} 
                      alt="Aktuelles Logo" 
                      style={{ 
                        maxWidth: '200px',
                        maxHeight: '100px',
                        objectFit: 'contain'
                      }} 
                    />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleLogoDelete}
                      size="small"
                      sx={{
                        fontSize: { xs: '0.8rem', md: '0.9rem' },
                        py: { xs: 0.5, md: 1 },
                        px: { xs: 1, md: 2 }
                      }}
                    >
                      Logo löschen
                    </Button>
                  </Box>
                </Box>
              )}

              <Button 
                variant="contained" 
                component="label" 
                startIcon={<UploadIcon />}
                sx={{
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  py: { xs: 1, md: 1.5 },
                  px: { xs: 2, md: 3 },
                  mb: 2
                }}
              >
                {currentLogo ? 'Neues Logo auswählen' : 'Logo auswählen'}
                <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
              </Button>
              
              {logoPreview && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Neue Logo-Vorschau:
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-block',
                      border: '2px solid #4caf50',
                      borderRadius: 2,
                      p: 1,
                      backgroundColor: '#f5f5f5'
                    }}
                  >
                    <img 
                      src={logoPreview} 
                      alt="Logo Vorschau" 
                      style={{ 
                        maxWidth: '200px',
                        maxHeight: '100px',
                        objectFit: 'contain'
                      }} 
                    />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {logoFile?.name}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {logoFile && (
                <Box sx={{ mb: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleLogoSave}
                    sx={{
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      py: { xs: 1, md: 1.5 },
                      px: { xs: 2, md: 3 },
                      mr: 2
                    }}
                  >
                    Logo speichern
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                    sx={{
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      py: { xs: 1, md: 1.5 },
                      px: { xs: 2, md: 3 }
                    }}
                  >
                    Abbrechen
                  </Button>
                </Box>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' }, mb: 2 }}
                >
                  QR-Codes:
                </Typography>
                
                {/* Container für beide QR-Codes nebeneinander */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* WLAN QR-Code (links) */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.75rem', mb: 1, fontWeight: 'bold' }}
                    >
                      📶 WLAN verbinden
                    </Typography>
                    <Box sx={{
                      display: 'inline-block',
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: '#f8f9fa',
                      border: '2px solid #e9ecef',
                    }}>
                      <img 
                        src="/api/wifi-qr" 
                        alt="WLAN QR Code" 
                        style={{ 
                          width: window.innerWidth < 600 ? 120 : 140, 
                          height: window.innerWidth < 600 ? 120 : 140,
                          display: 'block'
                        }} 
                      />
                    </Box>
                  </Box>
                  
                  {/* Logo Upload QR-Code (rechts) */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.75rem', mb: 1, fontWeight: 'bold' }}
                    >
                      🖼️ Logo hochladen
                    </Typography>
                    <Box sx={{
                      display: 'inline-block',
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: '#f8f9fa',
                      border: '2px solid #e9ecef',
                    }}>
                      <img 
                        src="/api/logo-upload-qr" 
                        alt="Logo Upload QR" 
                        style={{ 
                          width: window.innerWidth < 600 ? 120 : 140, 
                          height: window.innerWidth < 600 ? 120 : 140,
                          display: 'block'
                        }} 
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box>
              <TextField
                label="Branding-Text"
                value={brandingText}
                onChange={e => setBrandingText(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{ startAdornment: <TextFieldsIcon sx={{ mr: 1 }} /> }}
                inputProps={{ inputMode: 'text', pattern: '[A-Za-z0-9äöüÄÖÜß .,!?-]*' }}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '1rem', md: '1.1rem' }
                  }
                }}
                onFocus={() => showKeyboardForField('brandingText')}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleBrandingTextSave} 
                sx={{ 
                  mt: 1,
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  py: { xs: 1, md: 1.5 },
                  px: { xs: 2, md: 3 }
                }}
              >
                Text speichern
              </Button>
            </Box>
          )}
        </Box>


        {/* Zusätzlicher Platz wenn Tastatur sichtbar */}
        {isAnyKeyboardVisible && (
          <Box sx={{ height: '200px', backgroundColor: 'transparent' }} />
        )}
      </Box>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Lösch-Bestätigungsdialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Alle Fotos in den Papierkorb verschieben?</DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie alle Fotos in den Papierkorb verschieben möchten?
            Die Fotos können später aus dem Papierkorb wiederhergestellt oder permanent gelöscht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Abbrechen</Button>
          <Button 
            onClick={handleDeleteAll} 
            color="error"
            variant="contained"
          >
            In Papierkorb verschieben
          </Button>
        </DialogActions>
      </Dialog>

      {/* OnScreenKeyboard - eine einzige für alle Felder */}
      <OnScreenKeyboard
        isVisible={keyboardVisible}
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onEnter={handleEnter}
        onClose={hideKeyboard}
        position="bottom"
        avoidCollision={true}
        maxHeightPercent={50}
      />
    </Box>
  );
};

export default AdminPage;

// Git Refresh Test - AdminPage mit Helligkeits-Slider erfolgreich implementiert!
