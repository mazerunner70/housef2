import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';
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
  StepLabel
} from '@mui/material';

const Container = styled(Paper)(({ theme }) => ({
  maxWidth: 400,
  margin: '0 auto',
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}));

const steps = ['Request Reset', 'Enter Code', 'Set New Password'];

const ForgotPassword: React.FC = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await forgotPassword(email);
      setActiveStep(1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(email, code, newPassword);
      setSuccess(true);
      setActiveStep(3);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
              error={!!error}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !email}
              sx={{ mt: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Send Reset Code'}
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
              disabled={isLoading}
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
              disabled={isLoading || code.length !== 6}
              sx={{ mt: 2 }}
            >
              Next
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
              disabled={isLoading}
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
              disabled={isLoading}
              error={!!error}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !newPassword || !confirmPassword}
              sx={{ mt: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Alert severity="success">
              Your password has been successfully reset. You can now log in with your new password.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              href="/login"
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Box>
        );
    }
  };

  return (
    <Container>
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

      <Box sx={{ mt: 2 }}>{renderStepContent()}</Box>
    </Container>
  );
};

export default ForgotPassword; 