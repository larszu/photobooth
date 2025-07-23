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

  // Virtual Keyboard Hooks
  const usernameKeyboard = useVirtualKeyboard(username, setUsername, { autoShow: false });
  const passwordKeyboard = useVirtualKeyboard(password, setPassword, { autoShow: false });

  // Prüfe ob eine Tastatur sichtbar ist
  const isAnyKeyboardVisible = usernameKeyboard.isKeyboardVisible || passwordKeyboard.isKeyboardVisible;

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

      if (data.success && authContext) {
        await authContext.login(data.token, data.user);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        // Navigate wird automatisch durch AuthContext gehandelt
      } else {
        setError(data.message || 'Ungültige Anmeldedaten');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Back Button - außerhalb des animierten Containers */}
      <IconButton
        onClick={handleBack}
        sx={{
          position: 'fixed',
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

      <Box
        data-container="login"
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          px: 2,
          py: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          // Ganzer Container bewegt sich nach oben bei Tastatur
          transform: isAnyKeyboardVisible ? 'translateY(-120px)' : 'translateY(0)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
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
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              sx={{
                mt: 1,
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
              }}
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      </Box>

      {/* OnScreenKeyboards - kompakt für Login-Seite, außerhalb der Box */}
      <OnScreenKeyboard
        isVisible={usernameKeyboard.isKeyboardVisible}
        onKeyPress={usernameKeyboard.handleKeyPress}
        onBackspace={usernameKeyboard.handleBackspace}
        onEnter={usernameKeyboard.handleEnter}
        onClose={usernameKeyboard.hideKeyboard}
        position="bottom"
        avoidCollision={true}
        maxHeightPercent={30}
      />
      
      <OnScreenKeyboard
        isVisible={passwordKeyboard.isKeyboardVisible}
        onKeyPress={passwordKeyboard.handleKeyPress}
        onBackspace={passwordKeyboard.handleBackspace}
        onEnter={passwordKeyboard.handleEnter}
        onClose={passwordKeyboard.hideKeyboard}
        position="bottom"
        avoidCollision={true}
        maxHeightPercent={30}
      />
    </>
  );
};

export default LoginPage;
