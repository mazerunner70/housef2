import React from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Button,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h1" variant="h4">
                Welcome{currentUser?.name ? `, ${currentUser.name}` : ''}
              </Typography>
              <Button 
                variant="contained" 
                component={Link} 
                to="/import"
                startIcon={<UploadIcon />}
              >
                Import Transactions
              </Button>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Here's an overview of your financial situation. Track your spending, manage your accounts, and stay on top of your finances.
            </Typography>
          </Paper>
        </Grid>
        
        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
            }}
          >
            <Typography component="h2" variant="h6" color="inherit" gutterBottom>
              Total Balance
            </Typography>
            <Typography component="p" variant="h4" color="inherit">
              $24,500.00
            </Typography>
            <Typography color="inherit" sx={{ flex: 1 }}>
              across all accounts
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccountBalanceIcon />
              <Typography variant="body2" color="inherit" sx={{ ml: 1 }}>
                Updated just now
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'success.light',
              color: 'success.contrastText',
            }}
          >
            <Typography component="h2" variant="h6" color="inherit" gutterBottom>
              Income (This Month)
            </Typography>
            <Typography component="p" variant="h4" color="inherit">
              $4,200.00
            </Typography>
            <Typography color="inherit" sx={{ flex: 1 }}>
              15% increase from last month
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon />
              <Typography variant="body2" color="inherit" sx={{ ml: 1 }}>
                Updated today
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'error.light',
              color: 'error.contrastText',
            }}
          >
            <Typography component="h2" variant="h6" color="inherit" gutterBottom>
              Expenses (This Month)
            </Typography>
            <Typography component="p" variant="h4" color="inherit">
              $3,100.00
            </Typography>
            <Typography color="inherit" sx={{ flex: 1 }}>
              5% decrease from last month
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ReceiptIcon />
              <Typography variant="body2" color="inherit" sx={{ ml: 1 }}>
                Updated today
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Recent Transactions
              </Typography>
              <Button 
                component={Link} 
                to="/transactions" 
                size="small"
              >
                View all
              </Button>
            </Box>
            <Divider />
            <Box sx={{ mt: 2 }}>
              {/* Mock transaction data */}
              {[
                { id: 1, date: '2023-05-15', description: 'Grocery Store', amount: -120.45, category: 'Food' },
                { id: 2, date: '2023-05-14', description: 'Salary Deposit', amount: 2500.00, category: 'Income' },
                { id: 3, date: '2023-05-13', description: 'Electric Bill', amount: -85.20, category: 'Utilities' },
                { id: 4, date: '2023-05-12', description: 'Restaurant', amount: -45.80, category: 'Dining' },
                { id: 5, date: '2023-05-10', description: 'Gas Station', amount: -38.50, category: 'Transportation' },
              ].map((transaction) => (
                <Box 
                  key={transaction.id}
                  sx={{ 
                    py: 1.5, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box>
                    <Typography variant="body1">
                      {transaction.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: transaction.amount >= 0 ? 'success.main' : 'error.main'
                    }}
                  >
                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="div">
                    Add Transaction
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manually add a new transaction to your account
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to="/transactions">Go</Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="div">
                    Import Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Import transactions from CSV or connect to your bank
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to="/import">Go</Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="div">
                    Manage Accounts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add, edit, or remove your financial accounts
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to="/accounts">Go</Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="div">
                    Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configure your preferences and account settings
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to="/settings">Go</Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 