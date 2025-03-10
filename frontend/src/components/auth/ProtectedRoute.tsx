import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireMfa?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireMfa = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireMfa && !user?.mfaEnabled) {
    // Redirect to MFA setup if required but not enabled
    return <Navigate to="/setup-mfa" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 