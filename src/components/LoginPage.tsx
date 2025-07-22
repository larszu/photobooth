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
import SimpleKeyboard from './SimpleKeyboard';
import { useSimpleKeyboard } from '../hooks/useSimpleKeyboard';

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

  // Simple Keyboard Hook
  const { isKeyboardVisible, showKeyboard, hideKeyboard, currentInputRef } = useSimpleKeyboard();

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
    <Container
      maxWidth="sm"
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        px: 2,
      }}
    >
      {/* Back Button */}
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
              onFocus={() => {
                currentInputRef.current = { value: username, setValue: setUsername };
                showKeyboard();
              }}
              onBlur={hideKeyboard}
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
              onFocus={() => {
                currentInputRef.current = { value: password, setValue: setPassword };
                showKeyboard();
              }}
              onBlur={hideKeyboard}
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

      {/* Simple Keyboard */}
      <SimpleKeyboard 
        isVisible={isKeyboardVisible}
        currentValue={currentInputRef.current?.value || ''}
        onInput={(value) => {
          if (currentInputRef.current?.setValue) {
            currentInputRef.current.setValue(value);
          }
        }}
        onClose={hideKeyboard}
      />
    </Container>
  );
};

export default LoginPage;
