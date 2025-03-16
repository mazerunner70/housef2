import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Payments as PaymentsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    preferredName: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    monthlyReports: true,
    lowBalanceAlerts: true
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true
  });
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    language: 'en',
    theme: 'light',
    dateFormat: 'MM/DD/YYYY'
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser, updateProfile, setupMFA } = useAuth();
  const navigate = useNavigate();

  // Load user data from Cognito when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          // Get the full user profile from Cognito
          const cognitoUser = await authService.getCurrentUser();
          
          setProfileForm({
            firstName: cognitoUser.firstName || '',
            lastName: cognitoUser.lastName || '',
            email: cognitoUser.email || '',
            preferredName: cognitoUser.preferredName || ''
          });
          
          // Check if MFA is enabled
          setSecuritySettings(prev => ({
            ...prev,
            twoFactorAuth: cognitoUser.mfaEnabled || false
          }));
        } catch (err) {
          console.error('Failed to load user data:', err);
        }
      }
    };
    
    loadUserData();
  }, [currentUser]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSecurityChange = (setting: keyof typeof securitySettings) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handlePreferenceChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as keyof typeof preferences;
    const value = e.target.value as string;
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update the user's profile in Cognito
      await updateProfile({
        name: profileForm.preferredName || `${profileForm.firstName} ${profileForm.lastName}`
      });
      
      setSuccessMessage('Profile updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = () => {
    // In a real app, this would call an API to update the user's preferences
    setSuccessMessage('Preferences updated successfully');
  };

  const handleSetupMFA = async () => {
    navigate('/mfa-setup');
  };

  const handleChangePassword = async () => {
    navigate('/reset-password');
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading user settings...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<PersonIcon />} label="Profile" {...a11yProps(0)} />
            <Tab icon={<NotificationsIcon />} label="Notifications" {...a11yProps(1)} />
            <Tab icon={<SecurityIcon />} label="Security" {...a11yProps(2)} />
            <Tab icon={<PaymentsIcon />} label="Payment Methods" {...a11yProps(3)} />
            <Tab icon={<PaletteIcon />} label="Preferences" {...a11yProps(4)} />
          </Tabs>
        </Box>
        
        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={profileForm.firstName}
                onChange={handleProfileChange}
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
                value={profileForm.lastName}
                onChange={handleProfileChange}
                InputProps={{
                  readOnly: true, // Last name is read-only as it's managed by Cognito
                }}
                helperText="Managed by your account administrator"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                InputProps={{
                  readOnly: true, // Email is read-only as it's managed by Cognito
                }}
                helperText="Your email is used for account recovery and notifications"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preferred Name"
                name="preferredName"
                value={profileForm.preferredName}
                onChange={handleProfileChange}
                helperText="This is how you'll be addressed throughout the application"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Email Notifications"
                secondary="Receive notifications via email"
              />
              <Switch
                edge="end"
                checked={notificationSettings.emailNotifications}
                onChange={() => handleNotificationChange('emailNotifications')}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Push Notifications"
                secondary="Receive notifications on your device"
              />
              <Switch
                edge="end"
                checked={notificationSettings.pushNotifications}
                onChange={() => handleNotificationChange('pushNotifications')}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Monthly Reports"
                secondary="Receive monthly financial reports"
              />
              <Switch
                edge="end"
                checked={notificationSettings.monthlyReports}
                onChange={() => handleNotificationChange('monthlyReports')}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Low Balance Alerts"
                secondary="Get notified when your account balance is low"
              />
              <Switch
                edge="end"
                checked={notificationSettings.lowBalanceAlerts}
                onChange={() => handleNotificationChange('lowBalanceAlerts')}
              />
            </ListItem>
          </List>
        </TabPanel>
        
        {/* Security Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText
                primary="Two-Factor Authentication"
                secondary={securitySettings.twoFactorAuth ? 
                  "MFA is enabled for your account" : 
                  "Add an extra layer of security to your account"}
              />
              {securitySettings.twoFactorAuth ? (
                <Button variant="outlined" color="primary" disabled>
                  Enabled
                </Button>
              ) : (
                <Button variant="outlined" color="primary" onClick={handleSetupMFA}>
                  Set Up
                </Button>
              )}
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText
                primary="Login Notifications"
                secondary="Get notified when someone logs into your account"
              />
              <Switch
                edge="end"
                checked={securitySettings.loginNotifications}
                onChange={() => handleSecurityChange('loginNotifications')}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Change Password"
                secondary="Update your account password"
              />
              <Button variant="outlined" color="primary" onClick={handleChangePassword}>
                Change
              </Button>
            </ListItem>
          </List>
        </TabPanel>
        
        {/* Payment Methods Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Payment Methods
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            No payment methods are required for this application.
          </Alert>
        </TabPanel>
        
        {/* Preferences Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Application Preferences
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="currency-label">Currency</InputLabel>
                <Select
                  labelId="currency-label"
                  id="currency"
                  name="currency"
                  value={preferences.currency}
                  label="Currency"
                  onChange={handlePreferenceChange as any}
                >
                  <MenuItem value="USD">US Dollar ($)</MenuItem>
                  <MenuItem value="EUR">Euro (€)</MenuItem>
                  <MenuItem value="GBP">British Pound (£)</MenuItem>
                  <MenuItem value="JPY">Japanese Yen (¥)</MenuItem>
                  <MenuItem value="CAD">Canadian Dollar (C$)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="language-label">Language</InputLabel>
                <Select
                  labelId="language-label"
                  id="language"
                  name="language"
                  value={preferences.language}
                  label="Language"
                  onChange={handlePreferenceChange as any}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                  <MenuItem value="ja">Japanese</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="theme-label">Theme</InputLabel>
                <Select
                  labelId="theme-label"
                  id="theme"
                  name="theme"
                  value={preferences.theme}
                  label="Theme"
                  onChange={handlePreferenceChange as any}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="date-format-label">Date Format</InputLabel>
                <Select
                  labelId="date-format-label"
                  id="dateFormat"
                  name="dateFormat"
                  value={preferences.dateFormat}
                  label="Date Format"
                  onChange={handlePreferenceChange as any}
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSavePreferences}
              >
                Save Preferences
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings; 