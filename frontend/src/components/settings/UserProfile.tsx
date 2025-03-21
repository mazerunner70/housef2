import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';

const ProfileContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3)
}));

interface ProfileFormData {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
}

const UserProfile: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    preferredName: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.name.split(' ')[0] || '',
        lastName: currentUser.name.split(' ').slice(1).join(' ') || '',
        preferredName: currentUser.name || '',
        email: currentUser.email || ''
      });
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update the user's profile
      await updateProfile({
        name: formData.preferredName || `${formData.firstName} ${formData.lastName}`
      });
      
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading user profile...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        User Profile
      </Typography>
      
      <ProfileContainer>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
                InputProps={{
                  readOnly: true, // First name is read-only as it's managed by Cognito
                }}
                helperText="Managed by your account administrator"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
                InputProps={{
                  readOnly: true, // Last name is read-only as it's managed by Cognito
                }}
                helperText="Managed by your account administrator"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Preferred Name"
                name="preferredName"
                value={formData.preferredName}
                onChange={handleChange}
                disabled={loading}
                helperText="This is how you'll be addressed throughout the application"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                disabled={loading}
                InputProps={{
                  readOnly: true, // Email is read-only as it's managed by Cognito
                }}
                helperText="Your email is used for account recovery and notifications"
              />
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </ProfileContainer>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Profile updated successfully"
      />
    </Box>
  );
};

export default UserProfile; 