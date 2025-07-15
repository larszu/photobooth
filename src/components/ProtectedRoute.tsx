import React, { useContext } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import LoginPage from './LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('ProtectedRoute muss innerhalb eines AuthProvider verwendet werden');
  }

  const { isAuthenticated, loading } = authContext;

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Authentifizierung wird überprüft...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
