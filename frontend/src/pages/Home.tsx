import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Container,
  IconButton,
  useTheme
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  ImportExport as ImportIcon,
  TrendingUp as TrendingIcon,
  Settings as SettingsIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface QuickActionCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  primary?: boolean;
}

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  const quickActions: QuickActionCard[] = [
    {
      title: 'Import Transactions',
      description: 'Import transactions from your bank or credit card statements',
      icon: <ImportIcon fontSize="large" />,
      path: '/import',
      primary: true
    },
    {
      title: 'View Accounts',
      description: 'Manage your accounts and view balances',
      icon: <AccountIcon fontSize="large" />,
      path: '/accounts'
    },
    {
      title: 'Analytics',
      description: 'View spending trends and financial insights',
      icon: <TrendingIcon fontSize="large" />,
      path: '/analytics'
    },
    {
      title: 'Settings',
      description: 'Configure your preferences and account settings',
      icon: <SettingsIcon fontSize="large" />,
      path: '/settings'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {currentUser?.name || 'User'}!
      </Typography>

      <Grid container spacing={3}>
        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: theme.palette.primary.main,
              color: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Total Balance
            </Typography>
            <Typography variant="h4">$0.00</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: theme.palette.secondary.main,
              color: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Monthly Income
            </Typography>
            <Typography variant="h4">$0.00</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: theme.palette.success.main,
              color: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Monthly Expenses
            </Typography>
            <Typography variant="h4">$0.00</Typography>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No recent transactions to display.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                ...(action.primary && {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                  borderStyle: 'solid'
                })
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ mb: 2, color: action.primary ? 'primary.main' : 'text.secondary' }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(action.path)}
                  color={action.primary ? 'primary' : 'inherit'}
                >
                  Get Started
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Activity</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={() => navigate('/transactions')}
          >
            Add Transaction
          </Button>
        </Box>
        <Typography color="text.secondary">
          No recent activity to display
        </Typography>
      </Paper>

      {/* Account Summary */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Account Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: theme.palette.background.default,
                  minWidth: 200
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Total Balance
                </Typography>
                <Typography variant="h5">$0.00</Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: theme.palette.background.default,
                  minWidth: 200
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Monthly Spending
                </Typography>
                <Typography variant="h5">$0.00</Typography>
              </Paper>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Quick Links</Typography>
              <IconButton size="small">
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" fullWidth onClick={() => navigate('/accounts/new')}>
                Add Account
              </Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/categories')}>
                Manage Categories
              </Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/reports')}>
                View Reports
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 