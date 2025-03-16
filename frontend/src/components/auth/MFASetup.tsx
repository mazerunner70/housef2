import React, { useState, useEffect } from 'react';
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
  Step,
  Stepper,
  StepLabel
} from '@mui/material';
import QRCode from 'qrcode.react';

const Container = styled(Paper)(({ theme }) => ({
  maxWidth: 600,
  margin: '0 auto',
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3)
}));

const QRContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius
}));

const steps = ['Generate Secret', 'Scan QR Code', 'Verify Code'];

const MFASetup: React.FC = () => {
  const { setupMFA, verifyMFA, loading } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [secretCode, setSecretCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeStep === 0) {
      generateSecretCode();
    }
  }, []);

  const generateSecretCode = async () => {
    setError(null);
    try {
      const secret = await setupMFA();
      setSecretCode(secret);
      // Generate QR code URL for authenticator apps
      const appName = 'HouseF2';
      const username = 'user@example.com'; // Replace with actual user email
      const otpAuthUrl = `otpauth://totp/${appName}:${username}?secret=${secret}&issuer=${appName}`;
      setQrCodeUrl(otpAuthUrl);
      setActiveStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate secret code');
    }
  };

  const handleVerification = async () => {
    setError(null);
    try {
      await verifyMFA(verificationCode);
      setActiveStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Generating your secret code...
            </Typography>
          </Box>
        );

      case 1:
        return (
          <>
            <Typography variant="body1" gutterBottom>
              1. Install an authenticator app if you haven't already (e.g., Google Authenticator, Authy)
            </Typography>
            <Typography variant="body1" gutterBottom>
              2. Scan this QR code with your authenticator app:
            </Typography>
            <QRContainer>
              <QRCode value={qrCodeUrl} size={200} level="H" />
              <Typography variant="caption" color="textSecondary">
                Can't scan? Use this code manually: {secretCode}
              </Typography>
            </QRContainer>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => setActiveStep(2)}
              sx={{ mt: 2 }}
            >
              Next
            </Button>
          </>
        );

      case 2:
        return (
          <>
            <Typography variant="body1" gutterBottom>
              Enter the 6-digit code from your authenticator app:
            </Typography>
            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={loading}
              error={!!error}
              helperText={error}
              inputProps={{
                maxLength: 6,
                pattern: '[0-9]*'
              }}
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleVerification}
              disabled={loading || verificationCode.length !== 6}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
          </>
        );

      case 3:
        return (
          <Alert severity="success">
            MFA has been successfully set up! You'll need to use your authenticator app code the next time you sign in.
          </Alert>
        );
    }
  };

  return (
    <Container>
      <Typography variant="h5" component="h1" align="center" gutterBottom>
        Set Up Two-Factor Authentication
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4 }}>{renderStepContent()}</Box>
    </Container>
  );
};

export default MFASetup; 