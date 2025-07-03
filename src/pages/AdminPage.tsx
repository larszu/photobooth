import React, { useState } from 'react';
import { Box, Typography, AppBar, Toolbar, IconButton, Button, TextField, Snackbar, Alert, ToggleButtonGroup, ToggleButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import WifiIcon from '@mui/icons-material/Wifi';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import UploadIcon from '@mui/icons-material/Upload';
import { useNavigate } from 'react-router-dom';

const AdminPage: React.FC = () => {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [brandingType, setBrandingType] = useState<'logo' | 'text'>('logo');
  const [brandingText, setBrandingText] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleWifiSave = async () => {
    const res = await fetch('/api/admin/wifi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssid, password })
    });
    const data = await res.json();
    setSnackbar({ open: true, message: data.message || 'Gespeichert', severity: data.success ? 'success' : 'error' });
  };

  const handleDeleteAll = async () => {
    const res = await fetch('/api/photos', { method: 'DELETE' });
    const data = await res.json();
    setSnackbar({ open: true, message: data.success ? 'Alle Fotos gelöscht' : 'Fehler beim Löschen', severity: data.success ? 'success' : 'error' });
  };

  const handleBrandingType = (_: any, value: 'logo' | 'text') => {
    if (value) setBrandingType(value);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      const formData = new FormData();
      formData.append('logo', e.target.files[0]);
      await fetch('/api/admin/branding/logo', { method: 'POST', body: formData });
      setSnackbar({ open: true, message: 'Logo hochgeladen', severity: 'success' });
    }
  };

  const handleBrandingTextSave = async () => {
    await fetch('/api/admin/branding/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: brandingText })
    });
    setSnackbar({ open: true, message: 'Text gespeichert', severity: 'success' });
  };

  return (
    <Box>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/gallery')}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Admin</Typography>
        </Toolbar>
      </AppBar>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>WLAN-Zugangsdaten</Typography>
        <TextField label="SSID" value={ssid} onChange={e => setSsid(e.target.value)} fullWidth margin="normal" InputProps={{ startAdornment: <WifiIcon sx={{ mr: 1 }} /> }} />
        <TextField label="Passwort" value={password} onChange={e => setPassword(e.target.value)} fullWidth margin="normal" type="password" />
        <Button variant="contained" color="primary" onClick={handleWifiSave} sx={{ mt: 2 }}>Speichern</Button>
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>Alle Fotos löschen</Typography>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteAll}>Alle Fotos löschen</Button>
        </Box>
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>Custom Branding</Typography>
          <ToggleButtonGroup value={brandingType} exclusive onChange={handleBrandingType} sx={{ mb: 2 }}>
            <ToggleButton value="logo" aria-label="Logo"><BrandingWatermarkIcon sx={{ mr: 1 }} />Logo</ToggleButton>
            <ToggleButton value="text" aria-label="Text"><TextFieldsIcon sx={{ mr: 1 }} />Text</ToggleButton>
          </ToggleButtonGroup>
          {brandingType === 'logo' ? (
            <Box>
              <Button variant="contained" component="label" startIcon={<UploadIcon />}>
                Logo hochladen
                <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
              </Button>
              {logoFile && <Typography mt={1}>{logoFile.name}</Typography>}
              <Box mt={2}>
                <Typography variant="body2">QR-Code zum Logo-Upload:</Typography>
                <img src="/api/admin/branding/logo-qr" alt="Logo Upload QR" style={{ width: 120, height: 120 }} />
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
              />
              <Button variant="contained" color="primary" onClick={handleBrandingTextSave} sx={{ mt: 1 }}>Text speichern</Button>
            </Box>
          )}
        </Box>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPage;
