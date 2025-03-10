import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper
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
  const { signIn, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      await signIn({ email, password, mfaCode });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'MFA code required') {
          setShowMfa(true);
          setLocalError('Please enter your MFA code');
        } else {
          setLocalError(error.message);
        }
      }
    }
  };

  return (
    <FormContainer elevation={3}>
      <Typography variant="h5" component="h1" align="center" gutterBottom>
        Sign In
      </Typography>

      {(error || localError) && (
        <Alert severity="error" onClose={() => setLocalError(null)}>
          {error || localError}
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
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading || showMfa}
          error={!!error && !showMfa}
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
          disabled={isLoading || showMfa}
          error={!!error && !showMfa}
        />

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
            showMfa ? 'Verify MFA' : 'Sign In'
          )}
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="text"
            color="primary"
            size="small"
            href="/forgot-password"
            disabled={isLoading}
          >
            Forgot Password?
          </Button>
          {showMfa && (
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
          )}
        </Box>
      </Box>
    </FormContainer>
  );
};

export default LoginForm; 