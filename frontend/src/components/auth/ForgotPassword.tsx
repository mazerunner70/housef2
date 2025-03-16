import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Link
} from '@mui/material';

const ForgotPassword: React.FC = () => {
  const { resetPassword, confirmPasswordReset, loading } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const steps = ['Request Reset', 'Enter Code', 'Set New Password'];

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await resetPassword(email);
      setActiveStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError(null);

    try {
      await confirmPasswordReset(email, code, newPassword);
      setSuccess(true);
      setActiveStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box component="form" onSubmit={handleRequestReset} noValidate>
            <Typography variant="body1" gutterBottom>
              Enter your email address and we'll send you a code to reset your password.
            </Typography>
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
              error={!!error}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !email}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Reset Code'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box component="form" onSubmit={(e) => {
            e.preventDefault();
            setActiveStep(2);
          }} noValidate>
            <Typography variant="body1" gutterBottom>
              Enter the verification code sent to your email.
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="code"
              label="Verification Code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              error={!!error}
              inputProps={{
                maxLength: 6,
                pattern: '[0-9]*'
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || code.length !== 6}
              sx={{ mt: 2 }}
            >
              Next
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => setActiveStep(0)}
              sx={{ mt: 1 }}
            >
              Back
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box component="form" onSubmit={handleResetPassword} noValidate>
            <Typography variant="body1" gutterBottom>
              Enter your new password.
            </Typography>
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
              error={!!error}
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
              error={!!error}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !newPassword || !confirmPassword}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => setActiveStep(1)}
              sx={{ mt: 1 }}
            >
              Back
            </Button>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Your password has been successfully reset!
            </Alert>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/login')}
            >
              Return to Login
            </Button>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          maxWidth: 400, 
          margin: '0 auto', 
          padding: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2 
        }}
      >
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          Reset Password
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </Paper>
    </Box>
  );
};

export default ForgotPassword; 