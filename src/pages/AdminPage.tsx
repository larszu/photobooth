import React, { useState } from 'react';
import { Box, Typography, AppBar, Toolbar, IconButton, Button, TextField, Snackbar, Alert, ToggleButtonGroup, ToggleButton, Slider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import WifiIcon from '@mui/icons-material/Wifi';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import UploadIcon from '@mui/icons-material/Upload';
import PaletteIcon from '@mui/icons-material/Palette';
import { useNavigate } from 'react-router-dom';

const AdminPage: React.FC = () => {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [brandingType, setBrandingType] = useState<'logo' | 'text'>('text');
  const [brandingText, setBrandingText] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  
  // Farbverwaltung
  const [primaryHue, setPrimaryHue] = useState(212); // Hue für #1976d2
  const [secondaryHue, setSecondaryHue] = useState(339); // Hue für #f50057
  const [primaryHex, setPrimaryHex] = useState('#1976d2');
  const [secondaryHex, setSecondaryHex] = useState('#f50057');
  
  const navigate = useNavigate();

  // Hilfsfunktionen für Farbkonvertierung
  const hslToHex = (h: number, s: number = 100, l: number = 50): string => {
    const hDecimal = h / 360;
    const sDecimal = s / 100;
    const lDecimal = l / 100;

    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs((hDecimal * 6) % 2 - 1));
    const m = lDecimal - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= hDecimal && hDecimal < 1/6) {
      r = c; g = x; b = 0;
    } else if (1/6 <= hDecimal && hDecimal < 2/6) {
      r = x; g = c; b = 0;
    } else if (2/6 <= hDecimal && hDecimal < 3/6) {
      r = 0; g = c; b = x;
    } else if (3/6 <= hDecimal && hDecimal < 4/6) {
      r = 0; g = x; b = c;
    } else if (4/6 <= hDecimal && hDecimal < 5/6) {
      r = x; g = 0; b = c;
    } else if (5/6 <= hDecimal && hDecimal < 1) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const hexToHue = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    if (diff === 0) return 0;

    let hue = 0;
    if (max === r) {
      hue = (60 * ((g - b) / diff) + 360) % 360;
    } else if (max === g) {
      hue = (60 * ((b - r) / diff) + 120) % 360;
    } else if (max === b) {
      hue = (60 * ((r - g) / diff) + 240) % 360;
    }

    return Math.round(hue);
  };

  // Event Handler für Farbänderungen
  const handlePrimaryHueChange = (hue: number) => {
    setPrimaryHue(hue);
    setPrimaryHex(hslToHex(hue));
  };

  const handleSecondaryHueChange = (hue: number) => {
    setSecondaryHue(hue);
    setSecondaryHex(hslToHex(hue));
  };

  const handlePrimaryHexChange = (hex: string) => {
    setPrimaryHex(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setPrimaryHue(hexToHue(hex));
    }
  };

  const handleSecondaryHexChange = (hex: string) => {
    setSecondaryHex(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setSecondaryHue(hexToHue(hex));
    }
  };

  // Lade aktuelle Branding-Daten beim Komponenten-Start
  React.useEffect(() => {
    fetch('/api/branding')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBrandingType(data.type || 'text');
          setBrandingText(data.text || '');
          if (data.logo) {
            setCurrentLogo(data.logo);
          }
          console.log('Current branding data:', data);
        }
      })
      .catch(err => console.error('Error loading branding:', err));
  }, []);

  // Lade aktuelle Systemfarben beim Komponenten-Start
  React.useEffect(() => {
    fetch('/api/admin/colors')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPrimaryHex(data.primary);
          setSecondaryHex(data.secondary);
          setPrimaryHue(hexToHue(data.primary));
          setSecondaryHue(hexToHue(data.secondary));
          console.log('Current system colors:', data);
        }
      })
      .catch(err => console.error('Error loading colors:', err));
  }, []);

  // Lade aktuelle WLAN-Konfiguration beim Komponenten-Start
  React.useEffect(() => {
    fetch('/api/wifi/config')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSsid(data.config.ssid || '');
          setWifiEnabled(data.config.enabled || false);
          console.log('Current WiFi config:', data.config);
        }
      })
      .catch(err => console.error('Error loading WiFi config:', err));
  }, []);

  const handleWifiSave = async () => {
    try {
      const res = await fetch('/api/wifi/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ssid, 
          password, 
          enabled: wifiEnabled 
        })
      });
      const data = await res.json();
      setSnackbar({ 
        open: true, 
        message: data.message || 'Smart Share Konfiguration gespeichert', 
        severity: data.success ? 'success' : 'error' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Fehler beim Speichern der Konfiguration', 
        severity: 'error' 
      });
    }
  };

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
        // Aktualisiere das aktuelle Logo und setze Upload-State zurück
        setCurrentLogo(data.logo || logoPreview);
        setLogoFile(null);
        setLogoPreview(null);
        setBrandingType('logo');
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
        setCurrentLogo(null);
        setBrandingType('text');
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

  const handleColorsSave = async () => {
    await fetch('/api/admin/colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        primary: primaryHex,
        secondary: secondaryHex
      })
    });
    setSnackbar({ open: true, message: 'Farben gespeichert', severity: 'success' });
  };

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
          <IconButton 
            color="inherit" 
            onClick={() => navigate('/gallery')}
            sx={{
              p: { xs: 1, sm: 1.5 },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ml: { xs: 1, sm: 2 }
            }}
          >
            Admin
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box 
        sx={{ 
          flex: 1,
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: { sm: 600, md: 800 },
          mx: 'auto',
          width: '100%'
        }}
      >
        {/* WLAN Section */}
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }}
        >
          📶 Smart Share WLAN
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Konfiguriere WLAN-Zugangsdaten für automatische Verbindung über QR-Code
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Button
            variant={wifiEnabled ? 'contained' : 'outlined'}
            color={wifiEnabled ? 'success' : 'primary'}
            onClick={() => setWifiEnabled(!wifiEnabled)}
            sx={{ mb: 2 }}
          >
            {wifiEnabled ? '✅ Smart Share aktiviert' : '⚪ Smart Share aktivieren'}
          </Button>
        </Box>

        <TextField 
          label="WLAN-Name (SSID)" 
          value={ssid} 
          onChange={e => setSsid(e.target.value)} 
          fullWidth 
          margin="normal"
          disabled={!wifiEnabled}
          placeholder="z.B. Photobooth-WLAN"
          InputProps={{ startAdornment: <WifiIcon sx={{ mr: 1 }} /> }}
          sx={{
            '& .MuiInputBase-root': {
              fontSize: { xs: '1rem', md: '1.1rem' }
            }
          }}
        />
        <TextField 
          label="WLAN-Passwort" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          fullWidth 
          margin="normal" 
          type="password"
          disabled={!wifiEnabled}
          placeholder="Mindestens 8 Zeichen"
          sx={{
            '& .MuiInputBase-root': {
              fontSize: { xs: '1rem', md: '1.1rem' }
            }
          }}
        />
        
        {wifiEnabled && (
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            backgroundColor: 'rgba(76, 175, 80, 0.1)', 
            borderRadius: 2,
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}>
            <Typography variant="body2" color="success.main" fontWeight="bold">
              📱 Smart Share Funktionen:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • QR-Code scannen verbindet automatisch mit WLAN<br/>
              • Foto öffnet sich automatisch im Browser<br/>
              • Direkter Download und Teilen möglich<br/>
              • Funktioniert mit iOS und Android
            </Typography>
          </Box>
        )}

        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleWifiSave} 
          disabled={wifiEnabled && (!ssid || !password)}
          sx={{ 
            mt: 2,
            fontSize: { xs: '0.9rem', md: '1rem' },
            py: { xs: 1, md: 1.5 },
            px: { xs: 2, md: 3 }
          }}
        >
          Speichern
        </Button>
        
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
              Alle Fotos löschen
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<RestoreFromTrashIcon />} 
              onClick={() => navigate('/trash')}
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
                  sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' }, mb: 1 }}
                >
                  QR-Code zum Logo-Upload:
                </Typography>
                <img 
                  src="/api/admin/branding/logo-qr" 
                  alt="Logo Upload QR" 
                  style={{ 
                    width: window.innerWidth < 600 ? 100 : 120, 
                    height: window.innerWidth < 600 ? 100 : 120 
                  }} 
                />
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

        {/* Farbverwaltung Section */}
        <Box sx={{ mt: { xs: 3, md: 4 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }}
          >
            Systemfarben
          </Typography>
          
          {/* Primärfarbe */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <PaletteIcon sx={{ mr: 1 }} />
              Primärfarbe
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 2, mb: 2 }}>
              <Box 
                sx={{ 
                  width: 60, 
                  height: 40, 
                  backgroundColor: primaryHex,
                  border: '2px solid #ccc',
                  borderRadius: 2
                }} 
              />
              <TextField
                label="HEX Code"
                value={primaryHex}
                onChange={(e) => handlePrimaryHexChange(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
                inputProps={{ pattern: '^#[0-9A-Fa-f]{6}$' }}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Farbspektrum: {Math.round(primaryHue)}°</Typography>
              <Slider
                value={primaryHue}
                onChange={(_, value) => handlePrimaryHueChange(value as number)}
                min={0}
                max={360}
                sx={{
                  '& .MuiSlider-track': {
                    background: `linear-gradient(to right, 
                      hsl(0, 100%, 50%), 
                      hsl(60, 100%, 50%), 
                      hsl(120, 100%, 50%), 
                      hsl(180, 100%, 50%), 
                      hsl(240, 100%, 50%), 
                      hsl(300, 100%, 50%), 
                      hsl(360, 100%, 50%))`
                  },
                  '& .MuiSlider-rail': {
                    background: `linear-gradient(to right, 
                      hsl(0, 100%, 50%), 
                      hsl(60, 100%, 50%), 
                      hsl(120, 100%, 50%), 
                      hsl(180, 100%, 50%), 
                      hsl(240, 100%, 50%), 
                      hsl(300, 100%, 50%), 
                      hsl(360, 100%, 50%))`
                  },
                  '& .MuiSlider-thumb': {
                    backgroundColor: primaryHex,
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }
                }}
              />
            </Box>
          </Box>

          {/* Sekundärfarbe */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <PaletteIcon sx={{ mr: 1 }} />
              Sekundärfarbe
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 2, mb: 2 }}>
              <Box 
                sx={{ 
                  width: 60, 
                  height: 40, 
                  backgroundColor: secondaryHex,
                  border: '2px solid #ccc',
                  borderRadius: 2
                }} 
              />
              <TextField
                label="HEX Code"
                value={secondaryHex}
                onChange={(e) => handleSecondaryHexChange(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
                inputProps={{ pattern: '^#[0-9A-Fa-f]{6}$' }}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Farbspektrum: {Math.round(secondaryHue)}°</Typography>
              <Slider
                value={secondaryHue}
                onChange={(_, value) => handleSecondaryHueChange(value as number)}
                min={0}
                max={360}
                sx={{
                  '& .MuiSlider-track': {
                    background: `linear-gradient(to right, 
                      hsl(0, 100%, 50%), 
                      hsl(60, 100%, 50%), 
                      hsl(120, 100%, 50%), 
                      hsl(180, 100%, 50%), 
                      hsl(240, 100%, 50%), 
                      hsl(300, 100%, 50%), 
                      hsl(360, 100%, 50%))`
                  },
                  '& .MuiSlider-rail': {
                    background: `linear-gradient(to right, 
                      hsl(0, 100%, 50%), 
                      hsl(60, 100%, 50%), 
                      hsl(120, 100%, 50%), 
                      hsl(180, 100%, 50%), 
                      hsl(240, 100%, 50%), 
                      hsl(300, 100%, 50%), 
                      hsl(360, 100%, 50%))`
                  },
                  '& .MuiSlider-thumb': {
                    backgroundColor: secondaryHex,
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }
                }}
              />
            </Box>
          </Box>

          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<PaletteIcon />}
            onClick={handleColorsSave} 
            sx={{ 
              mt: 2,
              fontSize: { xs: '0.9rem', md: '1rem' },
              py: { xs: 1, md: 1.5 },
              px: { xs: 2, md: 3 }
            }}
          >
            Farben speichern
          </Button>
        </Box>
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
    </Box>
  );
};

export default AdminPage;
