import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireMfa?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireMfa = false }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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

  if (!currentUser) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // MFA check is removed since it's not part of the current user model
  // If MFA is needed, it should be added to the User interface in AuthContext

  return <>{children}</>;
};

export default ProtectedRoute; 