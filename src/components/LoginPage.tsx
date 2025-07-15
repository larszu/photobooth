import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Container
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import OnScreenKeyboard from './OnScreenKeyboard';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  // Virtuelle Tastatur für Username
  const usernameKeyboard = useVirtualKeyboard(username, setUsername, { autoShow: true });
  
  // Virtuelle Tastatur für Password
  const passwordKeyboard = useVirtualKeyboard(password, setPassword, { autoShow: true });

  // Deaktiviere Auto-Logout auf der Login-Seite
  useEffect(() => {
    if (authContext?.disableAutoLogout) {
      authContext.disableAutoLogout();
    }
  }, [authContext]);

  const handleBack = () => {
    navigate('/gallery');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (authContext) {
          authContext.login(data.token, data.user);
        }
        
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        console.log('✅ Login erfolgreich:', data.user);
      } else {
        setError(data.message || 'Anmeldung fehlgeschlagen');
      }
    } catch (error) {
      console.error('❌ Login-Fehler:', error);
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', position: 'relative' }}>
      {/* Zurück-Button */}
      <IconButton
        onClick={handleBack}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
          },
          boxShadow: 2,
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Card
        sx={{
          width: '100%',
          maxWidth: 400,
          mx: 'auto',
          boxShadow: 4,
          borderRadius: 3,
          background: 'linear-gradient(145deg, #f5f5f5 0%, #ffffff 100%)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <AdminPanelSettingsIcon 
              sx={{ 
                fontSize: 48, 
                color: 'primary.main',
                mb: 1 
              }} 
            />
            <Typography variant="h4" component="h1" gutterBottom>
              Admin Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Photobooth Verwaltung
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              autoComplete="username"
              autoFocus
              disabled={loading}
              sx={{ mb: 2 }}
              onFocus={usernameKeyboard.showKeyboard}
              onBlur={() => {
                // Tastatur bleibt offen für Touch-Geräte
              }}
            />
            
            <TextField
              fullWidth
              label="Passwort"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
              onFocus={passwordKeyboard.showKeyboard}
              onBlur={() => {
                // Tastatur bleibt offen für Touch-Geräte
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Standard: admin / photobooth2025
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Virtuelle Tastaturen */}
      <OnScreenKeyboard
        isVisible={usernameKeyboard.isKeyboardVisible}
        onKeyPress={usernameKeyboard.handleKeyPress}
        onBackspace={usernameKeyboard.handleBackspace}
        onEnter={usernameKeyboard.handleEnter}
        onClose={usernameKeyboard.hideKeyboard}
        position="bottom"
      />

      <OnScreenKeyboard
        isVisible={passwordKeyboard.isKeyboardVisible}
        onKeyPress={passwordKeyboard.handleKeyPress}
        onBackspace={passwordKeyboard.handleBackspace}
        onEnter={passwordKeyboard.handleEnter}
        onClose={passwordKeyboard.hideKeyboard}
        position="bottom"
      />
    </Container>
  );
};

export default LoginPage;
