import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    if (showNewPassword) {
      if (!newPassword) {
        setError('Please enter a new password');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      try {
        setError(null);
        setLoading(true);
        
        // Call login with new password
        await login(email, password, undefined, newPassword);
        navigate('/');
      } catch (err: any) {
        console.error('Login error:', err);
        setError(err.message || 'Failed to set new password');
        setLoading(false);
      }
      return;
    }
    
    if (showMfa) {
      if (!mfaCode) {
        setError('Please enter your MFA code');
        return;
      }
      
      try {
        setError(null);
        setLoading(true);
        
        // Call login with MFA code
        await login(email, password, mfaCode);
        navigate('/');
      } catch (err: any) {
        console.error('Login error:', err);
        setError(err.message || 'Invalid MFA code');
        setLoading(false);
      }
      return;
    }
    
    // Regular login
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      
      // Call the actual login function
      await login(email, password);
      
      // Navigate to home page after successful login
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error cases
      if (err.message === 'MFA code required') {
        setShowMfa(true);
        setError(null);
      } else if (err.message === 'NEW_PASSWORD_REQUIRED') {
        setShowNewPassword(true);
        setError(null);
      } else {
        setError(err.message || 'Failed to log in. Please check your credentials.');
      }
      
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            {showMfa ? 'Enter MFA Code' : showNewPassword ? 'Set New Password' : 'Sign In'}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            {!showMfa && !showNewPassword && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </>
            )}
            
            {showMfa && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="mfaCode"
                label="MFA Code"
                name="mfaCode"
                autoFocus
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                disabled={loading}
              />
            )}
            
            {showNewPassword && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="newPassword"
                  label="New Password"
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 
                showMfa ? 'Verify' : 
                showNewPassword ? 'Set Password' : 
                'Sign In'}
            </Button>
            
            {!showMfa && !showNewPassword && (
              <>
                <Grid container>
                  <Grid item xs>
                    <Link component={RouterLink} to="/forgot-password" variant="body2">
                      Forgot password?
                    </Link>
                  </Grid>
                  <Grid item>
                    <Link component={RouterLink} to="/register" variant="body2">
                      {"Don't have an account? Sign Up"}
                    </Link>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="body2" color="text.secondary" align="center">
                  Demo credentials: demo@example.com / password
                </Typography>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 