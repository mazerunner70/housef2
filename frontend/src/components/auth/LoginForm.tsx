import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Link
} from '@mui/material';

const FormContainer = styled(Paper)(({ theme }) => ({
  maxWidth: 400,
  margin: '0 auto',
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2]
}));

const LoginForm: React.FC = () => {
  const { signIn, isLoading, error, currentEmail, setCurrentEmail, tempPassword, setTempPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Debug email changes
  useEffect(() => {
    console.log('📧 Email state changed:', {
      email: currentEmail,
      showNewPassword,
      error,
      stack: new Error().stack // This will show us where the change was triggered from
    });
  }, [currentEmail]);

  // Handle AuthContext error state
  useEffect(() => {
    console.log('🔄 Auth error changed:', { error, showNewPassword });
    if (error === 'NEW_PASSWORD_REQUIRED' && !showNewPassword) {
      console.log('🔐 Setting new password form from auth error');
      setShowNewPassword(true);
      // Store the current password as tempPassword when transitioning to new password form
      if (password) {
        console.log('📝 Storing temporary password');
        setTempPassword(password);
        setPassword('');
      }
    }
  }, [error, password, setTempPassword]);

  // Debug state changes
  useEffect(() => {
    console.log('🔄 Form state changed:', {
      showNewPassword,
      showMfa,
      hasPassword: !!password,
      hasNewPassword: !!newPassword,
      hasTempPassword: !!tempPassword,
      currentEmail,
      error,
      localError
    });
  }, [showNewPassword, showMfa, password, newPassword, tempPassword, error, localError, currentEmail]);

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough) return 'Password must be at least 8 characters long';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumbers) return 'Password must contain at least one number';
    if (!hasSpecialChar) return 'Password must contain at least one special character';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLastError(null);
    console.log('🔍 Submit handler started', { 
      showNewPassword, 
      showMfa, 
      hasPassword: !!password,
      hasNewPassword: !!newPassword,
      hasTempPassword: !!tempPassword,
      currentEmail 
    });

    if (showNewPassword) {
      console.log('🔐 Attempting password change');
      
      // Validate email
      if (!currentEmail) {
        console.log('❌ Email is required');
        setLocalError('Email is required');
        return;
      }

      // Validate temp password
      if (!tempPassword) {
        console.log('❌ Previous password is missing');
        setLocalError('Previous password is missing. Please try signing in again.');
        return;
      }

      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        console.log('❌ Password validation failed:', passwordError);
        setLocalError(passwordError);
        return;
      }
      if (newPassword !== confirmPassword) {
        console.log('❌ Passwords do not match');
        setLocalError('Passwords do not match');
        return;
      }

      try {
        console.log('📤 Sending new password request', { 
          email: currentEmail, 
          hasTempPassword: !!tempPassword,
          hasNewPassword: !!newPassword 
        });
        await signIn({ 
          email: currentEmail, 
          password: tempPassword, 
          newPassword 
        });
        console.log('✅ Password change successful');
        // Reset form state after successful password change and navigate
        setShowNewPassword(false);
        setTempPassword('');
        setNewPassword('');
        setConfirmPassword('');
        navigate('/');
      } catch (error) {
        console.error('❌ Password change error:', error);
        if (error instanceof Error) {
          setLastError(error.message);
          if (error.message === 'NEW_PASSWORD_REQUIRED') {
            console.log('🔄 Still requiring new password, retrying with new password as temp');
            setTempPassword(newPassword);
            setNewPassword('');
            setConfirmPassword('');
          } else {
            setLocalError(error.message);
          }
        }
      }
      return;
    }

    try {
      console.log('🔑 Attempting sign in', { 
        email: currentEmail, 
        hasPassword: !!password,
        hasMfaCode: !!mfaCode 
      });
      await signIn({ email: currentEmail, password, mfaCode });
      console.log('✅ Sign in successful');
      // Add navigation after successful sign in
      navigate('/');
    } catch (error) {
      console.error('❌ Sign in error:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        fullError: JSON.stringify(error, null, 2)
      });

      if (error instanceof Error) {
        setLastError(error.message);
        console.log('🔍 Checking error type:', {
          message: error.message,
          isNewPasswordRequired: error.message === 'NEW_PASSWORD_REQUIRED',
          isMfaRequired: error.message === 'MFA code required',
          currentEmail: currentEmail
        });

        if (error.message === 'MFA code required') {
          console.log('📱 MFA required, showing MFA input');
          setShowMfa(true);
          setLocalError('Please enter your MFA code');
        } else if (error.message === 'NEW_PASSWORD_REQUIRED') {
          console.log('🔐 New password required, showing password change form', {
            email: currentEmail,
            password
          });
          setShowNewPassword(true);
          setTempPassword(password);
          setPassword('');
          setLocalError('You must set a new password that meets the requirements');
        } else {
          console.log('⚠️ Other error:', error.message);
          setLocalError(error.message);
        }
      }
    }
  };

  return (
    <FormContainer elevation={3}>
      <Typography variant="h5" component="h1" align="center" gutterBottom>
        {showNewPassword ? 'Set New Password' : 'Sign In'}
      </Typography>

      {(error || localError) && !(showNewPassword && error === 'NEW_PASSWORD_REQUIRED') && (
        <Alert severity={showNewPassword ? 'info' : 'error'} onClose={() => setLocalError(null)}>
          {error || localError}
        </Alert>
      )}

      {showNewPassword && (
        <Alert severity="info" sx={{ mt: 1 }}>
          Password requirements:
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>At least 8 characters long</li>
            <li>At least one uppercase letter</li>
            <li>At least one lowercase letter</li>
            <li>At least one number</li>
            <li>At least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)</li>
          </ul>
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus={!showNewPassword}
          value={currentEmail}
          onChange={(e) => setCurrentEmail(e.target.value)}
          disabled={isLoading || showMfa}
          error={!!error && !showMfa && !showNewPassword}
          InputProps={{
            readOnly: showNewPassword
          }}
        />

        {!showNewPassword ? (
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
            disabled={isLoading || showMfa}
            error={!!error && !showMfa}
          />
        ) : (
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
              disabled={isLoading}
              error={!!error}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              error={!!error || (confirmPassword !== '' && newPassword !== confirmPassword)}
              color={confirmPassword !== '' && newPassword === confirmPassword ? 'success' : undefined}
              helperText={
                confirmPassword !== '' && 
                (newPassword === confirmPassword 
                  ? '✓ Passwords match' 
                  : '✗ Passwords do not match')
              }
            />
          </>
        )}

        {showMfa && (
          <TextField
            margin="normal"
            required
            fullWidth
            name="mfaCode"
            label="MFA Code"
            type="text"
            id="mfaCode"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            disabled={isLoading}
            error={!!error}
            helperText="Enter the 6-digit code from your authenticator app"
            inputProps={{
              maxLength: 6,
              pattern: '[0-9]*'
            }}
          />
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={isLoading || (showMfa && mfaCode.length !== 6)}
          sx={{ mt: 3, mb: 2 }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            showNewPassword ? 'Set New Password' : (showMfa ? 'Verify MFA' : 'Sign In')
          )}
        </Button>

        {!showNewPassword && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/forgot-password')}
              sx={{ textDecoration: 'none' }}
            >
              Forgot your password?
            </Link>
          </Box>
        )}

        {showMfa && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="text"
              color="primary"
              size="small"
              onClick={() => {
                setShowMfa(false);
                setMfaCode('');
                setLocalError(null);
              }}
              disabled={isLoading}
            >
              Back to Sign In
            </Button>
          </Box>
        )}
      </Box>
    </FormContainer>
  );
};

export default LoginForm; 